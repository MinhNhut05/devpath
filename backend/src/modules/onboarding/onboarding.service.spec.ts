import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CareerGoal, LearningBackground } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { AiService } from '../ai/index.js';
import { LearnerProfileService } from '../learner-profile/learner-profile.service.js';
import { OnboardingService } from './onboarding.service.js';

const mockUserId = 'user-uuid-123';
const mockLearningPathId = 'path-uuid-456';

const mockSubmitAnswersDto = {
  careerGoal: CareerGoal.FRONTEND,
  priorKnowledge: ['html', 'css', 'javascript'],
  learningBackground: LearningBackground.SELF_TAUGHT,
  hoursPerWeek: 10,
};

const mockRoundTwoDto = {
  targetRole: 'intern_junior',
  workEnvironment: 'startup',
  timeline: '3_months',
  learningStyle: 'hands_on',
};

const mockRoundThreeDto = {
  skillRatings: {
    html_css: 4,
    javascript: 5,
    react: 3,
    git_basics: 4,
    responsive_design: 2,
  },
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

const mockRoundTwo = {
  id: 'round-uuid-222',
  userId: mockUserId,
  roundNumber: 2,
  answers: mockRoundTwoDto,
  completedAt: new Date('2026-03-14T10:05:00.000Z'),
  createdAt: new Date('2026-03-14T10:05:00.000Z'),
};

const mockRoundThree = {
  id: 'round-uuid-333',
  userId: mockUserId,
  roundNumber: 3,
  answers: { skillRatings: mockRoundThreeDto.skillRatings },
  completedAt: new Date('2026-03-14T10:10:00.000Z'),
  createdAt: new Date('2026-03-14T10:10:00.000Z'),
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
  let learnerProfileService: any;
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
        findMany: jest.fn(),
        create: jest.fn(),
      },
      learningPath: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      learnerProfile: {
        updateMany: jest.fn(),
      },
      userLearningPath: {
        findUnique: jest.fn(),
        count: jest.fn(),
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

    aiService = {
      chat: jest.fn(),
    };

    learnerProfileService = {
      createFromRoundOne: jest.fn(),
      updateFromRoundTwo: jest.fn(),
      updateFromRoundThree: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: AiService,
          useValue: aiService,
        },
        {
          provide: LearnerProfileService,
          useValue: learnerProfileService,
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    prisma = module.get(PrismaService);
    aiService = module.get(AiService);
    learnerProfileService = module.get(LearnerProfileService);
  });

  describe('getStatus', () => {
    it('returns empty onboarding state when user has no rounds and no confirmed path', async () => {
      prisma.onboardingRound.findMany.mockResolvedValue([]);
      prisma.userLearningPath.count.mockResolvedValue(0);

      const result = await service.getStatus(mockUserId);

      expect(result).toEqual({
        completedRounds: [],
        nextRound: 1,
        resumeAvailable: false,
        canRequestRecommendation: false,
        careerGoal: null,
        hasConfirmedPath: false,
      });
    });

    it('returns nextRound 2 and resumeAvailable true when only round 1 exists', async () => {
      prisma.onboardingRound.findMany.mockResolvedValue([
        { roundNumber: 1, answers: mockOnboardingRound.answers },
      ]);
      prisma.userLearningPath.count.mockResolvedValue(0);

      const result = await service.getStatus(mockUserId);

      expect(result.completedRounds).toEqual([1]);
      expect(result.nextRound).toBe(2);
      expect(result.resumeAvailable).toBe(true);
      expect(result.canRequestRecommendation).toBe(false);
    });

    it('returns nextRound 3 when rounds 1 and 2 exist', async () => {
      prisma.onboardingRound.findMany.mockResolvedValue([
        { roundNumber: 1, answers: mockOnboardingRound.answers },
        { roundNumber: 2, answers: mockRoundTwo.answers },
      ]);
      prisma.userLearningPath.count.mockResolvedValue(0);

      const result = await service.getStatus(mockUserId);

      expect(result.completedRounds).toEqual([1, 2]);
      expect(result.nextRound).toBe(3);
      expect(result.resumeAvailable).toBe(true);
    });

    it('returns nextRound null and canRequestRecommendation true when all rounds exist', async () => {
      prisma.onboardingRound.findMany.mockResolvedValue([
        { roundNumber: 1, answers: mockOnboardingRound.answers },
        { roundNumber: 2, answers: mockRoundTwo.answers },
        { roundNumber: 3, answers: mockRoundThree.answers },
      ]);
      prisma.userLearningPath.count.mockResolvedValue(0);

      const result = await service.getStatus(mockUserId);

      expect(result.completedRounds).toEqual([1, 2, 3]);
      expect(result.nextRound).toBeNull();
      expect(result.canRequestRecommendation).toBe(true);
    });

    it('returns careerGoal from round 1 answers when present', async () => {
      prisma.onboardingRound.findMany.mockResolvedValue([
        { roundNumber: 1, answers: mockOnboardingRound.answers },
      ]);
      prisma.userLearningPath.count.mockResolvedValue(0);

      const result = await service.getStatus(mockUserId);

      expect(result.careerGoal).toBe(CareerGoal.FRONTEND);
    });

    it('returns hasConfirmedPath true when userLearningPath count is greater than zero', async () => {
      prisma.onboardingRound.findMany.mockResolvedValue([]);
      prisma.userLearningPath.count.mockResolvedValue(2);

      const result = await service.getStatus(mockUserId);

      expect(result.hasConfirmedPath).toBe(true);
    });
  });

  describe('getRecommendation', () => {
    it('returns AI recommendation rankings with learningPathIds when AI responds with valid JSON', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockOnboardingRound)
        .mockResolvedValueOnce(mockRoundThree);
      prisma.learningPath.findMany.mockResolvedValue([
        { id: mockLearningPathId, slug: 'frontend-developer' },
        { id: 'fullstack-path-id', slug: 'fullstack-developer' },
      ]);
      aiService.chat.mockResolvedValue(
        JSON.stringify({
          rankings: [
            {
              pathSlug: 'frontend-developer',
              matchScore: 95,
              explanation: 'Based on your Frontend goal.',
              focusAreas: ['HTML & CSS fundamentals', 'JavaScript ES6+'],
            },
            {
              pathSlug: 'fullstack-developer',
              matchScore: 72,
              explanation: 'Alternative path for broader coverage.',
              focusAreas: ['React', 'API integration'],
            },
          ],
          tips: ['Study consistently every day.'],
        }),
      );

      const result = await service.getRecommendation(mockUserId);

      expect(aiService.chat).toHaveBeenCalledTimes(1);
      expect(result.source).toBe('ai');
      expect(result.rankings).toEqual([
        {
          learningPathId: mockLearningPathId,
          pathSlug: 'frontend-developer',
          matchScore: 95,
          explanation: 'Based on your Frontend goal.',
          focusAreas: ['HTML & CSS fundamentals', 'JavaScript ES6+'],
        },
        {
          learningPathId: 'fullstack-path-id',
          pathSlug: 'fullstack-developer',
          matchScore: 72,
          explanation: 'Alternative path for broader coverage.',
          focusAreas: ['React', 'API integration'],
        },
      ]);
    });

    it('throws NotFoundException when user has no completed round 1', async () => {
      prisma.onboardingRound.findUnique.mockResolvedValue(null);

      await expect(service.getRecommendation(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(aiService.chat).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when round 3 is missing', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockOnboardingRound)
        .mockResolvedValueOnce(null);

      await expect(service.getRecommendation(mockUserId)).rejects.toThrow(
        BadRequestException,
      );
      expect(aiService.chat).not.toHaveBeenCalled();
    });

    it('returns fallback recommendation when AI network error occurs', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockOnboardingRound)
        .mockResolvedValueOnce(mockRoundThree);
      prisma.learningPath.findMany.mockResolvedValue([
        { id: 'frontend-developer-id', slug: 'frontend-developer' },
        { id: 'fullstack-developer-id', slug: 'fullstack-developer' },
        { id: 'backend-developer-id', slug: 'backend-developer' },
      ]);
      aiService.chat.mockRejectedValue(new Error('AI API timeout after 30000ms'));

      const result = await service.getRecommendation(mockUserId);

      expect(result.source).toBe('fallback');
      expect(result.rankings).toHaveLength(3);
      expect(result.rankings[0]?.learningPathId).toBe('frontend-developer-id');
    });

    it('returns fallback recommendation when AI returns invalid JSON', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockOnboardingRound)
        .mockResolvedValueOnce(mockRoundThree);
      prisma.learningPath.findMany.mockResolvedValue([
        { id: 'frontend-developer-id', slug: 'frontend-developer' },
        { id: 'fullstack-developer-id', slug: 'fullstack-developer' },
        { id: 'backend-developer-id', slug: 'backend-developer' },
      ]);
      aiService.chat.mockResolvedValue('Sorry, I cannot provide a recommendation in JSON format.');

      const result = await service.getRecommendation(mockUserId);

      expect(result.source).toBe('fallback');
      expect(result.rankings[0]?.learningPathId).toBe('frontend-developer-id');
    });

    it('reconstructs OnboardingDataInput from round 1 answers before calling AI', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockOnboardingRound)
        .mockResolvedValueOnce(mockRoundThree);
      prisma.learningPath.findMany.mockResolvedValue([
        { id: mockLearningPathId, slug: 'frontend-developer' },
      ]);
      aiService.chat.mockResolvedValue(
        JSON.stringify({
          rankings: [
            {
              pathSlug: 'frontend-developer',
              matchScore: 95,
              explanation: 'Test',
              focusAreas: ['Test'],
            },
          ],
          tips: ['Test'],
        }),
      );

      await service.getRecommendation(mockUserId);

      expect(prisma.onboardingRound.findUnique).toHaveBeenNthCalledWith(1, {
        where: { userId_roundNumber: { userId: mockUserId, roundNumber: 1 } },
      });
      expect(aiService.chat).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when no ranked slugs resolve to learning paths', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockOnboardingRound)
        .mockResolvedValueOnce(mockRoundThree);
      prisma.learningPath.findMany.mockResolvedValue([]);
      aiService.chat.mockResolvedValue(
        JSON.stringify({
          rankings: [
            {
              pathSlug: 'frontend-developer',
              matchScore: 95,
              explanation: 'Test',
              focusAreas: ['Test'],
            },
          ],
          tips: ['Test'],
        }),
      );

      await expect(service.getRecommendation(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('filters unresolved ranked slugs while preserving valid recommendations', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockOnboardingRound)
        .mockResolvedValueOnce(mockRoundThree);
      prisma.learningPath.findMany.mockResolvedValue([
        { id: mockLearningPathId, slug: 'frontend-developer' },
      ]);
      aiService.chat.mockResolvedValue(
        JSON.stringify({
          rankings: [
            {
              pathSlug: 'frontend-developer',
              matchScore: 95,
              explanation: 'Primary fit',
              focusAreas: ['HTML & CSS fundamentals'],
            },
            {
              pathSlug: 'fullstack-developer',
              matchScore: 80,
              explanation: 'Secondary fit',
              focusAreas: ['React'],
            },
          ],
          tips: ['Test'],
        }),
      );

      const result = await service.getRecommendation(mockUserId);

      expect(result.rankings).toEqual([
        {
          learningPathId: mockLearningPathId,
          pathSlug: 'frontend-developer',
          matchScore: 95,
          explanation: 'Primary fit',
          focusAreas: ['HTML & CSS fundamentals'],
        },
      ]);
    });

    it('resolves all ranked learning path ids with a slug lookup query', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockOnboardingRound)
        .mockResolvedValueOnce(mockRoundThree);
      prisma.learningPath.findMany.mockResolvedValue([
        { id: mockLearningPathId, slug: 'frontend-developer' },
      ]);
      aiService.chat.mockResolvedValue(
        JSON.stringify({
          rankings: [
            {
              pathSlug: 'frontend-developer',
              matchScore: 95,
              explanation: 'Test',
              focusAreas: ['Test'],
            },
          ],
          tips: ['Test'],
        }),
      );

      await service.getRecommendation(mockUserId);

      expect(prisma.learningPath.findMany).toHaveBeenCalledWith({
        where: { slug: { in: ['frontend-developer'] } },
        select: { id: true, slug: true },
      });
    });

    it('falls back when AI rankings parse but contain no valid items', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockOnboardingRound)
        .mockResolvedValueOnce(mockRoundThree);
      prisma.learningPath.findMany.mockResolvedValue([
        { id: 'frontend-developer-id', slug: 'frontend-developer' },
        { id: 'fullstack-developer-id', slug: 'fullstack-developer' },
        { id: 'backend-developer-id', slug: 'backend-developer' },
      ]);
      aiService.chat.mockResolvedValue(
        JSON.stringify({
          rankings: [
            {
              pathSlug: 'unknown-path',
              matchScore: 95,
              explanation: 'Invalid slug',
              focusAreas: ['Test'],
            },
          ],
          tips: ['Test'],
        }),
      );

      const result = await service.getRecommendation(mockUserId);

      expect(result.source).toBe('fallback');
      expect(result.rankings).toHaveLength(3);
    });
  });

  describe('submitAnswers', () => {
    it('creates round 1 and calls learnerProfileService.createFromRoundOne', async () => {
      prisma.onboardingRound.findUnique.mockResolvedValue(null);
      prisma.onboardingRound.create.mockResolvedValue(mockOnboardingRound);
      learnerProfileService.createFromRoundOne.mockResolvedValue({ id: 'profile-1' });

      const result = await service.submitAnswers(mockUserId, mockSubmitAnswersDto);

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
      expect(learnerProfileService.createFromRoundOne).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockOnboardingRound);
    });

    it('throws ConflictException when round 1 already exists', async () => {
      prisma.onboardingRound.findUnique.mockResolvedValue(mockOnboardingRound);

      await expect(
        service.submitAnswers(mockUserId, mockSubmitAnswersDto),
      ).rejects.toThrow(ConflictException);
      expect(prisma.onboardingRound.create).not.toHaveBeenCalled();
    });

    it('stores answers with exact keys for round 1 payload', async () => {
      prisma.onboardingRound.findUnique.mockResolvedValue(null);
      prisma.onboardingRound.create.mockResolvedValue(mockOnboardingRound);
      learnerProfileService.createFromRoundOne.mockResolvedValue({ id: 'profile-1' });

      await service.submitAnswers(mockUserId, mockSubmitAnswersDto);

      const answers = prisma.onboardingRound.create.mock.calls[0][0].data.answers;
      expect(Object.keys(answers).sort()).toEqual([
        'careerGoal',
        'hoursPerWeek',
        'learningBackground',
        'priorKnowledge',
      ]);
    });
  });

  describe('submitRoundTwo', () => {
    it('creates round 2 onboarding record with expected answers shape', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockOnboardingRound)
        .mockResolvedValueOnce(null);
      prisma.onboardingRound.create.mockResolvedValue(mockRoundTwo);
      learnerProfileService.updateFromRoundTwo.mockResolvedValue(undefined);

      const result = await service.submitRoundTwo(mockUserId, mockRoundTwoDto);

      expect(prisma.onboardingRound.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          roundNumber: 2,
          answers: {
            targetRole: mockRoundTwoDto.targetRole,
            workEnvironment: mockRoundTwoDto.workEnvironment,
            timeline: mockRoundTwoDto.timeline,
            learningStyle: mockRoundTwoDto.learningStyle,
          },
          completedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockRoundTwo);
    });

    it('throws BadRequestException when round 1 does not exist', async () => {
      prisma.onboardingRound.findUnique.mockResolvedValue(null);

      await expect(service.submitRoundTwo(mockUserId, mockRoundTwoDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException when round 2 already exists', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockOnboardingRound)
        .mockResolvedValueOnce(mockRoundTwo);

      await expect(service.submitRoundTwo(mockUserId, mockRoundTwoDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('calls learnerProfileService.updateFromRoundTwo after successful create', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockOnboardingRound)
        .mockResolvedValueOnce(null);
      prisma.onboardingRound.create.mockResolvedValue(mockRoundTwo);
      learnerProfileService.updateFromRoundTwo.mockResolvedValue(undefined);

      await service.submitRoundTwo(mockUserId, mockRoundTwoDto);

      expect(learnerProfileService.updateFromRoundTwo).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('submitRoundThree', () => {
    it('creates round 3 onboarding record with skillRatings payload', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockRoundTwo)
        .mockResolvedValueOnce(null);
      prisma.onboardingRound.create.mockResolvedValue(mockRoundThree);
      learnerProfileService.updateFromRoundThree.mockResolvedValue(undefined);

      const result = await service.submitRoundThree(mockUserId, mockRoundThreeDto);

      expect(prisma.onboardingRound.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          roundNumber: 3,
          answers: {
            skillRatings: mockRoundThreeDto.skillRatings,
          },
          completedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockRoundThree);
    });

    it('throws BadRequestException when round 2 does not exist', async () => {
      prisma.onboardingRound.findUnique.mockResolvedValue(null);

      await expect(
        service.submitRoundThree(mockUserId, mockRoundThreeDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when round 3 already exists', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockRoundTwo)
        .mockResolvedValueOnce(mockRoundThree);

      await expect(
        service.submitRoundThree(mockUserId, mockRoundThreeDto),
      ).rejects.toThrow(ConflictException);
    });

    it('calls learnerProfileService.updateFromRoundThree after successful create', async () => {
      prisma.onboardingRound.findUnique
        .mockResolvedValueOnce(mockRoundTwo)
        .mockResolvedValueOnce(null);
      prisma.onboardingRound.create.mockResolvedValue(mockRoundThree);
      learnerProfileService.updateFromRoundThree.mockResolvedValue(undefined);

      await service.submitRoundThree(mockUserId, mockRoundThreeDto);

      expect(learnerProfileService.updateFromRoundThree).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('confirmPath', () => {
    it('creates user learning path with currentLessonId set to the first lesson', async () => {
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
      expect(prisma.learnerProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, mainLearningPathId: null },
        data: { mainLearningPathId: mockLearningPathId },
      });
      expect(result).toEqual(mockUserLearningPath);
    });

    it('throws NotFoundException when learning path is missing or not published', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(null);

      await expect(service.confirmPath(mockUserId, mockDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.userLearningPath.findUnique).not.toHaveBeenCalled();
      expect(prisma.track.findFirst).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws ConflictException when user is already enrolled in the learning path', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(mockLearningPath);
      prisma.userLearningPath.findUnique.mockResolvedValue(mockUserLearningPath);

      await expect(service.confirmPath(mockUserId, mockDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.track.findFirst).not.toHaveBeenCalled();
      expect(prisma.trackLesson.findFirst).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws UnprocessableEntityException when learning path has no tracks', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(mockLearningPath);
      prisma.userLearningPath.findUnique.mockResolvedValue(null);
      prisma.track.findFirst.mockResolvedValue(null);

      await expect(service.confirmPath(mockUserId, mockDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(prisma.trackLesson.findFirst).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws UnprocessableEntityException when first track has no lessons', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(mockLearningPath);
      prisma.userLearningPath.findUnique.mockResolvedValue(null);
      prisma.track.findFirst.mockResolvedValue(mockTrack);
      prisma.trackLesson.findFirst.mockResolvedValue(null);

      await expect(service.confirmPath(mockUserId, mockDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
