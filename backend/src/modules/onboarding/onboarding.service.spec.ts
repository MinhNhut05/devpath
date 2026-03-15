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

const mockOnboardingData = {
  id: 'onboarding-uuid-111',
  userId: mockUserId,
  careerGoal: CareerGoal.FRONTEND,
  priorKnowledge: ['html', 'css', 'javascript'],
  learningBackground: LearningBackground.SELF_TAUGHT,
  hoursPerWeek: 10,
  completedAt: new Date('2026-03-14T10:00:00.000Z'),
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
      onboardingData: {
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
      // Happy path: AI trả về JSON hợp lệ → source: 'ai'
      // Test này đảm bảo service thực sự gọi AI và dùng kết quả khi thành công
      prisma.onboardingData.findUnique.mockResolvedValue(mockOnboardingData);
      aiService.chat.mockResolvedValue(JSON.stringify({
        primaryPath: 'frontend-developer',
        alternativePaths: [],
        reason: 'Dựa trên mục tiêu Frontend của bạn.',
        focusAreas: ['HTML & CSS fundamentals', 'JavaScript ES6+'],
        tips: ['Học đều đặn mỗi ngày.'],
      }));

      const result = await service.getRecommendation(mockUserId);

      expect(prisma.onboardingData.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(aiService.chat).toHaveBeenCalledTimes(1);
      // AI path: source phải là 'ai'
      expect(result.source).toBe('ai');
      expect(result.primaryPath).toBe('frontend-developer');
    });

    it('should throw NotFoundException when user has not submitted onboarding', async () => {
      // Test 404 để đảm bảo user phải submit trước khi lấy recommendation
      prisma.onboardingData.findUnique.mockResolvedValue(null);

      const promise = service.getRecommendation(mockUserId);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ status: 404 });
      // AI không được gọi nếu user chưa submit
      expect(aiService.chat).not.toHaveBeenCalled();
    });

    it('should return fallback recommendation when AI network error occurs', async () => {
      // Test fallback khi AI timeout/network error
      // Đảm bảo user không bị kẹt dù AI có vấn đề
      prisma.onboardingData.findUnique.mockResolvedValue(mockOnboardingData);
      aiService.chat.mockRejectedValue(new Error('AI API timeout after 30000ms'));

      const result = await service.getRecommendation(mockUserId);

      expect(aiService.chat).toHaveBeenCalledTimes(1);
      // Fallback path: source phải là 'fallback'
      expect(result.source).toBe('fallback');
      // Fallback dùng CAREER_GOAL_TO_SLUG[FRONTEND] = 'frontend-developer'
      expect(result.primaryPath).toBe('frontend-developer');
    });

    it('should return fallback recommendation when AI returns invalid JSON', async () => {
      // Test fallback khi AI trả về format sai (parser return null)
      // Đây là trường hợp AI respond nhưng không đúng format JSON mong đợi
      prisma.onboardingData.findUnique.mockResolvedValue(mockOnboardingData);
      aiService.chat.mockResolvedValue('Sorry, I cannot provide a recommendation in JSON format.');

      const result = await service.getRecommendation(mockUserId);

      expect(aiService.chat).toHaveBeenCalledTimes(1);
      // Parser trả về null → fallback được dùng
      expect(result.source).toBe('fallback');
      expect(result.primaryPath).toBe('frontend-developer');
    });
  });

  // ─── submitAnswers ───────────────────────────────────────────────────────
  describe('submitAnswers', () => {
    it('should create and return onboarding data when user submits answers for the first time', async () => {
      // Test happy path để đảm bảo service lưu onboarding answers đúng vào DB.
      prisma.onboardingData.findUnique.mockResolvedValue(null);
      prisma.onboardingData.create.mockResolvedValue(mockOnboardingData);

      const result = await service.submitAnswers(mockUserId, mockSubmitAnswersDto);

      expect(prisma.onboardingData.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(prisma.onboardingData.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          careerGoal: mockSubmitAnswersDto.careerGoal,
          priorKnowledge: mockSubmitAnswersDto.priorKnowledge,
          learningBackground: mockSubmitAnswersDto.learningBackground,
          hoursPerWeek: mockSubmitAnswersDto.hoursPerWeek,
        },
      });
      expect(result).toEqual(mockOnboardingData);
    });

    it('should throw ConflictException when onboarding data already exists', async () => {
      // Test duplicate để tránh user submit onboarding nhiều lần.
      prisma.onboardingData.findUnique.mockResolvedValue(mockOnboardingData);

      const promise = service.submitAnswers(mockUserId, mockSubmitAnswersDto);

      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toMatchObject({ status: 409 });
      expect(prisma.onboardingData.create).not.toHaveBeenCalled();
    });
  });

  // ─── confirmPath ─────────────────────────────────────────────────────────

  describe('confirmPath', () => {
    it('should create user learning path with currentLessonId set to the first lesson', async () => {
      // Test happy path để đảm bảo enroll path đúng và set bài học đầu tiên chính xác.
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
      // Test 404 để không expose path không tồn tại hoặc chưa publish.
      prisma.learningPath.findFirst.mockResolvedValue(null);

      const promise = service.confirmPath(mockUserId, mockDto);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ status: 404 });
      expect(prisma.userLearningPath.findUnique).not.toHaveBeenCalled();
      expect(prisma.track.findFirst).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when user is already enrolled in the learning path', async () => {
      // Test duplicate enrollment để tránh tạo 2 record cùng userId + learningPathId.
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
      // Test 422 vì path hợp lệ nhưng data bên trong chưa đủ để xử lý enrollment.
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
      // Test 422 để đảm bảo system không enroll user vào path bị thiếu lesson đầu tiên.
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
