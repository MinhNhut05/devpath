// onboarding.service.ts - Business logic cho onboarding flow
//
// Service chứa toàn bộ logic, controller chỉ gọi service.
// Pattern: Controller nhận request → gọi Service → Service trả về data
//
// PrismaService được inject qua constructor (Dependency Injection).
// PrismaModule là @Global() → không cần import lại trong OnboardingModule.

import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import type { OnboardingRound, UserLearningPath } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { AiService } from '../ai/index.js';
import { ONBOARDING_QUESTIONS } from './constants/index.js';
import type { OnboardingQuestion } from './constants/index.js';
import type { SubmitOnboardingDto } from './dto/index.js';
import type { ConfirmPathDto } from './dto/index.js';
import {
  buildOnboardingPrompt,
  parseRecommendation,
  getFallbackRecommendation,
} from './recommendation/index.js';
import type { RecommendationResult, OnboardingDataInput } from './recommendation/index.js';

@Injectable()
export class OnboardingService {
  // Logger giúp debug khi AI fail ở production
  // 'OnboardingService' là context name → dễ filter trong log
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    // AiService la @Global() shared module -> tu dong available
    // Khong can import AiModule trong OnboardingModule
    private readonly aiService: AiService,
  ) {}

  // ── GET /onboarding/questions ─────────────────────────────────────────────

  /**
   * Trả về danh sách câu hỏi onboarding (static data từ constants).
   * Không cần DB query → response nhanh.
   */
  getQuestions(): OnboardingQuestion[] {
    return ONBOARDING_QUESTIONS;
  }

  // ── POST /onboarding/submit ───────────────────────────────────────────────

  /**
   * Lưu câu trả lời onboarding vào DB dưới dạng round 1.
   * Answers được lưu dưới dạng JSON với stable question IDs.
   */
  async submitAnswers(userId: string, dto: SubmitOnboardingDto): Promise<OnboardingRound> {
    // ── Bước 1: Check duplicate round 1 ──────────────────────────────────────
    //
    // findUnique sử dụng compound unique key userId_roundNumber
    // → Mỗi user chỉ có 1 round 1
    const existing = await this.prisma.onboardingRound.findUnique({
      where: { userId_roundNumber: { userId, roundNumber: 1 } },
    });

    if (existing) {
      // ConflictException → NestJS tự convert sang HTTP 409
      throw new ConflictException('Onboarding already completed');
    }

    // ── Bước 2: Tạo OnboardingRound record ──────────────────────────────────
    //
    // Lưu answers dưới dạng JSON với stable question ID keys
    // → Không lưu Vietnamese labels hay question text
    // → Dễ reuse cho recommendation, profile, và future rounds
    const onboardingRound = await this.prisma.onboardingRound.create({
      data: {
        userId,
        roundNumber: 1,
        answers: {
          careerGoal: dto.careerGoal,
          priorKnowledge: dto.priorKnowledge,
          learningBackground: dto.learningBackground,
          hoursPerWeek: dto.hoursPerWeek,
        },
        completedAt: new Date(),
      },
    });

    return onboardingRound;
  }

  // ── GET /onboarding/recommendation ───────────────────────────────────────

  /**
   * Gợi ý learning path phù hợp dựa trên câu trả lời onboarding round 1.
   *
   * Flow:
   *   1. Đọc OnboardingRound round 1 từ DB (user phải submit trước)
   *   2. Reconstruct OnboardingDataInput từ round answers
   *   3. Build prompt từ data
   *   4. Gọi AI API → parse JSON response
   *   5. Nếu AI fail / parse null → dùng rule-based fallback
   *   6. Return RecommendationResult (source: 'ai' | 'fallback')
   */
  async getRecommendation(userId: string): Promise<RecommendationResult> {
    // ── Bước 1: Đọc OnboardingRound round 1 từ DB ────────────────────────────
    //
    // User phải submit answers trước khi lấy recommendation
    // Sử dụng compound unique key userId_roundNumber để lookup
    const round = await this.prisma.onboardingRound.findUnique({
      where: { userId_roundNumber: { userId, roundNumber: 1 } },
    });

    if (!round) {
      throw new NotFoundException('Please complete onboarding first');
    }

    // ── Bước 2: Reconstruct OnboardingDataInput từ round answers ──────────────
    //
    // Round answers là JSON object chứa stable question ID keys
    // Cast sang OnboardingDataInput để reuse existing prompt builder
    const answers = round.answers as Record<string, unknown>;
    const input: OnboardingDataInput = {
      careerGoal: answers.careerGoal as OnboardingDataInput['careerGoal'],
      priorKnowledge: answers.priorKnowledge,
      learningBackground: answers.learningBackground as OnboardingDataInput['learningBackground'],
      hoursPerWeek: answers.hoursPerWeek as number,
    };

    const { systemPrompt, userMessage } = buildOnboardingPrompt(input);

    // ── Bước 3: Gọi AI và parse response ────────────────────────────────────
    try {
      const rawText = await this.aiService.chat(systemPrompt, userMessage);

      const parsed = parseRecommendation(rawText);

      if (parsed !== null) {
        return parsed; // source: 'ai'
      }

      this.logger.warn(
        `AI response failed validation for userId=${userId}, using fallback`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `AI API error for userId=${userId}: ${message} — using fallback`,
      );
    }

    // ── Bước 4: Fallback rule-based ──────────────────────────────────────────
    return getFallbackRecommendation(input);
  }

  // ── POST /onboarding/confirm ──────────────────────────────────────────────

  /**
   * User confirm learning path đã chọn.
   * Tạo UserLearningPath với currentLessonId = bài đầu tiên của path.
   */
  async confirmPath(
    userId: string,
    dto: ConfirmPathDto,
  ): Promise<UserLearningPath> {
    // ── Bước 1: Validate path tồn tại + isPublished ─────────────────────────
    const learningPath = await this.prisma.learningPath.findFirst({
      where: {
        id: dto.learningPathId,
        isPublished: true,
      },
    });

    if (!learningPath) {
      throw new NotFoundException('Learning path not found');
    }

    // ── Bước 2: Check duplicate enrollment ──────────────────────────────────
    const existingEnrollment = await this.prisma.userLearningPath.findUnique({
      where: {
        userId_learningPathId: {
          userId,
          learningPathId: dto.learningPathId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('You have already enrolled in this path');
    }

    // ── Bước 3: Tìm first Track → first TrackLesson ─────────────────────────
    const firstTrack = await this.prisma.track.findFirst({
      where: { learningPathId: dto.learningPathId },
      orderBy: { order: 'asc' },
    });

    if (!firstTrack) {
      throw new UnprocessableEntityException(
        'This learning path has no tracks',
      );
    }

    const firstTrackLesson = await this.prisma.trackLesson.findFirst({
      where: { trackId: firstTrack.id },
      orderBy: { order: 'asc' },
    });

    if (!firstTrackLesson) {
      throw new UnprocessableEntityException(
        'This learning path has no lessons',
      );
    }

    // ── Bước 4: Create UserLearningPath ─────────────────────────────────────
    const userLearningPath = await this.prisma.$transaction(async (tx) => {
      return tx.userLearningPath.create({
        data: {
          userId,
          learningPathId: dto.learningPathId,
          currentLessonId: firstTrackLesson.lessonId,
        },
      });
    });

    return userLearningPath;
  }
}
