import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProgressStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { LearnerProfileService } from '../learner-profile/index.js';
import { LessonsService } from './lessons.service.js';

const mockUserId = 'user-uuid-123';
const mockLessonId = 'lesson-uuid-456';
const mockSlug = 'intro-to-html';

const mockLesson = {
  id: mockLessonId,
  title: 'Introduction to HTML',
  slug: mockSlug,
  summary: 'Learn the basics of HTML',
  content: '# HTML Basics',
  externalLinks: [],
  estimatedMins: 30,
  isPublished: true,
  createdAt: new Date('2026-03-14T10:00:00.000Z'),
  updatedAt: new Date('2026-03-14T10:00:00.000Z'),
};

const mockEnrollment = {
  id: 'user-learning-path-uuid-789',
  userId: mockUserId,
  learningPathId: 'learning-path-uuid-111',
  currentLessonId: mockLessonId,
  startedAt: new Date('2026-03-14T10:00:00.000Z'),
  completedAt: null,
};

const createProgress = (status: ProgressStatus) => ({
  id: 'progress-uuid-222',
  userId: mockUserId,
  lessonId: mockLessonId,
  status,
  startedAt: new Date('2026-03-14T10:00:00.000Z'),
  completedAt:
    status === ProgressStatus.COMPLETED
      ? new Date('2026-03-14T11:00:00.000Z')
      : null,
  timeSpentSeconds: 600,
});

// ── Prerequisite mock data ────────────────────────────────────────────────────
//
// Shape mới: getMissingPrerequisites dùng nested select { prerequisite: { id, title, slug } }
// Khác với shape cũ: { prerequisiteId: 'x' }
const mockPrerequisite1 = {
  prerequisite: {
    id: 'prereq-lesson-1',
    title: 'HTML Basics',
    slug: 'html-basics',
  },
};
const mockPrerequisite2 = {
  prerequisite: {
    id: 'prereq-lesson-2',
    title: 'CSS Basics',
    slug: 'css-basics',
  },
};

// ── Mock LearnerProfileService ──────────────────────────────────────────────
//
// LessonsService injects LearnerProfileService to trigger synchronous
// profile recalculation after lesson/quiz/path milestones (D-09).
// We mock it here to verify the right event payloads are sent.
const mockLearnerProfileService = {
  recalculate: jest.fn().mockResolvedValue(undefined),
};

describe('LessonsService', () => {
  let service: LessonsService;
  let prisma: any;
  let learnerProfileService: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      lesson: {
        findFirst: jest.fn(),
      },
      userLearningPath: {
        findFirst: jest.fn(),
        update: jest.fn(), // dùng trong advanceToNextLesson
      },
      lessonPrerequisite: {
        findMany: jest.fn(),
      },
      userProgress: {
        // getMissingPrerequisites dùng findMany (lấy lessonId của completed prereqs)
        // Không còn dùng count nữa — đã đổi sang findMany + Set lookup
        findMany: jest.fn(),
        upsert: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      trackLesson: {
        findFirst: jest.fn(), // dùng trong advanceToNextLesson
      },
      track: {
        findFirst: jest.fn(), // dùng trong advanceToNextLesson khi hết track
      },
      quiz: {
        findUnique: jest.fn().mockResolvedValue(null), // default: lesson chưa có quiz
      },
      quizQuestion: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      quizResult: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: LearnerProfileService,
          useValue: mockLearnerProfileService,
        },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
    prisma = module.get(PrismaService);
    learnerProfileService = module.get(LearnerProfileService);

    // $transaction mock: gọi callback với prisma làm tx
    // → tx.userProgress.update === prisma.userProgress.update (đã mock)
    // → tx.trackLesson.findFirst === prisma.trackLesson.findFirst (đã mock)
    // Đảm bảo atomicity check: nếu không gọi $transaction → test sẽ fail
    prisma.$transaction = jest
      .fn()
      .mockImplementation(async (fn: any) => fn(prisma));
  });

  // ── checkPrerequisites ────────────────────────────────────────────────────

  describe('checkPrerequisites', () => {
    it('should return true when lesson has no prerequisites', async () => {
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);

      const result = await service.checkPrerequisites(mockUserId, mockLessonId);

      // getMissingPrerequisites dùng nested select { prerequisite: { id, title, slug } }
      // Khác với shape cũ: select: { prerequisiteId: true }
      expect(prisma.lessonPrerequisite.findMany).toHaveBeenCalledWith({
        where: { lessonId: mockLessonId },
        select: {
          prerequisite: {
            select: { id: true, title: true, slug: true },
          },
        },
      });
      // Không có prerequisites → không cần query userProgress
      expect(prisma.userProgress.findMany).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return true when all prerequisites are completed', async () => {
      prisma.lessonPrerequisite.findMany.mockResolvedValue([
        mockPrerequisite1,
        mockPrerequisite2,
      ]);
      // Cả 2 prerequisites đều đã COMPLETED
      prisma.userProgress.findMany.mockResolvedValue([
        { lessonId: 'prereq-lesson-1' },
        { lessonId: 'prereq-lesson-2' },
      ]);

      const result = await service.checkPrerequisites(mockUserId, mockLessonId);

      // getMissingPrerequisites dùng findMany thay vì count
      // → Lấy lessonId của completed records để filter với Set
      expect(prisma.userProgress.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          lessonId: { in: ['prereq-lesson-1', 'prereq-lesson-2'] },
          status: ProgressStatus.COMPLETED,
        },
        select: { lessonId: true },
      });
      expect(result).toBe(true);
    });

    it('should return false when some prerequisites are not completed', async () => {
      prisma.lessonPrerequisite.findMany.mockResolvedValue([
        mockPrerequisite1,
        mockPrerequisite2,
      ]);
      // Chỉ prereq-lesson-1 đã completed, prereq-lesson-2 chưa
      prisma.userProgress.findMany.mockResolvedValue([
        { lessonId: 'prereq-lesson-1' },
      ]);

      const result = await service.checkPrerequisites(mockUserId, mockLessonId);

      expect(result).toBe(false);
    });
  });

  // ── getLessonBySlug ────────────────────────────────────────────────────────

  describe('getLessonBySlug', () => {
    it('should return lesson detail with userProgress when user is enrolled and prerequisites are met', async () => {
      // userProgress trả về cho GET detail — chỉ 3 fields (select trong service)
      const mockUserProgress = {
        status: ProgressStatus.IN_PROGRESS,
        startedAt: new Date('2026-03-14T10:00:00.000Z'),
        completedAt: null,
      };

      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      // Không có prerequisites → getMissingPrerequisites trả về [] → access granted
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);
      // getLessonBySlug query userProgress để attach vào response
      prisma.userProgress.findUnique.mockResolvedValue(mockUserProgress);

      const result = await service.getLessonBySlug(mockUserId, mockSlug);

      expect(prisma.lesson.findFirst).toHaveBeenCalledWith({
        where: { slug: mockSlug, isPublished: true },
      });
      expect(prisma.userLearningPath.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          learningPath: {
            tracks: {
              some: {
                trackLessons: {
                  some: { lessonId: mockLessonId },
                },
              },
            },
          },
        },
      });
      // getLessonBySlug giờ return { ...lesson, userProgress } thay vì chỉ lesson
      expect(result).toEqual({ ...mockLesson, userProgress: mockUserProgress, quiz: null });
    });

    it('should return lesson with userProgress: null when user has not interacted with the lesson yet', async () => {
      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);
      // User chưa bao giờ start lesson → null
      prisma.userProgress.findUnique.mockResolvedValue(null);

      const result = await service.getLessonBySlug(mockUserId, mockSlug);

      // userProgress: null khi user chưa interact → frontend hiển thị nút "Start Lesson"
      expect(result).toEqual({ ...mockLesson, userProgress: null, quiz: null });
    });

    it('should throw NotFoundException when lesson is not found or not published', async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);

      const promise = service.getLessonBySlug(mockUserId, mockSlug);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ status: 404 });
      expect(prisma.lesson.findFirst).toHaveBeenCalledWith({
        where: { slug: mockSlug, isPublished: true },
      });
      expect(prisma.userLearningPath.findFirst).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not enrolled in any path containing the lesson', async () => {
      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      // checkEnrollment trả về null → throw 403
      prisma.userLearningPath.findFirst.mockResolvedValue(null);

      const promise = service.getLessonBySlug(mockUserId, mockSlug);

      await expect(promise).rejects.toThrow(ForbiddenException);
      await expect(promise).rejects.toMatchObject({ status: 403 });
      // Prerequisites check không chạy nếu chưa enroll
      expect(prisma.lessonPrerequisite.findMany).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException with missingPrerequisites when prerequisites are not met', async () => {
      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      // Có 1 prerequisite chưa completed
      prisma.lessonPrerequisite.findMany.mockResolvedValue([mockPrerequisite1]);
      // Chưa complete bài nào trong prerequisite list
      prisma.userProgress.findMany.mockResolvedValue([]);

      const promise = service.getLessonBySlug(mockUserId, mockSlug);

      await expect(promise).rejects.toThrow(ForbiddenException);
      await expect(promise).rejects.toMatchObject({ status: 403 });
    });
  });

  // ── startLesson ────────────────────────────────────────────────────────────

  describe('startLesson', () => {
    it('should create new UserProgress with IN_PROGRESS status', async () => {
      const inProgress = createProgress(ProgressStatus.IN_PROGRESS);

      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      // Không có prerequisites → access granted
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);
      prisma.userProgress.upsert.mockResolvedValue(inProgress);

      const result = await service.startLesson(mockUserId, mockSlug);

      expect(prisma.userProgress.upsert).toHaveBeenCalledWith({
        where: {
          userId_lessonId: { userId: mockUserId, lessonId: mockLessonId },
        },
        update: {},
        create: {
          userId: mockUserId,
          lessonId: mockLessonId,
          status: ProgressStatus.IN_PROGRESS,
          startedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(inProgress);
    });

    it('should throw NotFoundException when lesson is not found', async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);

      const promise = service.startLesson(mockUserId, mockSlug);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ status: 404 });
      expect(prisma.userLearningPath.findFirst).not.toHaveBeenCalled();
      expect(prisma.userProgress.upsert).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not enrolled', async () => {
      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(null);

      const promise = service.startLesson(mockUserId, mockSlug);

      await expect(promise).rejects.toThrow(ForbiddenException);
      await expect(promise).rejects.toMatchObject({ status: 403 });
      // prerequisites check không chạy nếu chưa enroll
      expect(prisma.lessonPrerequisite.findMany).not.toHaveBeenCalled();
      expect(prisma.userProgress.upsert).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when prerequisites are not met', async () => {
      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      // Có prerequisite nhưng chưa complete
      prisma.lessonPrerequisite.findMany.mockResolvedValue([mockPrerequisite1]);
      prisma.userProgress.findMany.mockResolvedValue([]);

      const promise = service.startLesson(mockUserId, mockSlug);

      await expect(promise).rejects.toThrow(ForbiddenException);
      await expect(promise).rejects.toMatchObject({ status: 403 });
      expect(prisma.userProgress.upsert).not.toHaveBeenCalled();
    });

    it('should return existing progress when lesson is already started without resetting it', async () => {
      const existingProgress = createProgress(ProgressStatus.IN_PROGRESS);

      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);
      prisma.userProgress.upsert.mockResolvedValue(existingProgress);

      const result = await service.startLesson(mockUserId, mockSlug);

      // upsert với update: {} → không thay đổi nếu đã tồn tại (idempotent)
      expect(prisma.userProgress.upsert).toHaveBeenCalledWith({
        where: {
          userId_lessonId: { userId: mockUserId, lessonId: mockLessonId },
        },
        update: {},
        create: {
          userId: mockUserId,
          lessonId: mockLessonId,
          status: ProgressStatus.IN_PROGRESS,
          startedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(existingProgress);
    });
  });

  // ── completeLesson ─────────────────────────────────────────────────────────

  describe('completeLesson', () => {
    it('should update UserProgress to COMPLETED with completedAt (advance skipped when no track found)', async () => {
      const inProgress = createProgress(ProgressStatus.IN_PROGRESS);
      const completedProgress = createProgress(ProgressStatus.COMPLETED);

      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);
      prisma.userProgress.findUnique.mockResolvedValue(inProgress);
      prisma.userProgress.update.mockResolvedValue(completedProgress);
      // advanceToNextLesson: không tìm thấy TrackLesson → return early
      // Tránh cần mock toàn bộ advance chain (trackLesson → track → userLearningPath)
      prisma.trackLesson.findFirst.mockResolvedValue(null);

      const result = await service.completeLesson(mockUserId, mockSlug);

      expect(prisma.userProgress.findUnique).toHaveBeenCalledWith({
        where: {
          userId_lessonId: { userId: mockUserId, lessonId: mockLessonId },
        },
      });
      // completeLesson dùng $transaction để đảm bảo atomicity
      // progress update + advance phải cùng thành công hoặc cùng rollback
      expect(prisma.$transaction).toHaveBeenCalled();
      // update được gọi bên trong transaction
      expect(prisma.userProgress.update).toHaveBeenCalledWith({
        where: {
          userId_lessonId: { userId: mockUserId, lessonId: mockLessonId },
        },
        data: {
          status: ProgressStatus.COMPLETED,
          completedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(completedProgress);
    });

    it('should throw NotFoundException when lesson is not found', async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);

      const promise = service.completeLesson(mockUserId, mockSlug);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ status: 404 });
      expect(prisma.userLearningPath.findFirst).not.toHaveBeenCalled();
      expect(prisma.userProgress.findUnique).not.toHaveBeenCalled();
      expect(prisma.userProgress.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not enrolled', async () => {
      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(null);

      const promise = service.completeLesson(mockUserId, mockSlug);

      await expect(promise).rejects.toThrow(ForbiddenException);
      await expect(promise).rejects.toMatchObject({ status: 403 });
      expect(prisma.lessonPrerequisite.findMany).not.toHaveBeenCalled();
      expect(prisma.userProgress.findUnique).not.toHaveBeenCalled();
      expect(prisma.userProgress.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when prerequisites are not met', async () => {
      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      prisma.lessonPrerequisite.findMany.mockResolvedValue([mockPrerequisite1]);
      prisma.userProgress.findMany.mockResolvedValue([]);

      const promise = service.completeLesson(mockUserId, mockSlug);

      await expect(promise).rejects.toThrow(ForbiddenException);
      await expect(promise).rejects.toMatchObject({ status: 403 });
      expect(prisma.userProgress.findUnique).not.toHaveBeenCalled();
      expect(prisma.userProgress.update).not.toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException when lesson has not been started yet and no progress exists', async () => {
      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);
      // Chưa có record → null
      prisma.userProgress.findUnique.mockResolvedValue(null);

      const promise = service.completeLesson(mockUserId, mockSlug);

      await expect(promise).rejects.toThrow(UnprocessableEntityException);
      await expect(promise).rejects.toMatchObject({ status: 422 });
      expect(prisma.userProgress.update).not.toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException when lesson progress status is NOT_STARTED', async () => {
      const notStartedProgress = createProgress(ProgressStatus.NOT_STARTED);

      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);
      prisma.userProgress.findUnique.mockResolvedValue(notStartedProgress);

      const promise = service.completeLesson(mockUserId, mockSlug);

      await expect(promise).rejects.toThrow(UnprocessableEntityException);
      await expect(promise).rejects.toMatchObject({ status: 422 });
      expect(prisma.userProgress.update).not.toHaveBeenCalled();
    });

    it('should return existing progress when lesson is already completed', async () => {
      const completedProgress = createProgress(ProgressStatus.COMPLETED);

      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);
      // Đã COMPLETED → idempotent, return luôn không qua transaction
      prisma.userProgress.findUnique.mockResolvedValue(completedProgress);

      const result = await service.completeLesson(mockUserId, mockSlug);

      // Idempotent: không gọi update, không gọi $transaction
      expect(prisma.userProgress.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual(completedProgress);
    });
  });

  // ── learnerProfileService.recalculate wiring ────────────────────────────────
  //
  // Verify that lesson/quiz/path milestones trigger synchronous profile
  // recalculation via LearnerProfileService (D-09).

  describe('learnerProfileService.recalculate wiring', () => {
    // ── Test 1: completeLesson triggers LESSON_COMPLETED recalc ─────────────

    it('should call learnerProfileService.recalculate with LESSON_COMPLETED after completeLesson', async () => {
      const inProgress = createProgress(ProgressStatus.IN_PROGRESS);
      const completedProgress = createProgress(ProgressStatus.COMPLETED);

      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);
      prisma.userProgress.findUnique.mockResolvedValue(inProgress);
      prisma.userProgress.update.mockResolvedValue(completedProgress);
      // advanceToNextLesson: no track found → return { pathCompleted: false }
      prisma.trackLesson.findFirst.mockResolvedValue(null);

      await service.completeLesson(mockUserId, mockSlug);

      expect(learnerProfileService.recalculate).toHaveBeenCalledWith(
        mockUserId,
        { type: 'LESSON_COMPLETED', lessonId: mockLessonId },
      );
    });

    // ── Test 2: completeLesson triggers TRACK_COMPLETED when path finishes ──

    it('should also call TRACK_COMPLETED recalc when advanceToNextLesson finishes the path', async () => {
      const inProgress = createProgress(ProgressStatus.IN_PROGRESS);
      const completedProgress = createProgress(ProgressStatus.COMPLETED);

      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);
      prisma.userProgress.findUnique.mockResolvedValue(inProgress);
      prisma.userProgress.update.mockResolvedValue(completedProgress);

      // advanceToNextLesson: find current trackLesson
      prisma.trackLesson.findFirst
        .mockResolvedValueOnce({
          // currentTrackLesson (first call)
          trackId: 'track-1',
          order: 1,
          track: { id: 'track-1', learningPathId: mockEnrollment.learningPathId, order: 1 },
        })
        .mockResolvedValueOnce(null); // nextInTrack (second call) — no more lessons in track

      // No more tracks in path → path completed
      prisma.track.findFirst.mockResolvedValue(null);
      prisma.userLearningPath.update.mockResolvedValue({});

      await service.completeLesson(mockUserId, mockSlug);

      // Should call LESSON_COMPLETED first, then TRACK_COMPLETED
      expect(learnerProfileService.recalculate).toHaveBeenCalledTimes(2);
      expect(learnerProfileService.recalculate).toHaveBeenNthCalledWith(
        1,
        mockUserId,
        { type: 'LESSON_COMPLETED', lessonId: mockLessonId },
      );
      expect(learnerProfileService.recalculate).toHaveBeenNthCalledWith(
        2,
        mockUserId,
        { type: 'TRACK_COMPLETED', learningPathId: mockEnrollment.learningPathId },
      );
    });

    // ── Test 3: submitQuiz triggers QUIZ_PASSED recalc on pass ──────────────

    it('should call learnerProfileService.recalculate with QUIZ_PASSED when quiz is passed', async () => {
      const mockQuiz = {
        id: 'quiz-uuid-1',
        lessonId: mockLessonId,
        title: 'HTML Quiz',
        description: null,
        passThreshold: 70,
        retryLimit: 3,
        questions: [
          {
            id: 'q1',
            questionText: 'What is HTML?',
            questionType: 'SINGLE_CHOICE',
            options: [{ id: 'a', text: 'Markup' }],
            correctAnswer: ['a'],
            explanation: 'HTML is a markup language',
            order: 1,
          },
        ],
      };

      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizResult.count.mockResolvedValue(0);
      prisma.quizResult.create.mockResolvedValue({});

      // Submit correct answer → 100% score → passed
      await service.submitQuiz(mockUserId, mockSlug, { q1: ['a'] });

      expect(learnerProfileService.recalculate).toHaveBeenCalledWith(
        mockUserId,
        { type: 'QUIZ_PASSED', quizId: 'quiz-uuid-1', lessonId: mockLessonId },
      );
    });

    // ── Test 4: submitQuiz does NOT trigger recalc on fail ───────────────────

    it('should NOT call learnerProfileService.recalculate when quiz is failed', async () => {
      const mockQuiz = {
        id: 'quiz-uuid-1',
        lessonId: mockLessonId,
        title: 'HTML Quiz',
        description: null,
        passThreshold: 70,
        retryLimit: 3,
        questions: [
          {
            id: 'q1',
            questionText: 'What is HTML?',
            questionType: 'SINGLE_CHOICE',
            options: [{ id: 'a', text: 'Markup' }, { id: 'b', text: 'Style' }],
            correctAnswer: ['a'],
            explanation: 'HTML is a markup language',
            order: 1,
          },
        ],
      };

      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizResult.count.mockResolvedValue(0);
      prisma.quizResult.create.mockResolvedValue({});

      // Submit wrong answer → 0% score → failed (threshold 70%)
      await service.submitQuiz(mockUserId, mockSlug, { q1: ['b'] });

      // Failed quiz → no recalc
      expect(learnerProfileService.recalculate).not.toHaveBeenCalled();
    });

    // ── Test 5: completeLesson does NOT trigger recalc when already completed (idempotent) ──

    it('should NOT trigger recalculate when lesson is already completed (idempotent)', async () => {
      const completedProgress = createProgress(ProgressStatus.COMPLETED);

      prisma.lesson.findFirst.mockResolvedValue(mockLesson);
      prisma.userLearningPath.findFirst.mockResolvedValue(mockEnrollment);
      prisma.lessonPrerequisite.findMany.mockResolvedValue([]);
      prisma.userProgress.findUnique.mockResolvedValue(completedProgress);

      await service.completeLesson(mockUserId, mockSlug);

      // Idempotent — already completed, no recalc
      expect(learnerProfileService.recalculate).not.toHaveBeenCalled();
    });
  });
});
