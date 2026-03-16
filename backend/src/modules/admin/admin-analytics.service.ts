import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/index.js';

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeThisWeekGroups,
      newUsersThisMonth,
      usersByTier,
      totalLearningPaths,
      totalTracks,
      totalLessons,
      totalQuizzes,
      totalEnrollments,
      totalQuizResults,
      aiResponseTimeAgg,
      totalPayments,
      completedPayments,
      revenueAgg,
      completedLessons,
      avgQuizScoreAgg,
    ] = await Promise.all([
      // Users
      this.prisma.user.count(),
      this.prisma.learningSession.groupBy({
        by: ['userId'],
        where: { startedAt: { gte: weekAgo } },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.user.groupBy({ by: ['tier'], _count: true }),

      // Content
      this.prisma.learningPath.count(),
      this.prisma.track.count(),
      this.prisma.lesson.count(),
      this.prisma.quiz.count(),

      // Learning
      this.prisma.userLearningPath.count(),
      this.prisma.quizResult.count(),
      this.prisma.aIInteractionLog.aggregate({ _avg: { responseTimeMs: true } }),

      // Revenue
      this.prisma.paymentLog.count(),
      this.prisma.paymentLog.count({ where: { status: PaymentStatus.COMPLETED } }),
      this.prisma.paymentLog.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.COMPLETED },
      }),

      // Progress
      this.prisma.userProgress.count({ where: { completedAt: { not: null } } }),
      this.prisma.quizResult.aggregate({ _avg: { score: true } }),
    ]);

    const tierBreakdown = usersByTier.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.tier] = item._count;
        return acc;
      },
      {},
    );

    return {
      users: {
        total: totalUsers,
        activeThisWeek: activeThisWeekGroups.length,
        newThisMonth: newUsersThisMonth,
        byTier: tierBreakdown,
      },
      content: {
        learningPaths: totalLearningPaths,
        tracks: totalTracks,
        lessons: totalLessons,
        quizzes: totalQuizzes,
      },
      learning: {
        totalEnrollments,
        totalQuizResults,
        completedLessons,
        avgQuizScore: avgQuizScoreAgg._avg.score ?? 0,
        avgAiResponseTimeMs: aiResponseTimeAgg._avg.responseTimeMs ?? 0,
      },
      revenue: {
        totalPayments,
        completedPayments,
        totalRevenue: revenueAgg._sum.amount ?? 0,
      },
    };
  }
}
