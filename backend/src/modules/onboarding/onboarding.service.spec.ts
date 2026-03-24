import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CareerGoal, LearningBackground } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { AiService } from '../ai/index.js';
import { OnboardingService } from './onboarding.service.js';

const mockUserId = 'user-uuid-123';
const mockLearningPathId = 'path-uuid-456';

const mockSubmitAnswersDto = {
  careerGoal: CareerGoal.FRONTEND,
  priorKnowledge: ['html', 'css', 'javascript'],
  learningBackground: LearningBackground.SELF_TAUGHT,
  hoursPerWeek: 10,
};

const mockOnboardingRound = {
  id: 'round-uuid-111',
  userId: mockUserId,
  roundNumber: 1,
  answers: {
    careerGoal: CareerGoal.FRONTEND,
    priorKnowledge: ['html', 'css', 'javascript'],
    learningBackground: LearningBackground.SELF_TAUGHT,
    hoursPerWeek: 10,
  },
  completedAt: new Date('2026-03-14T10:00:00.000Z'),
  createdAt: new Date('2026-03-14T10:00:00.000Z'),
};

const mockLearningPath = {
  id: mockLearningPathId,
  name: 'Frontend Path',
  slug: 'frontend-path',
  description: 'Learn frontend',
  icon: 'layout',
  difficulty: 'beginner',
  estimatedHours: 120,
  isPublished: true,
  order: 1,
  createdAt: new Date('2026-03-14T10:00:00.000Z'),
  updatedAt: new Date('2026-03-14T10:00:00.000Z'),
};

const mockTrack = {
  id: 'track-uuid-789',
  learningPathId: mockLearningPathId,
  name: 'HTML & CSS',
  description: 'Frontend basics',
  order: 1,
  isOptional: false,
  createdAt: new Date('2026-03-14T10:00:00.000Z'),
  updatedAt: new Date('2026-03-14T10:00:00.000Z'),
};

const mockTrackLesson = {
  id: 'tl-uuid-101',
  trackId: 'track-uuid-789',
  lessonId: 'lesson-uuid-202',
  order: 1,
  createdAt: new Date('2026-03-14T10:00:00.000Z'),
};

const mockUserLearningPath = {
  id: 'ulp-uuid-303',
  userId: mockUserId,
  learningPathId: mockLearningPathId,
  currentLessonId: 'lesson-uuid-202',
  startedAt: new Date('2026-03-14T10:00:00.000Z'),
  completedAt: null,
};

const mockDto = { learningPathId: mockLearningPathId };

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: any;
  let aiService: any;
  let mockTx: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockTx = {
      userLearningPath: {
        create: jest.fn(),
      },
    };

    prisma = {
      onboardingRound: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      learningPath: {
        findFirst: jest.fn(),
      },
      userLearningPath: {
        findUnique: jest.fn(),
      },
      track: {
        findFirst: jest.fn(),
      },
      trackLesson: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(
        async (cb: (tx: any) => Promise<any>) => cb(mockTx),
      ),
    };

    // AiService mock: chi can mock method chat() duy nhat ma service dung
    aiService = {
      chat: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        // Fix: AiService phai co trong providers de NestJS DI inject duoc
        // Neu thieu -> NestJS throw "Nest can't resolve dependencies of OnboardingService"
        {
          provide: AiService,
          useValue: aiService,
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    prisma = module.get(PrismaService);
    aiService = module.get(AiService);
  });

  // ─── getRecommendation ───────────────────────────────────────────────────

  describe('getRecommendation', () => {
    it('should return AI recommendation when AI responds with valid JSON', async () => {
      // Happy path: AI responds with valid JSON → source: 'ai'
      // Round 1 answers are read from OnboardingRound.answers
      prisma.onboardingRound.findUnique.mockResolvedValue(mockOnboardingRound);
      aiService.chat.mockResolvedValue(JSON.stringify({
        primaryPath: 'frontend-developer',
        alternativePaths: [],
        reason: 'Based on your Frontend goal.',
        focusAreas: ['HTML & CSS fundamentals', 'JavaScript ES6+'],
        tips: ['Study consistently every day.'],
      }));

      const result = await service.getRecommendation(mockUserId);

      expect(prisma.onboardingRound.findUnique).toHaveBeenCalledWith({
        where: { userId_roundNumber: { userId: mockUserId, roundNumber: 1 } },
      });
      expect(aiService.chat).toHaveBeenCalledTimes(1);
      expect(result.source).toBe('ai');
      expect(result.primaryPath).toBe('frontend-developer');
    });

    it('should throw NotFoundException when user has no completed round 1', async () => {
      // Test 4: no onboarding round 1 still throws NotFoundException
      prisma.onboardingRound.findUnique.mockResolvedValue(null);

      const promise = service.getRecommendation(mockUserId);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ status: 404 });
      expect(aiService.chat).not.toHaveBeenCalled();
    });

    it('should return fallback recommendation when AI network error occurs', async () => {
      // Test fallback when AI timeout/network error
      prisma.onboardingRound.findUnique.mockResolvedValue(mockOnboardingRound);
      aiService.chat.mockRejectedValue(new Error('AI API timeout after 30000ms'));

      const result = await service.getRecommendation(mockUserId);

      expect(aiService.chat).toHaveBeenCalledTimes(1);
      expect(result.source).toBe('fallback');
      expect(result.primaryPath).toBe('frontend-developer');
    });

    it('should return fallback recommendation when AI returns invalid JSON', async () => {
      // Test fallback when AI returns bad format (parser returns null)
      prisma.onboardingRound.findUnique.mockResolvedValue(mockOnboardingRound);
      aiService.chat.mockResolvedValue('Sorry, I cannot provide a recommendation in JSON format.');

      const result = await service.getRecommendation(mockUserId);

      expect(aiService.chat).toHaveBeenCalledTimes(1);
      expect(result.source).toBe('fallback');
      expect(result.primaryPath).toBe('frontend-developer');
    });

    it('should reconstruct OnboardingDataInput from round-1 answers', async () => {
      // Test 3: getRecommendation reads round-1 answers and reconstructs OnboardingDataInput
      prisma.onboardingRound.findUnique.mockResolvedValue(mockOnboardingRound);
      aiService.chat.mockResolvedValue(JSON.stringify({
        primaryPath: 'frontend-developer',
        alternativePaths: [],
        reason: 'Test',
        focusAreas: ['Test'],
        tips: ['Test'],
      }));

      await service.getRecommendation(mockUserId);

      // Verify AI was called, which means the input was successfully constructed
      expect(aiService.chat).toHaveBeenCalledTimes(1);
      // Verify the round-1 lookup uses the compound key
      expect(prisma.onboardingRound.findUnique).toHaveBeenCalledWith({
        where: { userId_roundNumber: { userId: mockUserId, roundNumber: 1 } },
      });
    });
  });

  // ─── submitAnswers ───────────────────────────────────────────────────────
  describe('submitAnswers', () => {
    it('should create OnboardingRound with roundNumber: 1 and answers JSON', async () => {
      // Test 1: submitAnswers creates OnboardingRound with round 1 answers
      prisma.onboardingRound.findUnique.mockResolvedValue(null);
      prisma.onboardingRound.create.mockResolvedValue(mockOnboardingRound);

      const result = await service.submitAnswers(mockUserId, mockSubmitAnswersDto);

      expect(prisma.onboardingRound.findUnique).toHaveBeenCalledWith({
        where: { userId_roundNumber: { userId: mockUserId, roundNumber: 1 } },
      });
      expect(prisma.onboardingRound.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          roundNumber: 1,
          answers: {
            careerGoal: mockSubmitAnswersDto.careerGoal,
            priorKnowledge: mockSubmitAnswersDto.priorKnowledge,
            learningBackground: mockSubmitAnswersDto.learningBackground,
            hoursPerWeek: mockSubmitAnswersDto.hoursPerWeek,
          },
          completedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockOnboardingRound);
    });

    it('should throw ConflictException when round 1 already exists', async () => {
      // Test 2: duplicate round-1 submission throws ConflictException
      prisma.onboardingRound.findUnique.mockResolvedValue(mockOnboardingRound);

      const promise = service.submitAnswers(mockUserId, mockSubmitAnswersDto);

      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toMatchObject({ status: 409 });
      expect(prisma.onboardingRound.create).not.toHaveBeenCalled();
    });

    it('should store answers with exact keys: careerGoal, priorKnowledge, learningBackground, hoursPerWeek', async () => {
      // Verify round-1 JSON payload keys exactly match
      prisma.onboardingRound.findUnique.mockResolvedValue(null);
      prisma.onboardingRound.create.mockResolvedValue(mockOnboardingRound);

      await service.submitAnswers(mockUserId, mockSubmitAnswersDto);

      const createCall = prisma.onboardingRound.create.mock.calls[0][0];
      const answers = createCall.data.answers;
      expect(Object.keys(answers).sort()).toEqual(
        ['careerGoal', 'hoursPerWeek', 'learningBackground', 'priorKnowledge'],
      );
    });
  });

  // ─── confirmPath ─────────────────────────────────────────────────────────

  describe('confirmPath', () => {
    it('should create user learning path with currentLessonId set to the first lesson', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(mockLearningPath);
      prisma.userLearningPath.findUnique.mockResolvedValue(null);
      prisma.track.findFirst.mockResolvedValue(mockTrack);
      prisma.trackLesson.findFirst.mockResolvedValue(mockTrackLesson);
      mockTx.userLearningPath.create.mockResolvedValue(mockUserLearningPath);

      const result = await service.confirmPath(mockUserId, mockDto);

      expect(prisma.learningPath.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockLearningPathId,
          isPublished: true,
        },
      });
      expect(prisma.userLearningPath.findUnique).toHaveBeenCalledWith({
        where: {
          userId_learningPathId: {
            userId: mockUserId,
            learningPathId: mockLearningPathId,
          },
        },
      });
      expect(prisma.track.findFirst).toHaveBeenCalledWith({
        where: { learningPathId: mockLearningPathId },
        orderBy: { order: 'asc' },
      });
      expect(prisma.trackLesson.findFirst).toHaveBeenCalledWith({
        where: { trackId: mockTrack.id },
        orderBy: { order: 'asc' },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.userLearningPath.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          learningPathId: mockLearningPathId,
          currentLessonId: mockTrackLesson.lessonId,
        },
      });
      expect(result).toEqual(mockUserLearningPath);
    });

    it('should throw NotFoundException when learning path is missing or not published', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(null);

      const promise = service.confirmPath(mockUserId, mockDto);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ status: 404 });
      expect(prisma.userLearningPath.findUnique).not.toHaveBeenCalled();
      expect(prisma.track.findFirst).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when user is already enrolled in the learning path', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(mockLearningPath);
      prisma.userLearningPath.findUnique.mockResolvedValue(mockUserLearningPath);

      const promise = service.confirmPath(mockUserId, mockDto);

      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toMatchObject({ status: 409 });
      expect(prisma.track.findFirst).not.toHaveBeenCalled();
      expect(prisma.trackLesson.findFirst).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException when learning path has no tracks', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(mockLearningPath);
      prisma.userLearningPath.findUnique.mockResolvedValue(null);
      prisma.track.findFirst.mockResolvedValue(null);

      const promise = service.confirmPath(mockUserId, mockDto);

      await expect(promise).rejects.toThrow(UnprocessableEntityException);
      await expect(promise).rejects.toMatchObject({ status: 422 });
      expect(prisma.trackLesson.findFirst).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException when first track has no lessons', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(mockLearningPath);
      prisma.userLearningPath.findUnique.mockResolvedValue(null);
      prisma.track.findFirst.mockResolvedValue(mockTrack);
      prisma.trackLesson.findFirst.mockResolvedValue(null);

      const promise = service.confirmPath(mockUserId, mockDto);

      await expect(promise).rejects.toThrow(UnprocessableEntityException);
      await expect(promise).rejects.toMatchObject({ status: 422 });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
