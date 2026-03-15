// learning-paths.service.ts - Business logic cho Learning Paths
//
// Service chứa toàn bộ logic, controller chỉ gọi service.
// Pattern: Controller nhận request → gọi Service → Service trả về data
//
// PrismaService được inject qua constructor (Dependency Injection).
// PrismaModule là @Global() → không cần import lại trong LearningPathsModule.

import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { UserLearningPath } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';

@Injectable()
export class LearningPathsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /learning-paths ─────────────────────────────────────────────────

  /**
   * Liệt kê tất cả learning paths đã published.
   * Public endpoint — không cần auth.
   *
   * Tại sao filter isPublished: true?
   * → Admin có thể tạo path nhưng chưa muốn public
   * → User chỉ thấy paths sẵn sàng học
   *
   * _count: Prisma aggregate — đếm số tracks mà không cần load toàn bộ data
   * → Frontend dùng để hiển thị "3 tracks" badge trên card
   */
  async listPaths() {
    return this.prisma.learningPath.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
      // _count là Prisma special field — đếm relation count mà không load data
      // Kết quả: path._count.tracks = số tracks trong path
      include: {
        _count: { select: { tracks: true } },
      },
    });
  }

  // ── GET /learning-paths/:slug ───────────────────────────────────────────

  /**
   * Lấy chi tiết 1 learning path theo slug, bao gồm tracks và lesson count.
   * Public endpoint — user preview path trước khi quyết định enroll.
   *
   * Tại sao dùng findFirst thay vì findUnique?
   * → findUnique chỉ dùng được với @unique/@id field
   * → slug là @unique NHƯNG ta cần thêm điều kiện isPublished: true
   * → findFirst cho phép where nhiều điều kiện cùng lúc
   *
   * Tại sao gộp slug + isPublished vào 1 query?
   * → Security: không expose path chưa published (trả 404 cho cả 2 case)
   * → Giống pattern trong onboarding confirmPath
   */
  async getPathBySlug(slug: string) {
    const path = await this.prisma.learningPath.findFirst({
      where: { slug, isPublished: true },
      include: {
        tracks: {
          orderBy: { order: 'asc' },
          // Đếm số lessons trong mỗi track
          // Frontend hiển thị "Track 1 - Web Fundamentals (5 lessons)"
          include: {
            _count: { select: { trackLessons: true } },
          },
        },
      },
    });

    if (!path) {
      // Không phân biệt "không tồn tại" vs "chưa published" → 404
      throw new NotFoundException('Learning path not found');
    }

    return path;
  }

  // ── GET /learning-paths/:slug/lessons ───────────────────────────────────

  /**
   * Lấy tất cả lessons trong 1 learning path, grouped by track.
   * Public endpoint — user xem outline trước khi enroll.
   *
   * Tại sao tách 2 queries thay vì 1 nested include?
   * → Query 1: tìm path (validate tồn tại + published) → throw 404 nếu sai
   * → Query 2: lấy tracks + lessons (dùng path.id làm filter)
   * → Nếu dùng 1 query: path = null thì không biết lỗi ở đâu
   *
   * Lesson select chỉ lấy fields cần cho outline:
   * → id, title, slug, summary, estimatedMins
   * → KHÔNG lấy content (nặng, chỉ hiển thị khi user mở lesson detail)
   */
  async getPathLessons(slug: string) {
    // ── Query 1: Validate path ──────────────────────────────────────────
    // select: { id: true } → chỉ lấy id, tiết kiệm bandwidth
    // Vì ta chỉ cần path.id để query tracks, không cần toàn bộ fields
    const path = await this.prisma.learningPath.findFirst({
      where: { slug, isPublished: true },
      select: { id: true },
    });

    if (!path) {
      throw new NotFoundException('Learning path not found');
    }

    // ── Query 2: Lấy tracks + lessons ───────────────────────────────────
    // Cấu trúc: Track → TrackLesson (junction) → Lesson
    // TrackLesson là many-to-many junction table vì 1 lesson có thể reuse ở nhiều tracks
    const tracks = await this.prisma.track.findMany({
      where: { learningPathId: path.id },
      orderBy: { order: 'asc' },
      include: {
        trackLessons: {
          orderBy: { order: 'asc' },
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                slug: true,
                summary: true,
                estimatedMins: true,
              },
            },
          },
        },
      },
    });

    return tracks;
  }

  // ── POST /learning-paths/:slug/enroll ───────────────────────────────────

  /**
   * User đăng ký (enroll) vào 1 learning path.
   * Tạo UserLearningPath record + set currentLessonId = bài đầu tiên.
   *
   * Flow tương tự onboarding confirmPath() nhưng nhận slug thay vì learningPathId:
   *   1. Validate path by slug + isPublished
   *   2. Check duplicate enrollment
   *   3. Tìm first track → first trackLesson → lấy lessonId
   *   4. Create UserLearningPath trong $transaction
   */
  async enrollInPath(
    userId: string,
    slug: string,
  ): Promise<UserLearningPath> {
    // ── Bước 1: Validate path tồn tại + isPublished ─────────────────────
    const learningPath = await this.prisma.learningPath.findFirst({
      where: { slug, isPublished: true },
    });

    if (!learningPath) {
      throw new NotFoundException('Learning path not found');
    }

    // ── Bước 2: Check duplicate enrollment ──────────────────────────────
    //
    // Schema có @@unique([userId, learningPathId]) → DB constraint
    // Nhưng check explicit trước để trả 409 rõ ràng thay vì Prisma P2002 error
    const existingEnrollment = await this.prisma.userLearningPath.findUnique({
      where: {
        // Prisma auto-generated compound unique name: userId_learningPathId
        userId_learningPathId: {
          userId,
          learningPathId: learningPath.id,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('You have already enrolled in this path');
    }

    // ── Bước 3: Tìm first Track → first TrackLesson ────────────────────
    //
    // Cấu trúc data: LearningPath → Track[] → TrackLesson[] → Lesson
    // Mỗi Track/TrackLesson có field "order" để sắp xếp
    // Ta cần: track có order nhỏ nhất → trong track đó, trackLesson có order nhỏ nhất
    const firstTrack = await this.prisma.track.findFirst({
      where: { learningPathId: learningPath.id },
      orderBy: { order: 'asc' },
    });

    if (!firstTrack) {
      // Path tồn tại nhưng không có track nào → data problem → 422
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

    // ── Bước 4: Create UserLearningPath ─────────────────────────────────
    //
    // Tại sao KHÔNG dùng $transaction?
    // → Single write operation đã atomic rồi (YAGNI)
    // → $transaction tạo overhead (BEGIN + COMMIT) không cần thiết
    //
    // Tại sao bắt P2002?
    // → TOCTOU race condition: 2 request đồng thời cùng user + path
    //   → Cả 2 pass bước 2 (findUnique) → 1 cái bị Prisma throw P2002
    //   → Bắt P2002 để trả 409 thay vì 500 Internal Server Error
    try {
      return await this.prisma.userLearningPath.create({
        data: {
          userId,
          learningPathId: learningPath.id,
          // currentLessonId = bài học đầu tiên trong track đầu tiên
          // TrackLesson là junction table → lấy lessonId từ đó
          currentLessonId: firstTrackLesson.lessonId,
        },
      });
    } catch (error) {
      // P2002 = Unique constraint violation (userId + learningPathId)
      // Xảy ra khi race condition: 2 requests đồng thời, cả 2 pass duplicate check
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('You have already enrolled in this path');
      }
      throw error;
    }
  }
}
