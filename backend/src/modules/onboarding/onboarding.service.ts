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
import type { OnboardingData, UserLearningPath } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { ONBOARDING_QUESTIONS } from './constants/index.js';
import type { OnboardingQuestion } from './constants/index.js';
import type { SubmitOnboardingDto } from './dto/index.js';
import type { ConfirmPathDto } from './dto/index.js';
import {
  AiClient,
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
    // AiClient được inject tự động nhờ @Injectable() + register trong module
    // NestJS DI sẽ tìm AiClient provider trong OnboardingModule.providers
    private readonly aiClient: AiClient,
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
   * Lưu câu trả lời onboarding vào DB.
   * TODO: implement khi làm tiếp
   */
  async submitAnswers(userId: string, dto: SubmitOnboardingDto): Promise<OnboardingData> {
    // ── Bước 1: Check duplicate ─────────────────────────────────────────────
    //
    // findUnique: tìm theo primary key hoặc @unique field
    // userId có @unique trong schema → dùng được làm where condition
    //
    // Tại sao check trước thay vì dùng try/catch Prisma unique constraint?
    // → Check explicit → throw ConflictException (HTTP 409) rõ ràng
    // → Nếu dùng try/catch P2002 → phải handle Prisma error code → phức tạp hơn
    //   (sẽ học pattern đó sau khi phù hợp)
    const existing = await this.prisma.onboardingData.findUnique({
      where: { userId },
    });

    if (existing) {
      // ConflictException → NestJS tự convert sang HTTP 409
      // Message rõ ràng để frontend hiển thị hoặc redirect
      throw new ConflictException('Onboarding already completed');
    }

    // ── Bước 2: Tạo OnboardingData record ──────────────────────────────────
    //
    // prisma.onboardingData.create() → INSERT INTO onboarding_data
    //
    // Lưu ý về priorKnowledge:
    //   Schema định nghĩa là Json (PostgreSQL jsonb)
    //   Prisma nhận Prisma.InputJsonValue = string[] | ... → tương thích trực tiếp
    //
    // completedAt: không cần truyền → @default(now()) trong schema tự set
    const onboardingData = await this.prisma.onboardingData.create({
      data: {
        userId,
        careerGoal: dto.careerGoal,
        priorKnowledge: dto.priorKnowledge, // string[] → Prisma chuyển thành jsonb
        learningBackground: dto.learningBackground,
        hoursPerWeek: dto.hoursPerWeek,
      },
    });

    return onboardingData;
  }

  // ── GET /onboarding/recommendation ───────────────────────────────────────

  /**
   * Gợi ý learning path phù hợp dựa trên câu trả lời onboarding của user.
   *
   * Flow:
   *   1. Đọc OnboardingData từ DB (user phải submit trước)
   *   2. Build prompt từ data
   *   3. Gọi AI API → parse JSON response
   *   4. Nếu AI fail / parse null → dùng rule-based fallback
   *   5. Return RecommendationResult (source: 'ai' | 'fallback')
   *
   * Tại sao có fallback thay vì throw khi AI fail?
   * → Onboarding là critical path — user không thể bị kẹt ở đây vì AI timeout
   * → Rule-based fallback đủ tốt cho 4 career goals rõ ràng
   * → UX tốt hơn: user thấy recommendation dù AI có vấn đề
   */
  async getRecommendation(userId: string): Promise<RecommendationResult> {
    // ── Bước 1: Đọc OnboardingData từ DB ────────────────────────────────────
    //
    // User phải submit answers trước khi lấy recommendation
    // Nếu chưa submit → 404 để frontend redirect về /onboarding/submit
    const onboardingData = await this.prisma.onboardingData.findUnique({
      where: { userId },
    });

    if (!onboardingData) {
      throw new NotFoundException('Please complete onboarding first');
    }

    // ── Bước 2: Build prompt ─────────────────────────────────────────────────
    //
    // Cast OnboardingData sang OnboardingDataInput (subset của fields cần thiết)
    // priorKnowledge là Json trong Prisma → builder sẽ handle cast sang string[]
    const input: OnboardingDataInput = {
      careerGoal: onboardingData.careerGoal,
      priorKnowledge: onboardingData.priorKnowledge,
      learningBackground: onboardingData.learningBackground,
      hoursPerWeek: onboardingData.hoursPerWeek,
    };

    const { systemPrompt, userMessage } = buildOnboardingPrompt(input);

    // ── Bước 3: Gọi AI và parse response ────────────────────────────────────
    //
    // Wrap trong try/catch vì AI call có thể fail vì nhiều lý do:
    // - Network error / timeout
    // - AI server down (5xx)
    // - AI trả về non-JSON
    // → Bất kỳ lỗi nào → log + dùng fallback
    try {
      const rawText = await this.aiClient.chat(systemPrompt, userMessage);

      // parseRecommendation trả về null nếu AI response sai format
      // → Không throw, chỉ return null để service biết dùng fallback
      const parsed = parseRecommendation(rawText);

      if (parsed !== null) {
        // AI trả về valid JSON và pass validation → dùng AI result
        return parsed; // source: 'ai'
      }

      // Parse thành công về JSON nhưng format sai (null) → fallback
      this.logger.warn(
        `AI response failed validation for userId=${userId}, using fallback`,
      );
    } catch (error: unknown) {
      // Network error, timeout, hoặc HTTP 4xx/5xx từ AI API
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `AI API error for userId=${userId}: ${message} — using fallback`,
      );
    }

    // ── Bước 4: Fallback rule-based ──────────────────────────────────────────
    //
    // getFallbackRecommendation() KHÔNG BAO GIỜ throw
    // → Luôn trả về RecommendationResult hợp lệ dựa trên careerGoal
    // → source: 'fallback' để frontend có thể hiển thị badge khác nếu muốn
    return getFallbackRecommendation(input);
  }

  // ── POST /onboarding/confirm ──────────────────────────────────────────────

  /**
   * User confirm learning path đã chọn.
   * Tạo UserLearningPath với currentLessonId = bài đầu tiên của path.
   *
   * Flow:
   *   1. Validate path tồn tại + isPublished
   *   2. Check user chưa enroll path này (tránh duplicate)
   *   3. Tìm Track đầu tiên (by order) → TrackLesson đầu tiên (by order)
   *   4. Create UserLearningPath trong transaction
   *
   * Tại sao transaction ở bước 4?
   * → Bước 1-3 là read-only queries, không cần transaction
   * → Chỉ wrap write operation để đảm bảo atomicity
   * → Nếu create thất bại giữa chừng → rollback hoàn toàn
   */
  async confirmPath(
    userId: string,
    dto: ConfirmPathDto,
  ): Promise<UserLearningPath> {
    // ── Bước 1: Validate path tồn tại + isPublished ─────────────────────────
    //
    // Tại sao gộp 2 điều kiện (id + isPublished) vào 1 query?
    // → Security: trả về 404 cho cả 2 case (không tồn tại + chưa published)
    // → Không để lộ thông tin "path tồn tại nhưng chưa public"
    // → Tương tự pattern "security through obscurity" — admin paths không bị expose
    const learningPath = await this.prisma.learningPath.findFirst({
      where: {
        id: dto.learningPathId,
        isPublished: true,
      },
    });

    if (!learningPath) {
      // Không phân biệt "không tồn tại" vs "chưa published" → 404
      throw new NotFoundException('Learning path not found');
    }

    // ── Bước 2: Check duplicate enrollment ──────────────────────────────────
    //
    // Schema có @@unique([userId, learningPathId]) → đảm bảo constraint ở DB level
    // Nhưng ta check explicit trước để:
    //   1. Trả về 409 ConflictException rõ ràng (thay vì Prisma P2002 error)
    //   2. Message thân thiện với frontend
    const existingEnrollment = await this.prisma.userLearningPath.findUnique({
      where: {
        // Prisma tự sinh tên compound unique: userId_learningPathId
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
    //
    // Cấu trúc data: LearningPath → Track[] → TrackLesson[] → Lesson
    // Mỗi Track/TrackLesson có field "order" để sắp xếp
    // Ta cần: track có order nhỏ nhất → trong track đó, trackLesson có order nhỏ nhất
    //
    // Tại sao không dùng include nested?
    // → 2 queries riêng biệt: rõ ràng hơn, dễ throw lỗi đúng chỗ
    // → Nếu dùng include: track = null thì không biết lỗi ở đâu
    const firstTrack = await this.prisma.track.findFirst({
      where: { learningPathId: dto.learningPathId },
      orderBy: { order: 'asc' },
    });

    if (!firstTrack) {
      // Path tồn tại nhưng không có track nào → data problem → 422
      // UnprocessableEntityException = HTTP 422 Unprocessable Entity
      // Ý nghĩa: request hợp lệ về format, nhưng không thể xử lý được
      throw new UnprocessableEntityException(
        'This learning path has no tracks',
      );
    }

    const firstTrackLesson = await this.prisma.trackLesson.findFirst({
      where: { trackId: firstTrack.id },
      orderBy: { order: 'asc' },
    });

    if (!firstTrackLesson) {
      // Track tồn tại nhưng không có lesson nào → 422
      throw new UnprocessableEntityException(
        'This learning path has no lessons',
      );
    }

    // ── Bước 4: Create UserLearningPath ─────────────────────────────────────
    //
    // Wrap trong $transaction dù chỉ có 1 write operation?
    // → Hiện tại: 1 write → transaction là overhead nhỏ nhưng negligible
    // → Tương lai: nếu cần thêm write (vd: create UserProgress) → dễ mở rộng
    // → Pattern nhất quán: confirm flow luôn dùng transaction
    const userLearningPath = await this.prisma.$transaction(async (tx) => {
      return tx.userLearningPath.create({
        data: {
          userId,
          learningPathId: dto.learningPathId,
          // currentLessonId = ID bài học đầu tiên trong track đầu tiên
          // TrackLesson là junction table → lấy lessonId từ đó
          currentLessonId: firstTrackLesson.lessonId,
        },
      });
    });

    return userLearningPath;
  }
}
