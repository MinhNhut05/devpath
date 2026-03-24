// learner-profile.service.spec.ts - Unit tests for LearnerProfileService
//
// Mock: PrismaService (learnerProfile, onboardingRound, lesson, userProgress,
//        quizResult, track, aIInteractionLog)
// Tests:
//   1. getMyProfile returns canonical profile fields + roundsCompleted
//   2. getMyProfile throws NotFoundException when profile row is missing
//   3. getMyProfile only includes completed rounds (non-null completedAt)
//   4. LearnerProfileService is exported from LearnerProfileModule
//   5. recalculate LESSON_COMPLETED updates learningPace from time vs estimated
//   6. recalculate QUIZ_PASSED updates skillLevel, strengths, weaknesses
//   7. recalculate TRACK_COMPLETED updates preferredTopics from tracks + AI logs
//   8. recalculate TRACK_COMPLETED merges AI chat topics uniquely
//   9. recalculate returns quietly when no profile exists (pre-onboarding)

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  CareerGoal,
  LearnerSkillLevel,
  LearnerLearningPace,
  ProgressStatus,
} from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { LearnerProfileService } from './learner-profile.service.js';
import { LearnerProfileModule } from './learner-profile.module.js';

// ── Mock data ──────────────────────────────────────────────────────────────

const mockUserId = 'user-uuid-123';
const mockNow = new Date('2026-03-24T10:00:00.000Z');

const mockProfile = {
  id: 'profile-uuid-1',
  userId: mockUserId,
  careerGoal: CareerGoal.FRONTEND,
  skillLevel: LearnerSkillLevel.BEGINNER,
  learningPace: LearnerLearningPace.NORMAL,
  strengths: ['html', 'css'],
  weaknesses: ['javascript'],
  preferredTopics: ['react', 'typescript'],
  lastRecalculatedAt: mockNow,
  createdAt: mockNow,
  updatedAt: mockNow,
};

const mockRounds = [
  { roundNumber: 1, completedAt: new Date('2026-03-20T08:00:00.000Z') },
  { roundNumber: 2, completedAt: new Date('2026-03-22T12:00:00.000Z') },
];

// ── Tests ──────────────────────────────────────────────────────────────────

describe('LearnerProfileService', () => {
  let service: LearnerProfileService;
  let prisma: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      learnerProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      onboardingRound: {
        findMany: jest.fn(),
      },
      lesson: {
        findUnique: jest.fn(),
      },
      userProgress: {
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      quizResult: {
        findMany: jest.fn(),
      },
      track: {
        findMany: jest.fn(),
      },
      aIInteractionLog: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearnerProfileService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<LearnerProfileService>(LearnerProfileService);
    prisma = module.get(PrismaService);
  });

  // ── getMyProfile ─────────────────────────────────────────────────────────

  describe('getMyProfile()', () => {
    // ── Test 1: Happy path — returns canonical profile + roundsCompleted ──

    it('should return canonical profile fields and roundsCompleted', async () => {
      prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.onboardingRound.findMany.mockResolvedValue(mockRounds);

      const result = await service.getMyProfile(mockUserId);

      // Verify returned shape matches the canonical contract
      expect(result).toEqual({
        userId: mockUserId,
        careerGoal: CareerGoal.FRONTEND,
        skillLevel: LearnerSkillLevel.BEGINNER,
        learningPace: LearnerLearningPace.NORMAL,
        strengths: ['html', 'css'],
        weaknesses: ['javascript'],
        preferredTopics: ['react', 'typescript'],
        lastRecalculatedAt: mockNow,
        roundsCompleted: [1, 2],
      });

      // Verify Prisma was called with correct params
      expect(prisma.learnerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(prisma.onboardingRound.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { roundNumber: 'asc' },
        select: { roundNumber: true, completedAt: true },
      });
    });

    // ── Test 2: NotFoundException when no profile row exists ──────────────

    it('should throw NotFoundException when no LearnerProfile row exists', async () => {
      prisma.learnerProfile.findUnique.mockResolvedValue(null);
      prisma.onboardingRound.findMany.mockResolvedValue([]);

      await expect(service.getMyProfile(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getMyProfile(mockUserId)).rejects.toThrow(
        'Learner profile not initialized',
      );
    });

    // ── Test 3: Only includes rounds with non-null completedAt ───────────

    it('should only include completed rounds in roundsCompleted', async () => {
      prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.onboardingRound.findMany.mockResolvedValue([
        { roundNumber: 1, completedAt: new Date('2026-03-20T08:00:00.000Z') },
        { roundNumber: 2, completedAt: null }, // Not completed yet
        { roundNumber: 3, completedAt: new Date('2026-03-24T10:00:00.000Z') },
      ]);

      const result = await service.getMyProfile(mockUserId);

      // Round 2 should be excluded because completedAt is null
      expect(result.roundsCompleted).toEqual([1, 3]);
    });

    // ── Test 4: Empty rounds when user has profile but no rounds ─────────

    it('should return empty roundsCompleted when no rounds exist', async () => {
      prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.onboardingRound.findMany.mockResolvedValue([]);

      const result = await service.getMyProfile(mockUserId);

      expect(result.roundsCompleted).toEqual([]);
    });

    // ── Test 5: Does not leak raw answers or internal fields ─────────────

    it('should not include raw answers or internal profile fields', async () => {
      prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.onboardingRound.findMany.mockResolvedValue(mockRounds);

      const result = await service.getMyProfile(mockUserId);

      // D-01: raw answers stay in round storage, not in the profile response
      expect(result).not.toHaveProperty('answers');
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });
  });

  // ── Module export test ────────────────────────────────────────────────────

  describe('module exports', () => {
    it('should be exported from LearnerProfileModule for cross-module reuse', () => {
      // Verify the module metadata declares LearnerProfileService in exports.
      // We check @Module() metadata directly to avoid pulling in AuthModule's
      // full dependency tree (MailerModule, ConfigService, etc.) in a unit test.
      const moduleExports = Reflect.getMetadata('exports', LearnerProfileModule);

      expect(moduleExports).toBeDefined();
      expect(moduleExports).toContain(LearnerProfileService);
    });
  });

  // ── recalculate() ─────────────────────────────────────────────────────────

  describe('recalculate()', () => {
    // ── Test 5: LESSON_COMPLETED updates learningPace ────────────────────

    describe('LESSON_COMPLETED', () => {
      const lessonId = 'lesson-uuid-1';

      it('should set learningPace to FAST when time spent <= 80% of estimated', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
        // Lesson estimated 30 minutes, user spent 20 minutes (< 30*60*0.8 = 1440s)
        prisma.lesson.findUnique.mockResolvedValue({ estimatedMins: 30 });
        prisma.userProgress.findUnique.mockResolvedValue({ timeSpentSeconds: 1200 });
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'LESSON_COMPLETED',
          lessonId,
        });

        expect(prisma.learnerProfile.update).toHaveBeenCalledWith({
          where: { userId: mockUserId },
          data: {
            learningPace: LearnerLearningPace.FAST,
            lastRecalculatedAt: expect.any(Date),
          },
        });
      });

      it('should set learningPace to SLOW when time spent >= 120% of estimated', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
        // Lesson estimated 30 minutes, user spent 40 minutes (>= 30*60*1.2 = 2160s)
        prisma.lesson.findUnique.mockResolvedValue({ estimatedMins: 30 });
        prisma.userProgress.findUnique.mockResolvedValue({ timeSpentSeconds: 2400 });
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'LESSON_COMPLETED',
          lessonId,
        });

        expect(prisma.learnerProfile.update).toHaveBeenCalledWith({
          where: { userId: mockUserId },
          data: {
            learningPace: LearnerLearningPace.SLOW,
            lastRecalculatedAt: expect.any(Date),
          },
        });
      });

      it('should set learningPace to NORMAL when time is between 80%-120%', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
        // Lesson estimated 30 minutes, user spent 28 minutes (1680s — in normal range)
        prisma.lesson.findUnique.mockResolvedValue({ estimatedMins: 30 });
        prisma.userProgress.findUnique.mockResolvedValue({ timeSpentSeconds: 1680 });
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'LESSON_COMPLETED',
          lessonId,
        });

        expect(prisma.learnerProfile.update).toHaveBeenCalledWith({
          where: { userId: mockUserId },
          data: {
            learningPace: LearnerLearningPace.NORMAL,
            lastRecalculatedAt: expect.any(Date),
          },
        });
      });

      it('should update lastRecalculatedAt timestamp', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
        prisma.lesson.findUnique.mockResolvedValue({ estimatedMins: 30 });
        prisma.userProgress.findUnique.mockResolvedValue({ timeSpentSeconds: 1800 });
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'LESSON_COMPLETED',
          lessonId,
        });

        const updateCall = prisma.learnerProfile.update.mock.calls[0][0];
        expect(updateCall.data.lastRecalculatedAt).toBeInstanceOf(Date);
      });
    });

    // ── Test 6: QUIZ_PASSED updates skillLevel, strengths, weaknesses ────

    describe('QUIZ_PASSED', () => {
      const quizId = 'quiz-uuid-1';
      const lessonId = 'lesson-uuid-1';

      it('should set skillLevel to ADVANCED when avg score >= 90 and completed >= 10', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
        // 2 passed quizzes with avg score 95
        prisma.quizResult.findMany.mockResolvedValue([
          {
            score: 95,
            quiz: { lesson: { trackLessons: [{ track: { name: 'HTML Basics' } }] } },
          },
          {
            score: 95,
            quiz: { lesson: { trackLessons: [{ track: { name: 'CSS Basics' } }] } },
          },
        ]);
        prisma.userProgress.count.mockResolvedValue(12); // 12 completed lessons
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'QUIZ_PASSED',
          quizId,
          lessonId,
        });

        const updateCall = prisma.learnerProfile.update.mock.calls[0][0];
        expect(updateCall.data.skillLevel).toBe(LearnerSkillLevel.ADVANCED);
      });

      it('should set skillLevel to INTERMEDIATE when avg score >= 80 and completed >= 5', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
        prisma.quizResult.findMany.mockResolvedValue([
          {
            score: 85,
            quiz: { lesson: { trackLessons: [{ track: { name: 'HTML Basics' } }] } },
          },
        ]);
        prisma.userProgress.count.mockResolvedValue(7);
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'QUIZ_PASSED',
          quizId,
          lessonId,
        });

        const updateCall = prisma.learnerProfile.update.mock.calls[0][0];
        expect(updateCall.data.skillLevel).toBe(LearnerSkillLevel.INTERMEDIATE);
      });

      it('should set skillLevel to BEGINNER when thresholds not met', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
        prisma.quizResult.findMany.mockResolvedValue([
          {
            score: 75,
            quiz: { lesson: { trackLessons: [{ track: { name: 'HTML Basics' } }] } },
          },
        ]);
        prisma.userProgress.count.mockResolvedValue(3);
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'QUIZ_PASSED',
          quizId,
          lessonId,
        });

        const updateCall = prisma.learnerProfile.update.mock.calls[0][0];
        expect(updateCall.data.skillLevel).toBe(LearnerSkillLevel.BEGINNER);
      });

      it('should add track to strengths when avg score >= 85', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
        prisma.quizResult.findMany.mockResolvedValue([
          {
            score: 90,
            quiz: { lesson: { trackLessons: [{ track: { name: 'HTML Basics' } }] } },
          },
          {
            score: 88,
            quiz: { lesson: { trackLessons: [{ track: { name: 'HTML Basics' } }] } },
          },
        ]);
        prisma.userProgress.count.mockResolvedValue(3);
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'QUIZ_PASSED',
          quizId,
          lessonId,
        });

        const updateCall = prisma.learnerProfile.update.mock.calls[0][0];
        expect(updateCall.data.strengths).toContain('HTML Basics');
      });

      it('should add track to weaknesses when avg score < 70', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
        prisma.quizResult.findMany.mockResolvedValue([
          {
            score: 65,
            quiz: { lesson: { trackLessons: [{ track: { name: 'CSS Advanced' } }] } },
          },
        ]);
        prisma.userProgress.count.mockResolvedValue(2);
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'QUIZ_PASSED',
          quizId,
          lessonId,
        });

        const updateCall = prisma.learnerProfile.update.mock.calls[0][0];
        expect(updateCall.data.weaknesses).toContain('CSS Advanced');
      });

      it('should update lastRecalculatedAt for QUIZ_PASSED', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
        prisma.quizResult.findMany.mockResolvedValue([]);
        prisma.userProgress.count.mockResolvedValue(0);
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'QUIZ_PASSED',
          quizId,
          lessonId,
        });

        const updateCall = prisma.learnerProfile.update.mock.calls[0][0];
        expect(updateCall.data.lastRecalculatedAt).toBeInstanceOf(Date);
      });
    });

    // ── Test 7+8: TRACK_COMPLETED updates preferredTopics + AI chat ──────

    describe('TRACK_COMPLETED', () => {
      const learningPathId = 'lp-uuid-1';

      it('should merge track names into preferredTopics and update lastRecalculatedAt', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue({
          ...mockProfile,
          preferredTopics: ['react'],
        });
        prisma.track.findMany.mockResolvedValue([
          { name: 'HTML Basics' },
          { name: 'CSS Basics' },
        ]);
        prisma.aIInteractionLog.findMany.mockResolvedValue([]);
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'TRACK_COMPLETED',
          learningPathId,
        });

        const updateCall = prisma.learnerProfile.update.mock.calls[0][0];
        expect(updateCall.data.preferredTopics).toContain('react');
        expect(updateCall.data.preferredTopics).toContain('html basics');
        expect(updateCall.data.preferredTopics).toContain('css basics');
        expect(updateCall.data.lastRecalculatedAt).toBeInstanceOf(Date);
      });

      it('should preserve existing careerGoal (only updating preferredTopics)', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
        prisma.track.findMany.mockResolvedValue([{ name: 'HTML Basics' }]);
        prisma.aIInteractionLog.findMany.mockResolvedValue([]);
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'TRACK_COMPLETED',
          learningPathId,
        });

        const updateCall = prisma.learnerProfile.update.mock.calls[0][0];
        // careerGoal should NOT be in the update data — Prisma preserves it
        expect(updateCall.data).not.toHaveProperty('careerGoal');
      });

      it('should extract topic tokens from AI chat questionSummary and merge uniquely', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue({
          ...mockProfile,
          preferredTopics: ['react'],
        });
        prisma.track.findMany.mockResolvedValue([{ name: 'HTML Basics' }]);
        prisma.aIInteractionLog.findMany.mockResolvedValue([
          { questionSummary: 'javascript, react hooks', sessionContext: 'lesson' },
          { questionSummary: 'typescript generics', sessionContext: 'general' },
          { questionSummary: 'help', sessionContext: 'track' },
        ]);
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'TRACK_COMPLETED',
          learningPathId,
        });

        const updateCall = prisma.learnerProfile.update.mock.calls[0][0];
        const topics = updateCall.data.preferredTopics as string[];

        // Existing topic preserved
        expect(topics).toContain('react');
        // Track-derived topics
        expect(topics).toContain('html basics');
        // AI chat-derived topics
        expect(topics).toContain('javascript');
        expect(topics).toContain('react hooks');
        expect(topics).toContain('typescript generics');
        expect(topics).toContain('general');
        // Filler words filtered out (< 3 chars or in filler list)
        expect(topics).not.toContain('help');
        // No duplicates
        expect(topics.length).toBe(new Set(topics).size);
      });

      it('should drop filler words and short tokens from AI chat topics', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue({
          ...mockProfile,
          preferredTopics: [],
        });
        prisma.track.findMany.mockResolvedValue([]);
        prisma.aIInteractionLog.findMany.mockResolvedValue([
          { questionSummary: 'help, question, lesson, track, path', sessionContext: 'general' },
          { questionSummary: 'ab, cd', sessionContext: 'lesson' },
        ]);
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'TRACK_COMPLETED',
          learningPathId,
        });

        const updateCall = prisma.learnerProfile.update.mock.calls[0][0];
        const topics = updateCall.data.preferredTopics as string[];

        // All filler words should be filtered out
        expect(topics).not.toContain('help');
        expect(topics).not.toContain('question');
        expect(topics).not.toContain('lesson');
        expect(topics).not.toContain('track');
        expect(topics).not.toContain('path');
        // Short tokens (< 3 chars) should be filtered out
        expect(topics).not.toContain('ab');
        expect(topics).not.toContain('cd');
        // "general" from sessionContext is valid (>= 3 chars, not filler)
        expect(topics).toContain('general');
      });

      it('should read recent AI interaction logs (up to 20)', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(mockProfile);
        prisma.track.findMany.mockResolvedValue([]);
        prisma.aIInteractionLog.findMany.mockResolvedValue([]);
        prisma.learnerProfile.update.mockResolvedValue({});

        await service.recalculate(mockUserId, {
          type: 'TRACK_COMPLETED',
          learningPathId,
        });

        expect(prisma.aIInteractionLog.findMany).toHaveBeenCalledWith({
          where: { userId: mockUserId },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { questionSummary: true, sessionContext: true },
        });
      });
    });

    // ── Test 9: No profile → return quietly ─────────────────────────────

    describe('pre-onboarding edge case', () => {
      it('should return without throwing when no learner profile exists', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(null);

        // Should NOT throw
        await expect(
          service.recalculate(mockUserId, {
            type: 'LESSON_COMPLETED',
            lessonId: 'any-lesson-id',
          }),
        ).resolves.toBeUndefined();

        // Should NOT attempt to update the profile
        expect(prisma.learnerProfile.update).not.toHaveBeenCalled();
      });

      it('should not fabricate a new profile row', async () => {
        prisma.learnerProfile.findUnique.mockResolvedValue(null);

        await service.recalculate(mockUserId, {
          type: 'QUIZ_PASSED',
          quizId: 'any-quiz-id',
          lessonId: 'any-lesson-id',
        });

        // No upsert or create should be called
        expect(prisma.learnerProfile.update).not.toHaveBeenCalled();
      });
    });
  });
});
