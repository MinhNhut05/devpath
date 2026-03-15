import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProgressStatus, ActivityType } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { ProgressService } from './progress.service.js';

const mockUserId = 'user-uuid-123';
const mockPathId = 'path-uuid-456';
const mockLessonId = 'lesson-uuid-789';
const mockSessionId = 'session-uuid-abc';

describe('ProgressService', () => {
  let service: ProgressService;
  let prisma: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      userLearningPath: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      userProgress: {
        count: jest.fn(),
        aggregate: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        updateMany: jest.fn(),
      },
      trackLesson: {
        count: jest.fn(),
      },
      track: {
        findMany: jest.fn(),
      },
      learningSession: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    prisma = module.get(PrismaService);
  });

  // ── getOverallProgress ──────────────────────────────────────────────────

  describe('getOverallProgress', () => {
    it('should return overall progress with 2 enrolled paths', async () => {
      const mockUserPaths = [
        {
          learningPathId: 'path-1',
          learningPath: { id: 'path-1', name: 'Frontend', slug: 'frontend' },
          currentLesson: { id: 'lesson-1', title: 'HTML', slug: 'html' },
          startedAt: new Date('2026-01-01'),
          completedAt: null,
        },
        {
          learningPathId: 'path-2',
          learningPath: { id: 'path-2', name: 'Backend', slug: 'backend' },
          currentLesson: null,
          startedAt: new Date('2026-01-15'),
          completedAt: new Date('2026-02-15'),
        },
      ];

      prisma.userLearningPath.findMany.mockResolvedValue(mockUserPaths);

      // Path 1: 10 total lessons, 3 completed → 30%
      // Path 2: 5 total lessons, 5 completed → 100%
      prisma.trackLesson.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5);
      prisma.userProgress.count
        .mockResolvedValueOnce(3) // path-1 completed lessons
        .mockResolvedValueOnce(5) // path-2 completed lessons
        .mockResolvedValueOnce(8); // total completed globally
      prisma.userProgress.aggregate.mockResolvedValue({
        _sum: { timeSpentSeconds: 3600 },
      });

      const result = await service.getOverallProgress(mockUserId);

      expect(result.enrolledPaths).toBe(2);
      expect(result.completedPaths).toBe(1); // only path-2 has completedAt
      expect(result.totalLessonsCompleted).toBe(8);
      expect(result.totalTimeSpentSeconds).toBe(3600);
      expect(result.paths).toHaveLength(2);
      expect(result.paths[0].progress).toBe(30); // 3/10
      expect(result.paths[1].progress).toBe(100); // 5/5
      expect(result.paths[0].currentLesson).toEqual({
        id: 'lesson-1',
        title: 'HTML',
        slug: 'html',
      });
      expect(result.paths[1].currentLesson).toBeNull();
    });

    it('should return empty when no enrolled paths', async () => {
      prisma.userLearningPath.findMany.mockResolvedValue([]);
      prisma.userProgress.count.mockResolvedValue(0);
      prisma.userProgress.aggregate.mockResolvedValue({
        _sum: { timeSpentSeconds: null },
      });

      const result = await service.getOverallProgress(mockUserId);

      expect(result.enrolledPaths).toBe(0);
      expect(result.completedPaths).toBe(0);
      expect(result.totalLessonsCompleted).toBe(0);
      expect(result.totalTimeSpentSeconds).toBe(0);
      expect(result.paths).toEqual([]);
    });
  });

  // ── getPathProgress ─────────────────────────────────────────────────────

  describe('getPathProgress', () => {
    it('should return path progress with tracks and lesson statuses', async () => {
      const mockUserPath = {
        learningPathId: mockPathId,
        learningPath: { id: mockPathId, name: 'Frontend', slug: 'frontend' },
        currentLesson: { id: 'lesson-1', title: 'HTML', slug: 'html' },
        startedAt: new Date('2026-01-01'),
        completedAt: null,
      };

      const mockTracks = [
        {
          id: 'track-1',
          name: 'Basics',
          order: 1,
          trackLessons: [
            {
              lessonId: 'lesson-1',
              lesson: {
                id: 'lesson-1',
                title: 'HTML',
                slug: 'html',
                estimatedMins: 30,
              },
            },
            {
              lessonId: 'lesson-2',
              lesson: {
                id: 'lesson-2',
                title: 'CSS',
                slug: 'css',
                estimatedMins: 45,
              },
            },
          ],
        },
      ];

      // lesson-1: COMPLETED, lesson-2: IN_PROGRESS
      const mockProgress = [
        {
          lessonId: 'lesson-1',
          status: ProgressStatus.COMPLETED,
          timeSpentSeconds: 1200,
        },
        {
          lessonId: 'lesson-2',
          status: ProgressStatus.IN_PROGRESS,
          timeSpentSeconds: 300,
        },
      ];

      prisma.userLearningPath.findUnique.mockResolvedValue(mockUserPath);
      prisma.track.findMany.mockResolvedValue(mockTracks);
      prisma.userProgress.findMany.mockResolvedValue(mockProgress);

      const result = await service.getPathProgress(mockPathId, mockUserId);

      expect(result.path).toEqual({
        id: mockPathId,
        name: 'Frontend',
        slug: 'frontend',
      });
      expect(result.progress).toBe(50); // 1/2 completed
      expect(result.tracks).toHaveLength(1);
      expect(result.tracks[0].lessons).toHaveLength(2);
      expect(result.tracks[0].lessons[0].status).toBe(
        ProgressStatus.COMPLETED,
      );
      expect(result.tracks[0].lessons[1].status).toBe(
        ProgressStatus.IN_PROGRESS,
      );
      expect(result.tracks[0].lessons[0].timeSpentSeconds).toBe(1200);
    });

    it('should throw NotFoundException when user is not enrolled', async () => {
      prisma.userLearningPath.findUnique.mockResolvedValue(null);

      await expect(
        service.getPathProgress(mockPathId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return NOT_STARTED for lessons without progress records', async () => {
      const mockUserPath = {
        learningPathId: mockPathId,
        learningPath: { id: mockPathId, name: 'Frontend', slug: 'frontend' },
        currentLesson: null,
        startedAt: new Date('2026-01-01'),
        completedAt: null,
      };

      const mockTracks = [
        {
          id: 'track-1',
          name: 'Basics',
          order: 1,
          trackLessons: [
            {
              lessonId: 'lesson-1',
              lesson: {
                id: 'lesson-1',
                title: 'HTML',
                slug: 'html',
                estimatedMins: 30,
              },
            },
          ],
        },
      ];

      prisma.userLearningPath.findUnique.mockResolvedValue(mockUserPath);
      prisma.track.findMany.mockResolvedValue(mockTracks);
      // No progress records at all
      prisma.userProgress.findMany.mockResolvedValue([]);

      const result = await service.getPathProgress(mockPathId, mockUserId);

      expect(result.tracks[0].lessons[0].status).toBe(
        ProgressStatus.NOT_STARTED,
      );
      expect(result.tracks[0].lessons[0].timeSpentSeconds).toBe(0);
      expect(result.progress).toBe(0);
    });
  });

  // ── startSession ────────────────────────────────────────────────────────

  describe('startSession', () => {
    const mockNewSession = {
      id: mockSessionId,
      userId: mockUserId,
      lessonId: mockLessonId,
      activityType: ActivityType.LESSON_VIEW,
      startedAt: new Date('2026-03-15T10:00:00Z'),
      endedAt: null,
      durationSeconds: null,
    };

    it('should create a new session when no active session exists', async () => {
      // autoEndStaleSessions: no stale sessions
      prisma.learningSession.findMany.mockResolvedValue([]);
      // No active session
      prisma.learningSession.findFirst.mockResolvedValue(null);
      prisma.learningSession.create.mockResolvedValue(mockNewSession);
      prisma.userProgress.upsert.mockResolvedValue({});

      const result = await service.startSession(
        { lessonId: mockLessonId, activityType: ActivityType.LESSON_VIEW },
        mockUserId,
      );

      expect(result).toEqual(mockNewSession);
      expect(prisma.learningSession.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          lessonId: mockLessonId,
          activityType: ActivityType.LESSON_VIEW,
        },
      });
    });

    it('should return existing active session (idempotent)', async () => {
      const existingSession = { ...mockNewSession };

      // autoEndStaleSessions: no stale
      prisma.learningSession.findMany.mockResolvedValue([]);
      // Active session found
      prisma.learningSession.findFirst.mockResolvedValue(existingSession);

      const result = await service.startSession(
        { lessonId: mockLessonId, activityType: ActivityType.LESSON_VIEW },
        mockUserId,
      );

      expect(result).toEqual(existingSession);
      expect(prisma.learningSession.create).not.toHaveBeenCalled();
    });

    it('should upsert UserProgress when lessonId is provided', async () => {
      prisma.learningSession.findMany.mockResolvedValue([]);
      prisma.learningSession.findFirst.mockResolvedValue(null);
      prisma.learningSession.create.mockResolvedValue(mockNewSession);
      prisma.userProgress.upsert.mockResolvedValue({});

      await service.startSession(
        { lessonId: mockLessonId, activityType: ActivityType.LESSON_VIEW },
        mockUserId,
      );

      expect(prisma.userProgress.upsert).toHaveBeenCalledWith({
        where: {
          userId_lessonId: { userId: mockUserId, lessonId: mockLessonId },
        },
        create: {
          userId: mockUserId,
          lessonId: mockLessonId,
          status: ProgressStatus.IN_PROGRESS,
          startedAt: expect.any(Date),
        },
        update: { status: ProgressStatus.IN_PROGRESS },
      });
    });

    it('should NOT upsert UserProgress when lessonId is not provided', async () => {
      const sessionNoLesson = { ...mockNewSession, lessonId: null };
      prisma.learningSession.findMany.mockResolvedValue([]);
      prisma.learningSession.findFirst.mockResolvedValue(null);
      prisma.learningSession.create.mockResolvedValue(sessionNoLesson);

      await service.startSession(
        {
          lessonId: undefined,
          activityType: ActivityType.AI_CHAT,
        },
        mockUserId,
      );

      expect(prisma.userProgress.upsert).not.toHaveBeenCalled();
    });

    it('should call autoEndStaleSessions without crashing', async () => {
      // autoEndStaleSessions fire-and-forget: even if findMany rejects, startSession should still work
      prisma.learningSession.findMany.mockRejectedValue(
        new Error('DB error'),
      );
      prisma.learningSession.findFirst.mockResolvedValue(null);
      prisma.learningSession.create.mockResolvedValue(mockNewSession);
      prisma.userProgress.upsert.mockResolvedValue({});

      // Should not throw despite autoEndStaleSessions failing
      const result = await service.startSession(
        { lessonId: mockLessonId, activityType: ActivityType.LESSON_VIEW },
        mockUserId,
      );

      expect(result).toEqual(mockNewSession);
    });
  });

  // ── endSession ──────────────────────────────────────────────────────────

  describe('endSession', () => {
    const sessionStartedAt = new Date('2026-03-15T10:00:00Z');

    const mockActiveSession = {
      id: mockSessionId,
      userId: mockUserId,
      lessonId: mockLessonId,
      activityType: ActivityType.LESSON_VIEW,
      startedAt: sessionStartedAt,
      endedAt: null,
      durationSeconds: null,
    };

    it('should end session and calculate duration', async () => {
      const updatedSession = {
        ...mockActiveSession,
        endedAt: expect.any(Date),
        durationSeconds: expect.any(Number),
      };

      prisma.learningSession.findUnique.mockResolvedValue(mockActiveSession);
      prisma.learningSession.update.mockResolvedValue(updatedSession);
      prisma.userProgress.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.endSession(
        { sessionId: mockSessionId },
        mockUserId,
      );

      expect(prisma.learningSession.update).toHaveBeenCalledWith({
        where: { id: mockSessionId },
        data: {
          endedAt: expect.any(Date),
          durationSeconds: expect.any(Number),
        },
      });
      expect(result).toEqual(updatedSession);
    });

    it('should return session if already ended (idempotent)', async () => {
      const alreadyEndedSession = {
        ...mockActiveSession,
        endedAt: new Date('2026-03-15T11:00:00Z'),
        durationSeconds: 3600,
      };

      prisma.learningSession.findUnique.mockResolvedValue(alreadyEndedSession);

      const result = await service.endSession(
        { sessionId: mockSessionId },
        mockUserId,
      );

      expect(result).toEqual(alreadyEndedSession);
      expect(prisma.learningSession.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when session not found', async () => {
      prisma.learningSession.findUnique.mockResolvedValue(null);

      await expect(
        service.endSession({ sessionId: mockSessionId }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when userId does not match', async () => {
      const otherUserSession = { ...mockActiveSession, userId: 'other-user' };
      prisma.learningSession.findUnique.mockResolvedValue(otherUserSession);

      await expect(
        service.endSession({ sessionId: mockSessionId }, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should cap duration at 4 hours (14400s) for long-running sessions', async () => {
      // Session started 10 hours ago
      const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
      const longSession = { ...mockActiveSession, startedAt: tenHoursAgo };

      prisma.learningSession.findUnique.mockResolvedValue(longSession);
      prisma.learningSession.update.mockImplementation(
        async ({ data }: any) => ({
          ...longSession,
          endedAt: data.endedAt,
          durationSeconds: data.durationSeconds,
        }),
      );
      prisma.userProgress.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.endSession(
        { sessionId: mockSessionId },
        mockUserId,
      );

      // Duration should be capped at 14400 (4 hours), not 36000 (10 hours)
      expect((result as any).durationSeconds).toBe(14400);
    });

    it('should update UserProgress timeSpentSeconds when session has lessonId', async () => {
      prisma.learningSession.findUnique.mockResolvedValue(mockActiveSession);
      prisma.learningSession.update.mockResolvedValue({
        ...mockActiveSession,
        endedAt: new Date(),
        durationSeconds: 100,
      });
      prisma.userProgress.updateMany.mockResolvedValue({ count: 1 });

      await service.endSession({ sessionId: mockSessionId }, mockUserId);

      expect(prisma.userProgress.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, lessonId: mockLessonId },
        data: { timeSpentSeconds: { increment: expect.any(Number) } },
      });
    });

    it('should NOT update UserProgress when session has no lessonId', async () => {
      const noLessonSession = { ...mockActiveSession, lessonId: null };
      prisma.learningSession.findUnique.mockResolvedValue(noLessonSession);
      prisma.learningSession.update.mockResolvedValue({
        ...noLessonSession,
        endedAt: new Date(),
        durationSeconds: 100,
      });

      await service.endSession({ sessionId: mockSessionId }, mockUserId);

      expect(prisma.userProgress.updateMany).not.toHaveBeenCalled();
    });
  });

  // ── getActivityData ─────────────────────────────────────────────────────

  describe('getActivityData', () => {
    it('should return activity data with date filling for 30 days', async () => {
      // Create sessions scattered across different days
      const sessions = [
        {
          startedAt: new Date('2026-03-10T10:00:00Z'),
          activityType: ActivityType.LESSON_VIEW,
        },
        {
          startedAt: new Date('2026-03-10T14:00:00Z'),
          activityType: ActivityType.QUIZ_ATTEMPT,
        },
        {
          startedAt: new Date('2026-03-12T09:00:00Z'),
          activityType: ActivityType.LESSON_VIEW,
        },
      ];

      prisma.learningSession.findMany.mockResolvedValue(sessions);

      const result = await service.getActivityData({ days: 30 }, mockUserId);

      expect(result.days).toBe(30);
      // Should have 30+ dates (from startDate to today)
      expect(result.data.length).toBeGreaterThanOrEqual(30);

      // Find the date with activities
      const march10 = result.data.find(
        (d: any) => d.date === '2026-03-10',
      );
      if (march10) {
        expect(march10.totalCount).toBe(2);
        expect(march10.activities).toHaveLength(2);
      }

      // Days without activity should have totalCount: 0
      const emptyDays = result.data.filter(
        (d: any) => d.totalCount === 0,
      );
      expect(emptyDays.length).toBeGreaterThan(0);
      emptyDays.forEach((d: any) => {
        expect(d.activities).toEqual([]);
      });
    });

    it('should return all dates with totalCount 0 when no sessions exist', async () => {
      prisma.learningSession.findMany.mockResolvedValue([]);

      const result = await service.getActivityData({ days: 30 }, mockUserId);

      expect(result.days).toBe(30);
      expect(result.data.length).toBeGreaterThanOrEqual(30);
      result.data.forEach((d: any) => {
        expect(d.totalCount).toBe(0);
        expect(d.activities).toEqual([]);
      });
    });

    it('should group multiple activity types on the same day correctly', async () => {
      const sessions = [
        {
          startedAt: new Date('2026-03-14T08:00:00Z'),
          activityType: ActivityType.LESSON_VIEW,
        },
        {
          startedAt: new Date('2026-03-14T09:00:00Z'),
          activityType: ActivityType.LESSON_VIEW,
        },
        {
          startedAt: new Date('2026-03-14T10:00:00Z'),
          activityType: ActivityType.AI_CHAT,
        },
      ];

      prisma.learningSession.findMany.mockResolvedValue(sessions);

      const result = await service.getActivityData({ days: 7 }, mockUserId);

      const march14 = result.data.find(
        (d: any) => d.date === '2026-03-14',
      );
      if (march14) {
        expect(march14.totalCount).toBe(3);
        const lessonView = march14.activities.find(
          (a: any) => a.type === ActivityType.LESSON_VIEW,
        );
        const aiChat = march14.activities.find(
          (a: any) => a.type === ActivityType.AI_CHAT,
        );
        expect(lessonView?.count).toBe(2);
        expect(aiChat?.count).toBe(1);
      }
    });

    it('should use default 30 days when days is not provided', async () => {
      prisma.learningSession.findMany.mockResolvedValue([]);

      const result = await service.getActivityData({}, mockUserId);

      expect(result.days).toBe(30);
    });
  });
});
