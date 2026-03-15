// quizzes.service.ts - Business logic cho Quizzes
//
// Service quản lý quiz operations:
//   - Lấy quiz (by lesson slug hoặc quiz ID)
//   - Submit quiz answers → auto-grade SINGLE_CHOICE/MULTIPLE_CHOICE
//   - Evaluate essay → delegate to EssayGraderService (AI grading)
//   - Run code → delegate to CodeRunnerService (Judge0 API)
//   - Xem quiz results (history)
//
// Tách riêng khỏi LessonsService vì:
//   → Quiz là subsystem phức tạp riêng (grading, retry limits, multiple question types)
//   → Dễ scale: essay grading + code runner là external service integrations
//   → Single Responsibility: LessonsService lo content, QuizzesService lo assessment
//
// PrismaModule là @Global() → PrismaService inject tự động.

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, QuestionType, type QuizQuestion } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { EssayGraderService } from './grading/essay-grader.service.js';
import { CodeRunnerService } from './grading/code-runner.service.js';
import type { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import type { EvaluateEssayDto } from './dto/evaluate-essay.dto.js';
import type { RunCodeDto } from './dto/run-code.dto.js';

// ── Module-level Types ─────────────────────────────────────────────────────

interface GradedAnswer {
  questionId: string;
  selected: string[];
  correct: boolean;
}

interface AutoGradeResult {
  gradedAnswers: GradedAnswer[];
  score: number; // 0–100, dựa trên auto-gradeable questions
}

// ── Module-level Helper ────────────────────────────────────────────────────

/**
 * Trả về 00:00:00.000 của ngày hiện tại (local time).
 * Dùng để filter QuizResult trong ngày hôm nay cho retry limit.
 */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ──────────────────────────────────────────────────────────────────────────

@Injectable()
export class QuizzesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly essayGrader: EssayGraderService,
    private readonly codeRunner: CodeRunnerService,
  ) {}

  // ── GET /lessons/:slug/quiz ─────────────────────────────────────────────

  /**
   * Lấy quiz gắn với lesson theo slug.
   * Strip correctAnswer + explanation khỏi questions trước khi trả về.
   */
  async getQuizByLessonSlug(userId: string, slug: string) {
    // 1. Tìm lesson theo slug
    const lesson = await this.prisma.lesson.findUnique({ where: { slug } });
    if (!lesson) {
      throw new NotFoundException(`Lesson "${slug}" not found`);
    }

    // 2. Tìm quiz gắn với lesson đó (include questions, sort by order)
    const quiz = await this.prisma.quiz.findUnique({
      where: { lessonId: lesson.id },
      include: {
        questions: { orderBy: { order: 'asc' } },
      },
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz for lesson "${slug}" not found`);
    }

    // 3. Ẩn correctAnswer + explanation — không cho client biết đáp án trước khi submit
    const sanitizedQuestions = quiz.questions.map(
      ({ correctAnswer: _ca, explanation: _exp, ...rest }) => rest,
    );

    return { ...quiz, questions: sanitizedQuestions };
  }

  // ── GET /quizzes/:id ──────────────────────────────────────────────────────

  /**
   * Lấy quiz theo UUID.
   * Strip correctAnswer + explanation khỏi questions trước khi trả về.
   */
  async getQuizById(userId: string, quizId: string) {
    // 1. Tìm quiz (include questions, sort by order)
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: { orderBy: { order: 'asc' } },
      },
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz "${quizId}" not found`);
    }

    // 2. Ẩn correctAnswer + explanation
    const sanitizedQuestions = quiz.questions.map(
      ({ correctAnswer: _ca, explanation: _exp, ...rest }) => rest,
    );

    return { ...quiz, questions: sanitizedQuestions };
  }

  // ── POST /quizzes/:id/submit ──────────────────────────────────────────────

  /**
   * Submit quiz answers — auto-grade SINGLE_CHOICE/MULTIPLE_CHOICE.
   * Check retry limit trước khi chấm, tạo QuizResult record.
   * Response expose correctAnswer + explanation để user review sau khi submit.
   */
  async submitQuiz(userId: string, quizId: string, dto: SubmitQuizDto) {
    // 1. Tìm quiz + questions
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz "${quizId}" not found`);
    }

    // 2. Kiểm tra retry limit + cooldown
    await this.checkRetryLimit(userId, quiz);

    // 3. Count số lần attempt trước (để gán attemptNumber)
    const previousAttempts = await this.prisma.quizResult.count({
      where: { userId, quizId },
    });

    // 4. Auto-grade SINGLE_CHOICE + MULTIPLE_CHOICE
    const { gradedAnswers, score } = this.autoGrade(quiz.questions, dto.answers);

    // 5. Lưu QuizResult vào DB
    const quizResult = await this.prisma.quizResult.create({
      data: {
        userId,
        quizId,
        score: Math.round(score),
        passed: score >= quiz.passThreshold,
        answers: gradedAnswers as unknown as Prisma.InputJsonValue,
        attemptNumber: previousAttempts + 1,
      },
    });

    // 6. Trả về result + expose correctAnswer/explanation để user review
    return {
      ...quizResult,
      questionDetails: quiz.questions.map((q) => ({
        id: q.id,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    };
  }

  // ── GET /quizzes/:id/results ──────────────────────────────────────────────

  /**
   * Lấy history kết quả quiz — tất cả attempts của user, mới nhất trước.
   */
  async getQuizResults(userId: string, quizId: string) {
    return this.prisma.quizResult.findMany({
      where: { userId, quizId },
      orderBy: { completedAt: 'desc' },
    });
  }

  // ── POST /quizzes/:id/evaluate-essay ──────────────────────────────────────

  /**
   * Gửi essay answer cho AI chấm điểm.
   *
   * Flow:
   *   1. Tìm quiz + questions
   *   2. Tìm question theo questionId → 404 nếu không có
   *   3. Verify questionType === ESSAY → 400 nếu sai type
   *   4. Cast correctAnswer (Prisma Json → string | null)
   *   5. Delegate sang EssayGraderService.gradeEssay()
   *   6. Return { questionId, score, feedback }
   */
  async evaluateEssay(userId: string, quizId: string, dto: EvaluateEssayDto) {
    // 1. Tìm quiz + questions
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz "${quizId}" not found`);
    }

    // 2. Tìm question theo questionId
    const question = quiz.questions.find((q) => q.id === dto.questionId);
    if (!question) {
      throw new NotFoundException(
        `Question "${dto.questionId}" not found in quiz "${quizId}"`,
      );
    }

    // 3. Verify đúng question type
    if (question.questionType !== QuestionType.ESSAY) {
      throw new BadRequestException(
        `Question "${dto.questionId}" is not an ESSAY question`,
      );
    }

    // 4. Cast correctAnswer: Prisma Json → string | null
    // correctAnswer cho ESSAY có thể là string (đáp án mẫu) hoặc null (không có mẫu)
    const correctAnswer =
      typeof question.correctAnswer === 'string'
        ? question.correctAnswer
        : null;

    // 5. Delegate sang EssayGraderService (AI call, log, quota)
    const { score, feedback } = await this.essayGrader.gradeEssay(
      question.questionText,
      correctAnswer,
      question.explanation ?? null,
      dto.answer,
      userId,
    );

    // 6. Return kết quả chấm điểm
    return { questionId: dto.questionId, score, feedback };
  }

  // ── POST /quizzes/:id/run-code ────────────────────────────────────────────

  /**
   * Chạy code challenge — execute via Judge0 + check test cases.
   *
   * Flow:
   *   1. Tìm quiz + questions
   *   2. Tìm question theo questionId → 404 nếu không có
   *   3. Verify questionType === CODE_CHALLENGE → 400 nếu sai type
   *   4. Parse testCases: Prisma Json → TestCase[] (null → empty array)
   *   5. Delegate sang CodeRunnerService.runCode()
   *   6. Return RunCodeResult
   */
  async runCode(userId: string, quizId: string, dto: RunCodeDto) {
    // 1. Tìm quiz + questions
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz "${quizId}" not found`);
    }

    // 2. Tìm question theo questionId
    const question = quiz.questions.find((q) => q.id === dto.questionId);
    if (!question) {
      throw new NotFoundException(
        `Question "${dto.questionId}" not found in quiz "${quizId}"`,
      );
    }

    // 3. Verify đúng question type
    if (question.questionType !== QuestionType.CODE_CHALLENGE) {
      throw new BadRequestException(
        `Question "${dto.questionId}" is not a CODE_CHALLENGE question`,
      );
    }

    // 4. Parse testCases từ Prisma Json
    // testCases có thể null nếu admin chưa thêm test cases
    // Cast về TestCase[] để pass vào CodeRunnerService
    interface TestCase {
      input: string;
      expected: string;
      isHidden?: boolean;
    }

    const testCases: TestCase[] = Array.isArray(question.testCases)
      ? (question.testCases as unknown as TestCase[])
      : [];

    // 5. Delegate sang CodeRunnerService (Judge0 API call)
    return this.codeRunner.runCode(dto.code, testCases, dto.language);
  }

  // ── Helper: Check Retry Limit ─────────────────────────────────────────────

  /**
   * Kiểm tra user còn được phép retry quiz không.
   *
   * 2 điều kiện throw:
   *  1. Số lần attempt hôm nay >= retryLimit → "Try again tomorrow"
   *  2. Thời gian kể từ lần cuối < retryCooldown phút → "Please wait X minutes"
   */
  private async checkRetryLimit(
    userId: string,
    quiz: { id: string; retryLimit: number; retryCooldown: number },
  ) {
    // 1. Đếm số lần attempt hôm nay
    const todayAttempts = await this.prisma.quizResult.count({
      where: {
        userId,
        quizId: quiz.id,
        completedAt: { gte: startOfToday() },
      },
    });

    if (todayAttempts >= quiz.retryLimit) {
      throw new BadRequestException('Retry limit reached. Try again tomorrow.');
    }

    // 2. Kiểm tra cooldown — tìm lần attempt gần nhất
    const lastAttempt = await this.prisma.quizResult.findFirst({
      where: { userId, quizId: quiz.id },
      orderBy: { completedAt: 'desc' },
    });

    if (lastAttempt) {
      const minutesSince = (Date.now() - lastAttempt.completedAt.getTime()) / 60_000;
      if (minutesSince < quiz.retryCooldown) {
        const remaining = Math.ceil(quiz.retryCooldown - minutesSince);
        throw new BadRequestException(
          `Please wait ${remaining} minutes before retrying`,
        );
      }
    }
  }

  // ── Helper: Auto Grade ────────────────────────────────────────────────────

  /**
   * Tự động chấm điểm SINGLE_CHOICE và MULTIPLE_CHOICE.
   * ESSAY + CODE_CHALLENGE không được tính vào score (graded = false, skip denominator).
   *
   * Score formula: (correctCount / autoGradeableCount) * 100
   * Nếu quiz toàn ESSAY/CODE → score = 0 (Tab 3/4 sẽ handle riêng).
   */
  private autoGrade(
    questions: QuizQuestion[],
    answers: { questionId: string; selected: string[] }[],
  ): AutoGradeResult {
    // Chỉ tính score dựa trên SINGLE_CHOICE + MULTIPLE_CHOICE
    const autoGradeableCount = questions.filter(
      (q) =>
        q.questionType === QuestionType.SINGLE_CHOICE ||
        q.questionType === QuestionType.MULTIPLE_CHOICE,
    ).length;

    const gradedAnswers: GradedAnswer[] = [];
    let correctCount = 0;

    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.questionId);

      // questionId không thuộc quiz này → skip (không throw)
      if (!question) continue;

      let correct = false;

      if (
        question.questionType === QuestionType.ESSAY ||
        question.questionType === QuestionType.CODE_CHALLENGE
      ) {
        // ESSAY + CODE_CHALLENGE: không auto-grade, correct = false
        // (không tính vào denominator)
        correct = false;
      } else {
        const correctAnswer = question.correctAnswer as string[];

        if (question.questionType === QuestionType.SINGLE_CHOICE) {
          // So sánh phần tử đầu tiên
          correct = answer.selected[0] === correctAnswer[0];
        } else if (question.questionType === QuestionType.MULTIPLE_CHOICE) {
          // Sort cả 2 rồi so sánh JSON string
          const sortedSelected = [...answer.selected].sort();
          const sortedCorrect = [...correctAnswer].sort();
          correct = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
        }

        if (correct) correctCount++;
      }

      gradedAnswers.push({
        questionId: answer.questionId,
        selected: answer.selected,
        correct,
      });
    }

    // Tính score — nếu không có câu auto-gradeable → score = 0
    const score =
      autoGradeableCount === 0 ? 0 : (correctCount / autoGradeableCount) * 100;

    return { gradedAnswers, score };
  }
}
