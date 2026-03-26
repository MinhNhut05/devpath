// onboarding.service.ts - Business logic cho onboarding flow
//
// Service chứa toàn bộ logic, controller chỉ gọi service.
// Pattern: Controller nhận request → gọi Service → Service trả về data
//
// PrismaService được inject qua constructor (Dependency Injection).
// PrismaModule là @Global() → không cần import lại trong OnboardingModule.

import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { CareerGoal } from '@prisma/client';
import type { OnboardingRound, UserLearningPath } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { AiService } from '../ai/index.js';
import { LearnerProfileService } from '../learner-profile/learner-profile.service.js';
import {
  ONBOARDING_QUESTIONS,
  ROUND_TWO_QUESTIONS,
  getRoundThreeQuestions,
} from './constants/index.js';
import type { OnboardingQuestion } from './constants/index.js';
import {
  OnboardingStatusDto,
  SubmitRoundThreeDto,
  SubmitRoundTwoDto,
} from './dto/index.js';
import type { SubmitOnboardingDto } from './dto/index.js';
import type { ConfirmPathDto } from './dto/index.js';
import {
  buildOnboardingPrompt,
  parseRecommendation,
  getFallbackRecommendation,
} from './recommendation/index.js';
import type {
  RecommendationResult,
  RankedRecommendation,
  OnboardingDataInput,
} from './recommendation/index.js';

export interface RankedRecommendationWithId extends RankedRecommendation {
  learningPathId: string;
}

export interface OnboardingRecommendationResponse {
  source: 'ai' | 'fallback';
  rankings: RankedRecommendationWithId[];
  tips: string[];
}

const VALID_ROUNDS = [1, 2, 3] as const;

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
    private readonly learnerProfileService: LearnerProfileService,
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

    await this.learnerProfileService.createFromRoundOne(userId);

    return onboardingRound;
  }

  async getStatus(userId: string): Promise<OnboardingStatusDto> {
    const [rounds, pathCount] = await Promise.all([
      this.prisma.onboardingRound.findMany({
        where: { userId },
        select: { roundNumber: true, answers: true },
        orderBy: { roundNumber: 'asc' },
      }),
      this.prisma.userLearningPath.count({ where: { userId } }),
    ]);

    const completedRounds = rounds.map((round) => round.roundNumber);
    const nextRound = VALID_ROUNDS.find(
      (roundNumber) => !completedRounds.includes(roundNumber),
    ) ?? null;
    const roundOne = rounds.find((round) => round.roundNumber === 1);
    const roundOneAnswers = roundOne?.answers as Record<string, unknown> | undefined;

    return {
      completedRounds,
      nextRound,
      resumeAvailable: completedRounds.includes(1) && nextRound !== null,
      canRequestRecommendation: completedRounds.length === 3,
      careerGoal: (roundOneAnswers?.careerGoal as string | undefined) ?? null,
      hasConfirmedPath: pathCount > 0,
    };
  }

  async getQuestionsForRound(
    userId: string,
    roundNumber: number,
  ): Promise<OnboardingQuestion[]> {
    if (roundNumber === 1) {
      return ONBOARDING_QUESTIONS;
    }

    if (roundNumber === 2) {
      return ROUND_TWO_QUESTIONS;
    }

    if (roundNumber === 3) {
      const roundOne = await this.prisma.onboardingRound.findUnique({
        where: { userId_roundNumber: { userId, roundNumber: 1 } },
      });

      if (!roundOne) {
        throw new BadRequestException(
          'Complete round 1 before accessing round 3 questions',
        );
      }

      const answers = roundOne.answers as Record<string, unknown>;
      return getRoundThreeQuestions(answers.careerGoal as CareerGoal);
    }

    throw new BadRequestException('Invalid round number. Must be 1, 2, or 3');
  }

  async submitRoundTwo(
    userId: string,
    dto: SubmitRoundTwoDto,
  ): Promise<OnboardingRound> {
    const roundOne = await this.prisma.onboardingRound.findUnique({
      where: { userId_roundNumber: { userId, roundNumber: 1 } },
    });

    if (!roundOne) {
      throw new BadRequestException('Complete round 1 before submitting round 2');
    }

    const existingRoundTwo = await this.prisma.onboardingRound.findUnique({
      where: { userId_roundNumber: { userId, roundNumber: 2 } },
    });

    if (existingRoundTwo) {
      throw new ConflictException('Round 2 already submitted');
    }

    const onboardingRound = await this.prisma.onboardingRound.create({
      data: {
        userId,
        roundNumber: 2,
        answers: {
          targetRole: dto.targetRole,
          workEnvironment: dto.workEnvironment,
          timeline: dto.timeline,
          learningStyle: dto.learningStyle,
        },
        completedAt: new Date(),
      },
    });

    await this.learnerProfileService.updateFromRoundTwo(userId);

    return onboardingRound;
  }

  async submitRoundThree(
    userId: string,
    dto: SubmitRoundThreeDto,
  ): Promise<OnboardingRound> {
    const roundTwo = await this.prisma.onboardingRound.findUnique({
      where: { userId_roundNumber: { userId, roundNumber: 2 } },
    });

    if (!roundTwo) {
      throw new BadRequestException('Complete round 2 before submitting round 3');
    }

    const existingRoundThree = await this.prisma.onboardingRound.findUnique({
      where: { userId_roundNumber: { userId, roundNumber: 3 } },
    });

    if (existingRoundThree) {
      throw new ConflictException('Round 3 already submitted');
    }

    const onboardingRound = await this.prisma.onboardingRound.create({
      data: {
        userId,
        roundNumber: 3,
        answers: {
          skillRatings: dto.skillRatings,
        },
        completedAt: new Date(),
      },
    });

    await this.learnerProfileService.updateFromRoundThree(userId);

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
  async getRecommendation(userId: string): Promise<OnboardingRecommendationResponse> {
    const round = await this.prisma.onboardingRound.findUnique({
      where: { userId_roundNumber: { userId, roundNumber: 1 } },
    });

    if (!round) {
      throw new NotFoundException('Please complete onboarding first');
    }

    const round3 = await this.prisma.onboardingRound.findUnique({
      where: { userId_roundNumber: { userId, roundNumber: 3 } },
    });

    if (!round3) {
      throw new BadRequestException(
        'Complete all 3 onboarding rounds before requesting a recommendation',
      );
    }

    const answers = round.answers as Record<string, unknown>;
    const input: OnboardingDataInput = {
      careerGoal: answers.careerGoal as OnboardingDataInput['careerGoal'],
      priorKnowledge: answers.priorKnowledge,
      learningBackground: answers.learningBackground as OnboardingDataInput['learningBackground'],
      hoursPerWeek: answers.hoursPerWeek as number,
    };

    const { systemPrompt, userMessage } = buildOnboardingPrompt(input);

    let recommendation: RecommendationResult;

    try {
      const rawText = await this.aiService.chat(systemPrompt, userMessage);

      const parsed = parseRecommendation(rawText);

      if (parsed !== null) {
        recommendation = parsed;
      } else {
        this.logger.warn(
          `AI response failed validation for userId=${userId}, using fallback`,
        );
        recommendation = getFallbackRecommendation(input);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `AI API error for userId=${userId}: ${message} — using fallback`,
      );
      recommendation = getFallbackRecommendation(input);
    }

    const pathSlugs = recommendation.rankings.map((ranking) => ranking.pathSlug);
    const learningPaths = await this.prisma.learningPath.findMany({
      where: { slug: { in: pathSlugs } },
      select: { id: true, slug: true },
    });

    const slugToId = new Map(learningPaths.map((learningPath) => [learningPath.slug, learningPath.id]));

    const rankingsWithIds: RankedRecommendationWithId[] = recommendation.rankings
      .filter((ranking) => slugToId.has(ranking.pathSlug))
      .map((ranking) => ({
        learningPathId: slugToId.get(ranking.pathSlug)!,
        pathSlug: ranking.pathSlug,
        matchScore: ranking.matchScore,
        explanation: ranking.explanation,
        focusAreas: ranking.focusAreas,
      }));

    if (rankingsWithIds.length === 0) {
      throw new NotFoundException('No valid learning paths found for recommendations');
    }

    return {
      source: recommendation.source,
      rankings: rankingsWithIds,
      tips: recommendation.tips,
    };
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

    await this.prisma.learnerProfile.updateMany({
      where: { userId, mainLearningPathId: null },
      data: { mainLearningPathId: dto.learningPathId },
    });

    return userLearningPath;
  }
}
