// progress.service.ts - Business logic cho Progress tracking
//
// Service quản lý toàn bộ progress tracking:
//   - getOverallProgress: tổng hợp tiến độ học tập của user
//   - getPathProgress: tiến độ theo từng learning path
//   - getActivityData: lịch sử hoạt động theo ngày (heatmap data)
//   - startSession: tạo LearningSession mới
//   - endSession: cập nhật endedAt + tính durationSeconds
//
// PrismaModule là @Global() → inject PrismaService trực tiếp qua constructor.

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProgressStatus, ActivityType } from '@prisma/client';
import { PrismaService } from '../../prisma/index.js';
import type { StartSessionDto } from './dto/start-session.dto.js';
import type { EndSessionDto } from './dto/end-session.dto.js';
import type { ActivityQueryDto } from './dto/activity-query.dto.js';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  // ── getOverallProgress ────────────────────────────────────────────────────
  //
  // Trả về tổng quan tiến độ học của user trên tất cả paths đã enroll.
  // Chiến lược: Parallel queries — N+1 chấp nhận được vì user thường enroll < 10 paths.
  async getOverallProgress(userId: string) {
    // Step 1: Lấy tất cả paths user đã enroll, kèm info path + current lesson
    const userPaths = await this.prisma.userLearningPath.findMany({
      where: { userId },
      include: {
        learningPath: {
          select: { id: true, name: true, slug: true },
        },
        currentLesson: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    // Step 2 & 3: Song song — tính progress từng path + global stats
    const [pathsWithProgress, totalLessonsCompleted, timeResult] =
      await Promise.all([
        // Tính % completion cho mỗi path (N queries, chạy song song)
        Promise.all(
          userPaths.map(async (up) => {
            const [totalLessons, completedLessons] = await Promise.all([
              // Tổng số lessons trong path (qua track → trackLesson)
              this.prisma.trackLesson.count({
                where: { track: { learningPathId: up.learningPathId } },
              }),
              // Số lessons user đã COMPLETED trong path này
              this.prisma.userProgress.count({
                where: {
                  userId,
                  status: ProgressStatus.COMPLETED,
                  lesson: {
                    trackLessons: {
                      some: { track: { learningPathId: up.learningPathId } },
                    },
                  },
                },
              }),
            ]);

            const progress =
              totalLessons === 0
                ? 0
                : Math.round((completedLessons / totalLessons) * 100);

            return {
              pathId: up.learningPathId,
              pathName: up.learningPath.name,
              progress,
              currentLesson: up.currentLesson
                ? {
                    id: up.currentLesson.id,
                    title: up.currentLesson.title,
                    slug: up.currentLesson.slug,
                  }
                : null,
              startedAt: up.startedAt,
              completedAt: up.completedAt,
            };
          }),
        ),

        // Tổng số lessons đã COMPLETED của user (toàn bộ paths)
        this.prisma.userProgress.count({
          where: { userId, status: ProgressStatus.COMPLETED },
        }),

        // Tổng thời gian học (tính cả các trạng thái khác, không chỉ COMPLETED)
        this.prisma.userProgress.aggregate({
          where: { userId },
          _sum: { timeSpentSeconds: true },
        }),
      ]);

    return {
      enrolledPaths: userPaths.length,
      completedPaths: userPaths.filter((up) => up.completedAt !== null).length,
      totalLessonsCompleted,
      totalTimeSpentSeconds: timeResult._sum.timeSpentSeconds ?? 0,
      paths: pathsWithProgress,
    };
  }

  // ── getPathProgress ───────────────────────────────────────────────────────
  //
  // Trả về tiến độ chi tiết của user trong 1 path cụ thể, bao gồm từng track
  // và từng lesson trong track với status + time spent.
  //
  // Chiến lược: Collect all lessonIds trước → 1 query cho tất cả UserProgress
  // → dùng Map để lookup O(1) khi build response.
  async getPathProgress(pathId: string, userId: string) {
    // Step 1: Kiểm tra user đã enroll path này chưa
    const userPath = await this.prisma.userLearningPath.findUnique({
      where: {
        userId_learningPathId: { userId, learningPathId: pathId },
      },
      include: {
        learningPath: {
          select: { id: true, name: true, slug: true },
        },
        currentLesson: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    if (!userPath) {
      throw new NotFoundException('Learning path not found or not enrolled');
    }

    // Step 2: Lấy tất cả tracks (và lessons trong mỗi track) của path
    const tracks = await this.prisma.track.findMany({
      where: { learningPathId: pathId },
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
                estimatedMins: true,
              },
            },
          },
        },
      },
    });

    // Step 3: Collect tất cả lessonIds trong path
    const allLessonIds = tracks.flatMap((t) =>
      t.trackLessons.map((tl) => tl.lessonId),
    );

    // Step 4: 1 query duy nhất lấy toàn bộ progress records của user cho path này
    const progressRecords = await this.prisma.userProgress.findMany({
      where: { userId, lessonId: { in: allLessonIds } },
      select: { lessonId: true, status: true, timeSpentSeconds: true },
    });

    // Build Map để lookup O(1): lessonId → progress record
    const progressMap = new Map(
      progressRecords.map((p) => [p.lessonId, p]),
    );

    // Step 5: Build tracks với lesson status
    const tracksWithStatus = tracks.map((track) => ({
      id: track.id,
      name: track.name,
      order: track.order,
      lessons: track.trackLessons.map((tl) => {
        const prog = progressMap.get(tl.lessonId);
        return {
          id: tl.lesson.id,
          title: tl.lesson.title,
          slug: tl.lesson.slug,
          estimatedMins: tl.lesson.estimatedMins,
          status: prog?.status ?? ProgressStatus.NOT_STARTED,
          timeSpentSeconds: prog?.timeSpentSeconds ?? 0,
        };
      }),
    }));

    // Step 6: Tính % completion tổng cho path này
    const completedCount = progressRecords.filter(
      (p) => p.status === ProgressStatus.COMPLETED,
    ).length;

    const progress =
      allLessonIds.length === 0
        ? 0
        : Math.round((completedCount / allLessonIds.length) * 100);

    // Step 7: Return full response
    return {
      path: userPath.learningPath,
      progress,
      startedAt: userPath.startedAt,
      completedAt: userPath.completedAt,
      currentLesson: userPath.currentLesson
        ? {
            id: userPath.currentLesson.id,
            title: userPath.currentLesson.title,
            slug: userPath.currentLesson.slug,
          }
        : null,
      tracks: tracksWithStatus,
    };
  }

  // ── getActivityData ───────────────────────────────────────────────────────
  //
  // Query LearningSession trong khoảng `days` ngày gần nhất, group by ngày +
  // activityType, fill ngày thiếu → trả về data cho frontend heatmap calendar.
  async getActivityData(query: ActivityQueryDto, userId: string) {
    // Type chỉ dùng nội bộ trong method này, không cần export
    type ActivityDataResult = {
      days: number;
      data: {
        date: string;
        totalCount: number;
        activities: {
          type: ActivityType;
          count: number;
        }[];
      }[];
    };

    const days = query.days ?? 30;

    // Bước 1: Tính startDate (UTC để tránh timezone bug khi server ở tz khác client)
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days);
    startDate.setUTCHours(0, 0, 0, 0); // bắt đầu từ 00:00:00 UTC

    // Bước 2: Query LearningSession trong khoảng thời gian
    const sessions = await this.prisma.learningSession.findMany({
      where: {
        userId,
        startedAt: { gte: startDate },
      },
      select: {
        startedAt: true,
        activityType: true,
      },
      orderBy: { startedAt: 'asc' },
    });

    // Bước 3: Group by date → activityType → count
    // Map<dateKey, Map<ActivityType, count>> — O(1) lookup
    const grouped = new Map<string, Map<ActivityType, number>>();
    for (const session of sessions) {
      const dateKey = session.startedAt.toISOString().split('T')[0]; // 'YYYY-MM-DD' UTC
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, new Map());
      }
      const dayMap = grouped.get(dateKey)!;
      dayMap.set(session.activityType, (dayMap.get(session.activityType) ?? 0) + 1);
    }

    // Bước 4: Fill missing dates (loop từ startDate đến today)
    // Frontend heatmap cần mỗi ngày đều có data point, kể cả ngày không có activity
    const result: ActivityDataResult['data'] = [];
    const today = new Date();

    const cursor = new Date(startDate);
    while (cursor <= today) {
      const dateKey = cursor.toISOString().split('T')[0];
      const dayMap = grouped.get(dateKey);

      if (dayMap) {
        // Có activity: build array từ Map entries
        const activities = Array.from(dayMap.entries()).map(([type, count]) => ({
          type,
          count,
        }));
        const totalCount = activities.reduce((sum, a) => sum + a.count, 0);
        result.push({ date: dateKey, totalCount, activities });
      } else {
        // Không có activity: fill với totalCount=0, activities=[]
        result.push({ date: dateKey, totalCount: 0, activities: [] });
      }

      // Advance cursor 1 ngày (UTC)
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return { days, data: result };
  }

  // ── autoEndStaleSessions (private) ───────────────────────────────────────
  //
  // Dọn các session bị "bỏ quên" (tab đóng, mất kết nối) trước khi tạo session mới.
  // Stale = endedAt IS NULL và startedAt > 4 giờ trước.
  // Dùng fire-and-forget để KHÔNG delay response startSession cho user.
  private autoEndStaleSessions(userId: string): void {
    const MAX_SESSION_SECONDS = 4 * 60 * 60; // 4 giờ
    const cutoff = new Date(Date.now() - MAX_SESSION_SECONDS * 1000);

    this.prisma.learningSession
      .findMany({ where: { userId, endedAt: null, startedAt: { lt: cutoff } } })
      .then((staleSessions) => {
        const now = new Date();
        const updates = staleSessions.map((session) => {
          const rawSeconds = (now.getTime() - session.startedAt.getTime()) / 1000;
          const estimatedDuration = Math.min(Math.round(rawSeconds), MAX_SESSION_SECONDS);

          const updateSession = this.prisma.learningSession.update({
            where: { id: session.id },
            data: { endedAt: now, durationSeconds: estimatedDuration },
          });

          // Cộng thêm timeSpentSeconds vào UserProgress (nếu session gắn lesson)
          if (session.lessonId) {
            return Promise.all([
              updateSession,
              this.prisma.userProgress.updateMany({
                where: { userId, lessonId: session.lessonId },
                data: { timeSpentSeconds: { increment: estimatedDuration } },
              }),
            ]);
          }

          return updateSession;
        });

        return Promise.all(updates);
      })
      .catch((err: unknown) => {
        console.error('[autoEndStaleSessions] Failed to clean stale sessions:', err);
      });
  }

  // ── startSession ─────────────────────────────────────────────────────────
  //
  // Tạo LearningSession mới. Nếu user đã có session đang chạy → trả lại luôn (idempotent).
  // Nếu có lessonId → upsert UserProgress với status = IN_PROGRESS.
  async startSession(dto: StartSessionDto, userId: string) {
    // Bước 1: Dọn stale sessions (fire-and-forget, không await)
    this.autoEndStaleSessions(userId);

    // Bước 2: Kiểm tra đã có active session chưa (idempotent guard)
    const activeSession = await this.prisma.learningSession.findFirst({
      where: { userId, endedAt: null },
    });
    if (activeSession) {
      return activeSession;
    }

    // Bước 3: Tạo session mới + upsert UserProgress song song (Promise.all)
    const [session] = await Promise.all([
      this.prisma.learningSession.create({
        data: { userId, lessonId: dto.lessonId, activityType: dto.activityType },
      }),
      dto.lessonId
        ? this.prisma.userProgress.upsert({
            where: { userId_lessonId: { userId, lessonId: dto.lessonId } },
            create: {
              userId,
              lessonId: dto.lessonId,
              status: ProgressStatus.IN_PROGRESS,
              startedAt: new Date(),
            },
            // update chỉ đổi status, KHÔNG ghi đè startedAt nếu record đã tồn tại
            update: { status: ProgressStatus.IN_PROGRESS },
          })
        : Promise.resolve(null),
    ]);

    return session;
  }

  // ── endSession ────────────────────────────────────────────────────────────
  //
  // Kết thúc session: cập nhật endedAt + tính durationSeconds (max 4 giờ).
  // Cộng thêm vào UserProgress.timeSpentSeconds nếu session gắn với lesson.
  async endSession(dto: EndSessionDto, userId: string) {
    // Bước 1: Tìm session theo sessionId
    const session = await this.prisma.learningSession.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Learning session not found');
    }

    // Bước 2: Kiểm tra quyền — chỉ owner mới được end session của mình
    if (session.userId !== userId) {
      throw new ForbiddenException('Not your session');
    }

    // Bước 3: Idempotent — nếu đã end rồi thì trả lại luôn, không update nữa
    if (session.endedAt !== null) {
      return session;
    }

    // Bước 4: Tính duration (giới hạn tối đa 4 giờ để tránh data bất thường)
    const now = new Date();
    const rawSeconds = (now.getTime() - session.startedAt.getTime()) / 1000;
    const cappedDuration = Math.round(Math.min(rawSeconds, 4 * 60 * 60));

    // Bước 5: Update session + cộng timeSpentSeconds vào UserProgress song song
    const [updatedSession] = await Promise.all([
      this.prisma.learningSession.update({
        where: { id: dto.sessionId },
        data: { endedAt: now, durationSeconds: cappedDuration },
      }),
      session.lessonId
        ? this.prisma.userProgress.updateMany({
            where: { userId, lessonId: session.lessonId },
            data: { timeSpentSeconds: { increment: cappedDuration } },
          })
        : Promise.resolve(null),
    ]);

    return updatedSession;
  }
}
