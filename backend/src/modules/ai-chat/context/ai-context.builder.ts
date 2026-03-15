// ai-context.builder.ts - Build AI context từ database cho mỗi chat session
//
// Mục đích:
// - Query lesson, track, learning path, progress, quiz scores của user
// - Tổng hợp thành AIContext object
// - Render systemPrompt theo template từ 03-ai-integration.md

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/index.js';

// ============================================
// TYPES
// ============================================

interface AIContext {
  user: {
    learningPath: string;
    currentTrack: string;
    currentLesson: string;
    completedLessons: string[];
    recentQuizScores: { lesson: string; score: number }[];
  };
  lesson: {
    title: string;
    summary: string;
    keyTopics: string[];
  };
  previousLessons: { title: string; summary: string }[];
}

// Fallback context khi không có data
const EMPTY_CONTEXT: AIContext = {
  user: {
    learningPath: '',
    currentTrack: '',
    currentLesson: '',
    completedLessons: [],
    recentQuizScores: [],
  },
  lesson: { title: '', summary: '', keyTopics: [] },
  previousLessons: [],
};

// ============================================
// SERVICE
// ============================================

@Injectable()
export class AiContextBuilder {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build context cho AI chat.
   *
   * Nếu có lessonId → query đầy đủ context của lesson đó.
   * Nếu không có → tìm current lesson của user trong path đang học.
   * Nếu user chưa bắt đầu path nào → trả fallback generic prompt.
   */
  async buildContext(
    userId: string,
    lessonId?: string,
  ): Promise<{ systemPrompt: string; context: AIContext }> {
    // Nếu không có lessonId → thử tìm current lesson từ user's active path
    if (!lessonId) {
      const userPath = await this.prisma.userLearningPath.findFirst({
        where: { userId, completedAt: null },
        include: { currentLesson: true, learningPath: true },
      });

      // Nếu có currentLessonId → dùng nó để build context
      if (userPath?.currentLessonId) {
        return this.buildContext(userId, userPath.currentLessonId);
      }

      // Fallback: user chưa bắt đầu path nào
      return this.buildFallback();
    }

    // ====== Có lessonId → query đầy đủ ======

    // Step 1: Query lesson
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return this.buildFallback();
    }

    // Step 2: Query TrackLesson → Track → LearningPath
    const trackLesson = await this.prisma.trackLesson.findFirst({
      where: { lessonId },
      include: { track: { include: { learningPath: true } } },
    });

    if (!trackLesson) {
      // Lesson tồn tại nhưng không có trong track nào → fallback
      return this.buildFallback();
    }

    // Step 3: Query UserLearningPath để lấy tên learning path hiện tại
    const userLearningPath = await this.prisma.userLearningPath.findFirst({
      where: {
        userId,
        learningPathId: trackLesson.track.learningPathId,
      },
      include: { currentLesson: true },
    });

    // Step 4: Completed lessons trong cùng learning path
    const completedProgresses = await this.prisma.userProgress.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        lesson: {
          trackLessons: {
            some: {
              track: {
                learningPathId: trackLesson.track.learningPathId,
              },
            },
          },
        },
      },
      include: { lesson: true },
    });

    const completedLessons = completedProgresses.map((p) => p.lesson.title);
    const previousLessons = completedProgresses.map((p) => ({
      title: p.lesson.title,
      summary: p.lesson.summary,
    }));

    // Step 5: Recent quiz scores (5 gần nhất, không filter theo path)
    const quizResults = await this.prisma.quizResult.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 5,
      include: { quiz: { include: { lesson: true } } },
    });

    const recentQuizScores = quizResults.map((r) => ({
      lesson: r.quiz.lesson.title,
      score: r.score,
    }));

    // ====== Build AIContext ======
    const keyTopics = this.extractKeyTopics(lesson.summary);

    const context: AIContext = {
      user: {
        learningPath: trackLesson.track.learningPath.name,
        currentTrack: trackLesson.track.name,
        currentLesson: lesson.title,
        completedLessons,
        recentQuizScores,
      },
      lesson: {
        title: lesson.title,
        summary: lesson.summary,
        keyTopics,
      },
      previousLessons,
    };

    // Ghi đè currentLesson nếu user đang học lesson khác
    if (userLearningPath?.currentLesson) {
      context.user.currentLesson = userLearningPath.currentLesson.title;
    }

    return {
      systemPrompt: this.buildSystemPrompt(context),
      context,
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Extract key topics từ lesson summary.
   *
   * Ưu tiên: bullet points (- hoặc *)
   * Fallback: split by comma, lấy tối đa 10 topics
   */
  private extractKeyTopics(summary: string): string[] {
    if (summary.includes('\n-') || summary.includes('\n*')) {
      return summary
        .split('\n')
        .filter((line) => /^[-*]\s/.test(line.trim()))
        .map((line) => line.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean);
    }

    return summary
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  /**
   * Render system prompt theo template từ 03-ai-integration.md.
   */
  private buildSystemPrompt(context: AIContext): string {
    const { user, lesson, previousLessons } = context;

    const keyTopicsText =
      lesson.keyTopics.length > 0
        ? lesson.keyTopics.map((t) => `- ${t}`).join('\n')
        : '- (no key topics available)';

    const previousLessonsText =
      previousLessons.length > 0
        ? previousLessons.map((l) => `- ${l.title}: ${l.summary}`).join('\n')
        : '- (no previous lessons)';

    return `You are a helpful learning assistant for DevPath, an IT learning platform.

CONTEXT:
- User is learning: ${user.learningPath}
- Current track: ${user.currentTrack}
- Current lesson: ${user.currentLesson}

LESSON CONTENT:
${lesson.summary}

KEY TOPICS:
${keyTopicsText}

PREVIOUS LESSONS USER COMPLETED:
${previousLessonsText}

RULES:
1. Only answer questions related to the current lesson and previous lessons
2. If asked about topics not yet covered, politely redirect
3. Provide examples when explaining concepts
4. Keep responses concise but helpful
5. Respond in the same language the user uses (Vietnamese or English)

If the user asks something completely unrelated to programming/IT,
politely remind them this is a learning assistant.`;
  }

  /**
   * Trả về generic prompt khi không có context.
   * Dùng khi: user chưa bắt đầu path nào, hoặc lesson không tồn tại.
   */
  private buildFallback(): { systemPrompt: string; context: AIContext } {
    return {
      systemPrompt: `You are a helpful learning assistant for DevPath, an IT learning platform.
Help the user with their programming and IT questions.
Respond in the same language the user uses (Vietnamese or English).
If the user asks something completely unrelated to programming/IT, politely remind them this is a learning assistant.`,
      context: EMPTY_CONTEXT,
    };
  }
}
