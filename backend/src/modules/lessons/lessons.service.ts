// lessons.service.ts - Business logic cho Lessons
//
// Service quản lý lesson detail, start/complete tracking, auto-advance.
// Tách riêng khỏi LearningPathsService vì:
//   → Lesson là resource độc lập (có slug riêng, có thể reuse across tracks)
//   → Logic phức tạp riêng: prerequisites check, progress tracking, auto-advance
//   → Dễ scale: nếu lesson logic lớn lên → không làm phình LearningPathsService
//
// PrismaModule là @Global() → PrismaService inject tự động.

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Prisma, UserProgress } from '@prisma/client';
import { ProgressStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Shape của prerequisite chưa hoàn thành, trả kèm trong 403 response.
 * → Frontend dùng slug để navigate user đến bài cần hoàn thành trước
 * → id + title để hiển thị trong UI (vd: "Bạn cần hoàn thành: HTML Basics")
 */
interface MissingPrerequisite {
  id: string;
  title: string;
  slug: string;
}

/**
 * Transaction client type — dùng khi pass Prisma tx vào helper methods.
 * Prisma.TransactionClient = PrismaClient bên trong $transaction callback.
 * Tách type alias để:
 *   → Tránh viết Prisma.TransactionClient dài dòng mỗi lần
 *   → Dễ thay đổi nếu Prisma thay đổi API sau này
 */
type TxClient = Prisma.TransactionClient;

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helper: Get Missing Prerequisites ─────────────────────────────────────

  /**
   * Lấy danh sách prerequisites chưa hoàn thành.
   *
   * Tại sao return danh sách thay vì boolean?
   * → Frontend hiển thị được: "Bạn cần hoàn thành: [list]"
   * → Frontend có slug để navigate user đến bài cần học trước
   * → Nếu return empty array → tất cả đã completed (hoặc không có prerequisites)
   *
   * Flow:
   *   1. Query LessonPrerequisite kèm lesson info (nested select)
   *   2. Nếu không có prerequisites → return [] (bài đầu tiên)
   *   3. Query UserProgress cho tất cả prerequisite lessons (status = COMPLETED)
   *   4. Filter: chỉ return những bài CHƯA completed
   *
   * DAG support:
   *   - Chỉ check direct prerequisites (immediate dependencies)
   *   - Transitive guarantee: nếu B requires A, C requires B
   *     → B đã COMPLETED = A đã COMPLETED (vì B không thể complete nếu A chưa)
   */
  async getMissingPrerequisites(
    userId: string,
    lessonId: string,
  ): Promise<MissingPrerequisite[]> {
    // ── Bước 1: Lấy prerequisites kèm lesson info ─────────────────────────
    //
    // Dùng nested select thay vì 2 queries riêng:
    //   Query riêng 1: lấy prerequisiteIds
    //   Query riêng 2: lấy lesson info cho những IDs đó
    // → 1 Prisma query với relation select → Prisma tự JOIN bên dưới
    const prerequisites = await this.prisma.lessonPrerequisite.findMany({
      where: { lessonId },
      select: {
        prerequisite: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    // Không có prerequisites → bài đầu tiên trong chain → return [] (= all met)
    if (prerequisites.length === 0) {
      return [];
    }

    // ── Bước 2: Lấy danh sách đã completed ────────────────────────────────
    //
    // Chỉ select lessonId để so sánh — không cần toàn bộ UserProgress record
    // Dùng IN + 1 query thay vì loop N queries cho mỗi prerequisite
    const prerequisiteIds = prerequisites.map((p) => p.prerequisite.id);

    const completedProgress = await this.prisma.userProgress.findMany({
      where: {
        userId,
        lessonId: { in: prerequisiteIds },
        status: ProgressStatus.COMPLETED,
      },
      select: { lessonId: true },
    });

    // ── Bước 3: Filter ra những bài chưa completed ─────────────────────────
    //
    // Set lookup O(1) thay vì Array.includes O(n)
    // → Performance tốt hơn khi có nhiều prerequisites
    const completedIds = new Set(completedProgress.map((p) => p.lessonId));

    return prerequisites
      .filter((p) => !completedIds.has(p.prerequisite.id))
      .map((p) => p.prerequisite);
  }

  // ── Helper: Check Prerequisites (boolean) ─────────────────────────────────

  /**
   * Kiểm tra user đã hoàn thành tất cả prerequisites hay chưa.
   * Delegate sang getMissingPrerequisites — DRY principle.
   *
   * Dùng khi chỉ cần boolean (pass/fail), không cần danh sách missing.
   * Giữ lại cho backward compatibility + use case đơn giản.
   */
  async checkPrerequisites(
    userId: string,
    lessonId: string,
  ): Promise<boolean> {
    const missing = await this.getMissingPrerequisites(userId, lessonId);
    return missing.length === 0;
  }

  // ── Helper: Find lesson + validate ────────────────────────────────────

  /**
   * Tìm lesson by slug + isPublished, throw NotFoundException nếu không tìm thấy.
   * Dùng chung cho getLessonBySlug, startLesson, completeLesson.
   *
   * Tại sao gộp slug + isPublished vào 1 query?
   * → Security: không expose lesson chưa published (trả 404 cho cả 2 case)
   * → Giống pattern trong LearningPathsService.getPathBySlug
   */
  private async findLessonBySlug(slug: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { slug, isPublished: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  // ── Helper: Check enrollment ──────────────────────────────────────────

  /**
   * Check user đã enroll BẤT KỲ learning path nào chứa lesson này chưa.
   *
   * Dùng Prisma nested relation filter:
   *   UserLearningPath → LearningPath → Track → TrackLesson → lessonId
   *
   * Tại sao "bất kỳ path" thay vì path cụ thể?
   * → Lesson có thể reuse across paths (junction table TrackLesson)
   * → User enroll 1 path là đủ để access lesson trong path đó
   *
   * Tại sao dùng nested filter thay vì 2 queries?
   * → 1 Prisma query duy nhất — Prisma tự JOIN bên dưới
   * → Đơn giản hơn viết 2 queries tuần tự
   * → findFirst trả về null nếu không tìm thấy → dễ check
   */
  private async checkEnrollment(userId: string, lessonId: string) {
    const enrollment = await this.prisma.userLearningPath.findFirst({
      where: {
        userId,
        // Nested relation filter: learningPath → tracks → trackLessons → lessonId
        // Prisma sẽ tự generate SQL JOIN dựa trên relations trong schema
        learningPath: {
          tracks: {
            some: {
              trackLessons: {
                some: { lessonId },
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You must enroll in a learning path containing this lesson',
      );
    }

    return enrollment;
  }

  // ── Helper: Validate full lesson access ───────────────────────────────

  /**
   * Chuỗi validate 3 bước dùng chung cho tất cả endpoints:
   *   1. findLessonBySlug → throw 404
   *   2. checkEnrollment → throw 403
   *   3. getMissingPrerequisites → throw 403 kèm danh sách missing
   *
   * Return { lesson, enrollment }:
   * → lesson: cần cho tất cả endpoints
   * → enrollment: cần cho completeLesson (auto-advance dùng learningPathId)
   *
   * Tại sao extract thành 1 method?
   * → Tránh code lặp (DRY) — 3 endpoints đều cần 3 bước này
   * → Thay đổi logic validate 1 chỗ, effect toàn bộ
   */
  private async validateLessonAccess(userId: string, slug: string) {
    const lesson = await this.findLessonBySlug(slug);
    const enrollment = await this.checkEnrollment(userId, lesson.id);

    // getMissingPrerequisites thay vì checkPrerequisites (boolean):
    // → Có danh sách missing → throw 403 kèm thông tin chi tiết
    // → Frontend parse missingPrerequisites array:
    //   [{ id: "...", title: "HTML Basics", slug: "html-basics" }]
    const missingPrereqs = await this.getMissingPrerequisites(
      userId,
      lesson.id,
    );

    if (missingPrereqs.length > 0) {
      // ForbiddenException(object) → NestJS set response body = object + statusCode
      // Response body:
      // {
      //   "statusCode": 403,
      //   "message": "Complete prerequisite...",
      //   "missingPrerequisites": [{ id, title, slug }],
      //   "error": "Forbidden"
      // }
      throw new ForbiddenException({
        message: 'Complete prerequisite lessons before accessing this lesson',
        missingPrerequisites: missingPrereqs,
      });
    }

    return { lesson, enrollment };
  }

  // ── GET /lessons/:slug ──────────────────────────────────────────────────

  /**
   * Lấy chi tiết 1 lesson theo slug.
   * User phải đã login VÀ đã enroll learning path chứa lesson này.
   *
   * Flow:
   *   1. Validate: findLesson + enrollment + prerequisites → 404/403
   *   2. Query UserProgress cho lesson này → biết trạng thái hiện tại
   *   3. Return lesson detail + userProgress
   *
   * Tại sao return kèm userProgress?
   * → Frontend biết user đang ở trạng thái nào (null, IN_PROGRESS, COMPLETED)
   * → Hiển thị nút "Start" / "Continue" / "Completed" tương ứng
   * → 1 API call thay vì 2 (lesson detail + progress riêng)
   */
  async getLessonBySlug(userId: string, slug: string) {
    // validateLessonAccess: tìm lesson + check enrollment + check prerequisites
    // Throw 404/403 nếu có vấn đề, trả về { lesson, enrollment } nếu hợp lệ
    const { lesson } = await this.validateLessonAccess(userId, slug);

    // ── Query UserProgress ─────────────────────────────────────────────────
    //
    // findUnique dùng compound unique key userId_lessonId
    // Chỉ select 3 fields cần thiết cho frontend:
    //   status: trạng thái hiện tại (NOT_STARTED | IN_PROGRESS | COMPLETED)
    //   startedAt: thời điểm bắt đầu học
    //   completedAt: thời điểm hoàn thành (null nếu chưa complete)
    //
    // Return null nếu user chưa bao giờ interact với lesson
    // → Frontend hiển thị nút "Start Lesson"
    const userProgress = await this.prisma.userProgress.findUnique({
      where: {
        userId_lessonId: { userId, lessonId: lesson.id },
      },
      select: {
        status: true,
        startedAt: true,
        completedAt: true,
      },
    });

    // Spread lesson fields + attach userProgress
    // userProgress: { status, startedAt, completedAt } | null
    return {
      ...lesson,
      userProgress: userProgress ?? null,
    };
  }

  // ── POST /lessons/:slug/start ───────────────────────────────────────────

  /**
   * Đánh dấu lesson đã bắt đầu học.
   * Tạo hoặc update UserProgress record (status: IN_PROGRESS).
   *
   * Flow:
   *   1. Validate: findLesson + enrollment + prerequisites → 404/403
   *   2. Upsert UserProgress:
   *      - Nếu chưa có → create với status IN_PROGRESS, startedAt = now()
   *      - Nếu đã có (IN_PROGRESS hoặc COMPLETED) → return existing (idempotent)
   *
   * Idempotent design:
   *   Gọi startLesson nhiều lần → kết quả giống nhau
   *   → Frontend không cần check trước khi gọi
   *   → Tránh race condition nếu user click nhiều lần
   *   → Không reset COMPLETED về IN_PROGRESS (giữ nguyên trạng thái)
   */
  async startLesson(userId: string, slug: string): Promise<UserProgress> {
    // ── Validate (findLesson + enrollment + prerequisites) ──────────────
    const { lesson } = await this.validateLessonAccess(userId, slug);

    // ── Upsert UserProgress ────────────────────────────────────────────────
    //
    // Tại sao dùng upsert thay vì findUnique + create?
    // → Atomic operation: tránh race condition giữa check + create
    // → 1 query thay vì 2 queries
    //
    // where: compound unique key userId_lessonId (@@unique([userId, lessonId]))
    //
    // update: {} — nếu đã tồn tại → không thay đổi gì (idempotent)
    // → User đã start → giữ nguyên startedAt (không reset)
    // → User đã complete → giữ nguyên COMPLETED (không downgrade)
    const progress = await this.prisma.userProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId: lesson.id },
      },
      // Nếu đã có record → trả về nguyên trạng (không reset COMPLETED về IN_PROGRESS)
      update: {},
      // Nếu chưa có → tạo mới với IN_PROGRESS
      create: {
        userId,
        lessonId: lesson.id,
        status: ProgressStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    return progress;
  }

  // ── POST /lessons/:slug/complete ────────────────────────────────────────

  /**
   * Đánh dấu lesson đã hoàn thành + auto-advance sang bài tiếp theo.
   * Update UserProgress record (status: COMPLETED, completedAt = now()).
   *
   * Flow:
   *   1. Validate: findLesson + enrollment + prerequisites → 404/403
   *   2. Find UserProgress → 422 nếu chưa start
   *   3. Nếu đã COMPLETED → return existing (idempotent)
   *   4. Transaction:
   *      a. Update status → COMPLETED, set completedAt
   *      b. Auto-advance: tìm next lesson → update currentLessonId
   *
   * Auto-advance logic (xem advanceToNextLesson):
   *   → Next lesson cùng track (order tăng dần)
   *   → Nếu hết track → next track cùng path → first lesson
   *   → Nếu hết tất cả tracks → path completed → set completedAt
   *
   * Tại sao phải start trước khi complete?
   * → Đảm bảo user thực sự đã bắt đầu học (có startedAt)
   * → Tracking thời gian học chính xác (startedAt → completedAt)
   *
   * Tại sao dùng $transaction?
   * → Atomic: progress update + advance phải cùng thành công hoặc cùng rollback
   * → Tránh inconsistency: progress = COMPLETED nhưng currentLessonId chưa update
   */
  async completeLesson(userId: string, slug: string): Promise<UserProgress> {
    // ── Validate (findLesson + enrollment + prerequisites) ──────────────
    // enrollment cần cho auto-advance (learningPathId)
    const { lesson, enrollment } = await this.validateLessonAccess(
      userId,
      slug,
    );

    // ── Find existing progress ──────────────────────────────────────────────
    //
    // findUnique dùng compound unique key userId_lessonId
    // Nếu null hoặc NOT_STARTED → user chưa start → 422
    const progress = await this.prisma.userProgress.findUnique({
      where: {
        userId_lessonId: { userId, lessonId: lesson.id },
      },
    });

    if (!progress || progress.status === ProgressStatus.NOT_STARTED) {
      // UnprocessableEntityException = HTTP 422
      // Request hợp lệ (slug đúng, user đã enroll) nhưng không thể xử lý
      // vì lesson chưa được start
      throw new UnprocessableEntityException(
        'You must start the lesson before completing it',
      );
    }

    // ── Idempotent — đã COMPLETED thì return luôn ────────────────────────
    if (progress.status === ProgressStatus.COMPLETED) {
      return progress;
    }

    // ── Transaction: update progress + auto-advance ──────────────────────
    //
    // Tại sao wrap trong $transaction?
    // → Atomic: nếu advance fail → progress update cũng rollback
    // → Consistency: user không bị stuck ở COMPLETED mà currentLessonId sai
    const updated = await this.prisma.$transaction(async (tx) => {
      // (a) Update status → COMPLETED
      const completedProgress = await tx.userProgress.update({
        where: {
          userId_lessonId: { userId, lessonId: lesson.id },
        },
        data: {
          status: ProgressStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // (b) Auto-advance: tìm bài tiếp theo → update currentLessonId
      await this.advanceToNextLesson(
        tx,
        userId,
        lesson.id,
        enrollment.learningPathId,
      );

      return completedProgress;
    });

    return updated;
  }

  // ── Helper: Auto-advance to next lesson ─────────────────────────────────

  /**
   * Tìm bài tiếp theo trong learning path và update currentLessonId.
   *
   * Flow:
   *   1. Tìm TrackLesson hiện tại → biết track + order trong path
   *   2. Tìm next lesson cùng track (order > current, lấy nhỏ nhất)
   *   3. Nếu hết track → tìm next track → first lesson of next track
   *   4. Nếu hết tất cả tracks → path completed → set completedAt
   *
   * Tại sao tách thành helper riêng?
   * → completeLesson chỉ lo update progress, advance logic tách riêng
   * → Cognitive load thấp hơn — mỗi method làm 1 việc (Single Responsibility)
   * → Dễ test independently
   *
   * @param tx - Prisma transaction client (đảm bảo atomicity)
   * @param userId - User đang complete lesson
   * @param lessonId - Lesson vừa complete
   * @param learningPathId - Path user đang học (từ enrollment)
   */
  private async advanceToNextLesson(
    tx: TxClient,
    userId: string,
    lessonId: string,
    learningPathId: string,
  ): Promise<void> {
    // ── Bước 1: Tìm vị trí hiện tại (track + order) ──────────────────────
    //
    // Lesson có thể thuộc nhiều tracks (junction table TrackLesson)
    // → Filter theo track.learningPathId để lấy đúng track TRONG path user đang học
    // → include track để lấy track.order (cần cho bước 3: tìm next track)
    const currentTrackLesson = await tx.trackLesson.findFirst({
      where: {
        lessonId,
        track: { learningPathId },
      },
      include: {
        track: true, // Cần track.order để so sánh khi tìm next track
      },
      orderBy: { track: { order: 'asc' } }, // Deterministic: luôn lấy track có order nhỏ nhất
    });

    // Edge case: lesson không thuộc track nào trong path (data inconsistency)
    // → Không advance, giữ nguyên currentLessonId
    // → Có thể xảy ra nếu admin xoá TrackLesson mà user đang học
    if (!currentTrackLesson) return;

    // ── Bước 2: Tìm next lesson trong cùng track ─────────────────────────
    //
    // order > currentOrder → lấy bài gần nhất (orderBy asc + findFirst)
    // Ví dụ: currentOrder = 3, có order 4, 5, 7 → lấy order 4
    const nextInTrack = await tx.trackLesson.findFirst({
      where: {
        trackId: currentTrackLesson.trackId,
        order: { gt: currentTrackLesson.order },
      },
      orderBy: { order: 'asc' },
    });

    if (nextInTrack) {
      // Có bài tiếp trong cùng track → update currentLessonId
      await tx.userLearningPath.update({
        where: {
          userId_learningPathId: { userId, learningPathId },
        },
        data: { currentLessonId: nextInTrack.lessonId },
      });
      return;
    }

    // ── Bước 3: Hết track hiện tại → tìm next track cùng path ──────────
    //
    // Next track = track có order > currentTrack.order trong cùng learningPath
    // findFirst + orderBy asc → lấy track kế tiếp gần nhất
    const nextTrack = await tx.track.findFirst({
      where: {
        learningPathId,
        order: { gt: currentTrackLesson.track.order },
        trackLessons: { some: {} }, // Chỉ xét tracks có ít nhất 1 lesson → tránh skip empty track
      },
      orderBy: { order: 'asc' },
    });

    if (nextTrack) {
      // Tìm bài đầu tiên của next track (order nhỏ nhất)
      const firstLessonOfNextTrack = await tx.trackLesson.findFirst({
        where: { trackId: nextTrack.id },
        orderBy: { order: 'asc' },
      });

      if (firstLessonOfNextTrack) {
        // Có bài tiếp ở track mới → update currentLessonId
        await tx.userLearningPath.update({
          where: {
            userId_learningPathId: { userId, learningPathId },
          },
          data: { currentLessonId: firstLessonOfNextTrack.lessonId },
        });
        return;
      }
    }

    // ── Bước 4: Hết tất cả tracks → path completed ───────────────────────
    //
    // User đã hoàn thành lesson cuối cùng của track cuối cùng
    // → Set completedAt trên UserLearningPath (đánh dấu hoàn thành path)
    // → Clear currentLessonId (không còn bài nào để học)
    await tx.userLearningPath.update({
      where: {
        userId_learningPathId: { userId, learningPathId },
      },
      data: {
        currentLessonId: null,
        completedAt: new Date(),
      },
    });
  }
}
