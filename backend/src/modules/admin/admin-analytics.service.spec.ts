// admin-analytics.service.spec.ts
// Tests: getAnalytics (returns correct shape with all metrics)

import { Test, TestingModule } from '@nestjs/testing';
import { PaymentStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { AdminAnalyticsService } from './admin-analytics.service.js';

describe('AdminAnalyticsService', () => {
  let service: AdminAnalyticsService;
  let prisma: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      user: {
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      learningSession: {
        groupBy: jest.fn(),
      },
      learningPath: { count: jest.fn() },
      track: { count: jest.fn() },
      lesson: { count: jest.fn() },
      quiz: { count: jest.fn() },
      userLearningPath: { count: jest.fn() },
      quizResult: {
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      aIInteractionLog: {
        aggregate: jest.fn(),
      },
      paymentLog: {
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      userProgress: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAnalyticsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AdminAnalyticsService>(AdminAnalyticsService);
    prisma = module.get(PrismaService);
  });

  describe('getAnalytics()', () => {
    it('should return analytics with correct shape', async () => {
      // Users
      prisma.user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(15); // newUsersThisMonth
      prisma.learningSession.groupBy.mockResolvedValue([
        { userId: 'u1' },
        { userId: 'u2' },
        { userId: 'u3' },
      ]); // 3 active this week
      prisma.user.groupBy.mockResolvedValue([
        { tier: 'FREE', _count: 80 },
        { tier: 'PRO', _count: 15 },
        { tier: 'ULTRA', _count: 5 },
      ]);

      // Content
      prisma.learningPath.count.mockResolvedValue(4);
      prisma.track.count.mockResolvedValue(12);
      prisma.lesson.count.mockResolvedValue(50);
      prisma.quiz.count.mockResolvedValue(30);

      // Learning
      prisma.userLearningPath.count.mockResolvedValue(200);
      prisma.quizResult.count.mockResolvedValue(500);
      prisma.aIInteractionLog.aggregate.mockResolvedValue({
        _avg: { responseTimeMs: 1500 },
      });

      // Revenue
      prisma.paymentLog.count
        .mockResolvedValueOnce(50) // totalPayments
        .mockResolvedValueOnce(40); // completedPayments
      prisma.paymentLog.aggregate.mockResolvedValue({
        _sum: { amount: 5000000 },
      });

      // Progress
      prisma.userProgress.count.mockResolvedValue(300);
      prisma.quizResult.aggregate.mockResolvedValue({
        _avg: { score: 75.5 },
      });

      const result = await service.getAnalytics();

      // Users shape
      expect(result.users).toEqual({
        total: 100,
        activeThisWeek: 3,
        newThisMonth: 15,
        byTier: { FREE: 80, PRO: 15, ULTRA: 5 },
      });

      // Content shape
      expect(result.content).toEqual({
        learningPaths: 4,
        tracks: 12,
        lessons: 50,
        quizzes: 30,
      });

      // Learning shape
      expect(result.learning).toEqual({
        totalEnrollments: 200,
        totalQuizResults: 500,
        completedLessons: 300,
        avgQuizScore: 75.5,
        avgAiResponseTimeMs: 1500,
      });

      // Revenue shape
      expect(result.revenue).toEqual({
        totalPayments: 50,
        completedPayments: 40,
        totalRevenue: 5000000,
      });
    });

    it('should handle zero/null values gracefully', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.learningSession.groupBy.mockResolvedValue([]);
      prisma.user.groupBy.mockResolvedValue([]);
      prisma.learningPath.count.mockResolvedValue(0);
      prisma.track.count.mockResolvedValue(0);
      prisma.lesson.count.mockResolvedValue(0);
      prisma.quiz.count.mockResolvedValue(0);
      prisma.userLearningPath.count.mockResolvedValue(0);
      prisma.quizResult.count.mockResolvedValue(0);
      prisma.aIInteractionLog.aggregate.mockResolvedValue({
        _avg: { responseTimeMs: null },
      });
      prisma.paymentLog.count.mockResolvedValue(0);
      prisma.paymentLog.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });
      prisma.userProgress.count.mockResolvedValue(0);
      prisma.quizResult.aggregate.mockResolvedValue({
        _avg: { score: null },
      });

      const result = await service.getAnalytics();

      expect(result.users.total).toBe(0);
      expect(result.users.activeThisWeek).toBe(0);
      expect(result.users.byTier).toEqual({});
      expect(result.learning.avgQuizScore).toBe(0);
      expect(result.learning.avgAiResponseTimeMs).toBe(0);
      expect(result.revenue.totalRevenue).toBe(0);
    });
  });
});
