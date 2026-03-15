import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionType } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { QuizzesService } from './quizzes.service.js';
import { EssayGraderService } from './grading/essay-grader.service.js';
import { CodeRunnerService } from './grading/code-runner.service.js';

describe('QuizzesService', () => {
  let service: QuizzesService;
  let prisma: any;
  let essayGrader: { gradeEssay: jest.Mock };
  let codeRunner: { runCode: jest.Mock };

  const userId = 'user-uuid-123';
  const lessonId = 'lesson-uuid-456';
  const lessonSlug = 'intro-to-quizzes';
  const quizId = 'quiz-uuid-789';
  const singleQuestionId = 'question-single-1';
  const multipleQuestionId = 'question-multiple-1';
  const essayQuestionId = 'question-essay-1';
  const codeQuestionId = 'question-code-1';

  const singleChoiceQuestion = {
    id: singleQuestionId,
    quizId,
    questionText: 'What does HTML stand for?',
    questionType: QuestionType.SINGLE_CHOICE,
    options: [
      { id: 'a', text: 'Hyper Trainer Marking Language' },
      { id: 'b', text: 'HyperText Markup Language' },
    ],
    correctAnswer: ['b'],
    explanation: 'HTML stands for HyperText Markup Language.',
    codeTemplate: null,
    testCases: null,
    order: 1,
    createdAt: new Date('2026-03-15T08:00:00.000Z'),
    updatedAt: new Date('2026-03-15T08:00:00.000Z'),
  };

  const multipleChoiceQuestion = {
    id: multipleQuestionId,
    quizId,
    questionText: 'Which of the following are semantic HTML tags?',
    questionType: QuestionType.MULTIPLE_CHOICE,
    options: [
      { id: 'a', text: 'header' },
      { id: 'b', text: 'div' },
      { id: 'c', text: 'section' },
    ],
    correctAnswer: ['a', 'c'],
    explanation: 'header and section are semantic tags.',
    codeTemplate: null,
    testCases: null,
    order: 2,
    createdAt: new Date('2026-03-15T08:00:00.000Z'),
    updatedAt: new Date('2026-03-15T08:00:00.000Z'),
  };

  const essayQuestion = {
    id: essayQuestionId,
    quizId,
    questionText: 'Explain the purpose of semantic HTML.',
    questionType: QuestionType.ESSAY,
    options: [],
    correctAnswer: 'Semantic HTML describes meaning and structure.',
    explanation: 'It improves accessibility and SEO.',
    codeTemplate: null,
    testCases: null,
    order: 3,
    createdAt: new Date('2026-03-15T08:00:00.000Z'),
    updatedAt: new Date('2026-03-15T08:00:00.000Z'),
  };

  const codeQuestion = {
    id: codeQuestionId,
    quizId,
    questionText: 'Write a function that adds two numbers.',
    questionType: QuestionType.CODE_CHALLENGE,
    options: [],
    correctAnswer: null,
    explanation: 'Return the sum of two inputs.',
    codeTemplate: 'function add(a, b) {\n  // TODO\n}',
    testCases: [
      { input: '1 2', expected: '3' },
      { input: '5 7', expected: '12', isHidden: true },
    ],
    order: 4,
    createdAt: new Date('2026-03-15T08:00:00.000Z'),
    updatedAt: new Date('2026-03-15T08:00:00.000Z'),
  };

  const lesson = {
    id: lessonId,
    title: 'Intro to Quizzes',
    slug: lessonSlug,
  };

  const quiz = {
    id: quizId,
    lessonId,
    title: 'Lesson Quiz',
    description: 'A quiz for the lesson',
    passThreshold: 70,
    retryLimit: 3,
    retryCooldown: 30,
    createdAt: new Date('2026-03-15T08:00:00.000Z'),
    updatedAt: new Date('2026-03-15T08:00:00.000Z'),
    questions: [singleChoiceQuestion, multipleChoiceQuestion, essayQuestion, codeQuestion],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      lesson: {
        findUnique: jest.fn(),
      },
      quiz: {
        findUnique: jest.fn(),
      },
      quizResult: {
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    essayGrader = {
      gradeEssay: jest.fn(),
    };

    codeRunner = {
      runCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: PrismaService, useValue: prisma },
        { provide: EssayGraderService, useValue: essayGrader },
        { provide: CodeRunnerService, useValue: codeRunner },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
    prisma = module.get(PrismaService);
  });

  describe('getQuizByLessonSlug', () => {
    it('should return quiz with sanitized questions when lesson and quiz exist', async () => {
      prisma.lesson.findUnique.mockResolvedValue(lesson);
      prisma.quiz.findUnique.mockResolvedValue(quiz);

      const result = await service.getQuizByLessonSlug(userId, lessonSlug);

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { slug: lessonSlug },
      });
      expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
        where: { lessonId },
        include: {
          questions: { orderBy: { order: 'asc' } },
        },
      });
      expect(result.questions).toHaveLength(4);
      expect(result.questions[0]).toEqual(
        expect.objectContaining({
          id: singleQuestionId,
          questionText: singleChoiceQuestion.questionText,
          questionType: QuestionType.SINGLE_CHOICE,
        }),
      );
      expect(result.questions[0]).not.toHaveProperty('correctAnswer');
      expect(result.questions[0]).not.toHaveProperty('explanation');
      expect(result.questions[2]).not.toHaveProperty('correctAnswer');
      expect(result.questions[2]).not.toHaveProperty('explanation');
    });

    it('should throw NotFoundException when lesson does not exist', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      const promise = service.getQuizByLessonSlug(userId, lessonSlug);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(`Lesson "${lessonSlug}" not found`);
      expect(prisma.quiz.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when lesson exists but quiz does not exist', async () => {
      prisma.lesson.findUnique.mockResolvedValue(lesson);
      prisma.quiz.findUnique.mockResolvedValue(null);

      const promise = service.getQuizByLessonSlug(userId, lessonSlug);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(
        `Quiz for lesson "${lessonSlug}" not found`,
      );
    });
  });

  describe('getQuizById', () => {
    it('should return quiz with sanitized questions when quiz exists', async () => {
      prisma.quiz.findUnique.mockResolvedValue(quiz);

      const result = await service.getQuizById(userId, quizId);

      expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
        where: { id: quizId },
        include: {
          questions: { orderBy: { order: 'asc' } },
        },
      });
      expect(result.questions).toHaveLength(4);
      expect(result.questions[1]).not.toHaveProperty('correctAnswer');
      expect(result.questions[1]).not.toHaveProperty('explanation');
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      const promise = service.getQuizById(userId, quizId);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(`Quiz "${quizId}" not found`);
    });
  });

  describe('submitQuiz', () => {
    it('should auto-grade answers, create QuizResult, and return score with questionDetails', async () => {
      const submissionQuiz = {
        ...quiz,
        questions: [singleChoiceQuestion, essayQuestion],
      };
      const createdResult = {
        id: 'result-1',
        userId,
        quizId,
        score: 100,
        passed: true,
        answers: [
          { questionId: singleQuestionId, selected: ['b'], correct: true },
          { questionId: essayQuestionId, selected: ['semantic'], correct: false },
        ],
        attemptNumber: 2,
        completedAt: new Date('2026-03-15T09:00:00.000Z'),
      };

      prisma.quiz.findUnique.mockResolvedValue(submissionQuiz);
      prisma.quizResult.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(1);
      prisma.quizResult.findFirst.mockResolvedValue(null);
      prisma.quizResult.create.mockResolvedValue(createdResult);

      const result = await service.submitQuiz(userId, quizId, {
        answers: [
          { questionId: singleQuestionId, selected: ['b'] },
          { questionId: essayQuestionId, selected: ['semantic'] },
        ],
      });

      expect(prisma.quizResult.create).toHaveBeenCalledWith({
        data: {
          userId,
          quizId,
          score: 100,
          passed: true,
          answers: [
            { questionId: singleQuestionId, selected: ['b'], correct: true },
            { questionId: essayQuestionId, selected: ['semantic'], correct: false },
          ],
          attemptNumber: 2,
        },
      });
      expect(result).toEqual({
        ...createdResult,
        questionDetails: [
          {
            id: singleQuestionId,
            correctAnswer: ['b'],
            explanation: singleChoiceQuestion.explanation,
          },
          {
            id: essayQuestionId,
            correctAnswer: essayQuestion.correctAnswer,
            explanation: essayQuestion.explanation,
          },
        ],
      });
    });

    it('should mark SINGLE_CHOICE answer as correct when selected answer matches', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [singleChoiceQuestion],
      });
      prisma.quizResult.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.quizResult.findFirst.mockResolvedValue(null);
      prisma.quizResult.create.mockResolvedValue({ id: 'result-2' });

      await service.submitQuiz(userId, quizId, {
        answers: [{ questionId: singleQuestionId, selected: ['b'] }],
      });

      expect(prisma.quizResult.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          score: 100,
          answers: [{ questionId: singleQuestionId, selected: ['b'], correct: true }],
        }),
      });
    });

    it('should mark SINGLE_CHOICE answer as incorrect when selected answer does not match', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [singleChoiceQuestion],
      });
      prisma.quizResult.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.quizResult.findFirst.mockResolvedValue(null);
      prisma.quizResult.create.mockResolvedValue({ id: 'result-3' });

      await service.submitQuiz(userId, quizId, {
        answers: [{ questionId: singleQuestionId, selected: ['a'] }],
      });

      expect(prisma.quizResult.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          score: 0,
          answers: [{ questionId: singleQuestionId, selected: ['a'], correct: false }],
        }),
      });
    });

    it('should mark MULTIPLE_CHOICE answer as correct when selected answers match', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [multipleChoiceQuestion],
      });
      prisma.quizResult.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.quizResult.findFirst.mockResolvedValue(null);
      prisma.quizResult.create.mockResolvedValue({ id: 'result-4' });

      await service.submitQuiz(userId, quizId, {
        answers: [{ questionId: multipleQuestionId, selected: ['a', 'c'] }],
      });

      expect(prisma.quizResult.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          score: 100,
          answers: [
            { questionId: multipleQuestionId, selected: ['a', 'c'], correct: true },
          ],
        }),
      });
    });

    it('should mark MULTIPLE_CHOICE answer as correct when selected answers have different order', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [multipleChoiceQuestion],
      });
      prisma.quizResult.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.quizResult.findFirst.mockResolvedValue(null);
      prisma.quizResult.create.mockResolvedValue({ id: 'result-5' });

      await service.submitQuiz(userId, quizId, {
        answers: [{ questionId: multipleQuestionId, selected: ['c', 'a'] }],
      });

      expect(prisma.quizResult.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          score: 100,
          answers: [
            { questionId: multipleQuestionId, selected: ['c', 'a'], correct: true },
          ],
        }),
      });
    });

    it('should mark MULTIPLE_CHOICE answer as incorrect when selected answers are partial', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [multipleChoiceQuestion],
      });
      prisma.quizResult.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.quizResult.findFirst.mockResolvedValue(null);
      prisma.quizResult.create.mockResolvedValue({ id: 'result-6' });

      await service.submitQuiz(userId, quizId, {
        answers: [{ questionId: multipleQuestionId, selected: ['a'] }],
      });

      expect(prisma.quizResult.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          score: 0,
          answers: [{ questionId: multipleQuestionId, selected: ['a'], correct: false }],
        }),
      });
    });

    it('should allow submit when today attempts are below retry limit and there is no last attempt', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [singleChoiceQuestion],
      });
      prisma.quizResult.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      prisma.quizResult.findFirst.mockResolvedValue(null);
      prisma.quizResult.create.mockResolvedValue({ id: 'result-7' });

      await service.submitQuiz(userId, quizId, {
        answers: [{ questionId: singleQuestionId, selected: ['b'] }],
      });

      expect(prisma.quizResult.findFirst).toHaveBeenCalledWith({
        where: { userId, quizId },
        orderBy: { completedAt: 'desc' },
      });
      expect(prisma.quizResult.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when retry limit is reached', async () => {
      prisma.quiz.findUnique.mockResolvedValue(quiz);
      prisma.quizResult.count.mockResolvedValue(quiz.retryLimit);

      const promise = service.submitQuiz(userId, quizId, {
        answers: [{ questionId: singleQuestionId, selected: ['b'] }],
      });

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('Retry limit reached');
      expect(prisma.quizResult.findFirst).not.toHaveBeenCalled();
      expect(prisma.quizResult.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when retry cooldown is still active', async () => {
      const now = new Date('2026-03-15T10:30:00.000Z');
      const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      prisma.quiz.findUnique.mockResolvedValue(quiz);
      prisma.quizResult.count.mockResolvedValueOnce(1);
      prisma.quizResult.findFirst.mockResolvedValue({
        id: 'last-attempt',
        completedAt: new Date(now.getTime() - 10 * 60_000),
      });

      const promise = service.submitQuiz(userId, quizId, {
        answers: [{ questionId: singleQuestionId, selected: ['b'] }],
      });

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow(
        'Please wait 20 minutes before retrying',
      );
      expect(prisma.quizResult.create).not.toHaveBeenCalled();

      dateNowSpy.mockRestore();
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      const promise = service.submitQuiz(userId, quizId, {
        answers: [],
      });

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(`Quiz "${quizId}" not found`);
    });
  });

  describe('getQuizResults', () => {
    it('should return quiz results ordered by most recent first', async () => {
      const results = [
        {
          id: 'result-newest',
          userId,
          quizId,
          score: 90,
          completedAt: new Date('2026-03-15T10:00:00.000Z'),
        },
        {
          id: 'result-oldest',
          userId,
          quizId,
          score: 70,
          completedAt: new Date('2026-03-14T10:00:00.000Z'),
        },
      ];
      prisma.quizResult.findMany.mockResolvedValue(results);

      const result = await service.getQuizResults(userId, quizId);

      expect(prisma.quizResult.findMany).toHaveBeenCalledWith({
        where: { userId, quizId },
        orderBy: { completedAt: 'desc' },
      });
      expect(result).toEqual(results);
    });

    it('should return an empty array when user has no quiz results', async () => {
      prisma.quizResult.findMany.mockResolvedValue([]);

      const result = await service.getQuizResults(userId, quizId);

      expect(result).toEqual([]);
    });
  });

  describe('evaluateEssay', () => {
    it('should find essay question, call EssayGraderService, and return grading result', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [essayQuestion],
      });
      essayGrader.gradeEssay.mockResolvedValue({
        score: 85,
        feedback: 'Câu trả lời đúng ý chính.',
      });

      const result = await service.evaluateEssay(userId, quizId, {
        questionId: essayQuestionId,
        answer: 'Semantic HTML improves meaning and accessibility.',
      });

      expect(essayGrader.gradeEssay).toHaveBeenCalledWith(
        essayQuestion.questionText,
        essayQuestion.correctAnswer,
        essayQuestion.explanation,
        'Semantic HTML improves meaning and accessibility.',
        userId,
      );
      expect(result).toEqual({
        questionId: essayQuestionId,
        score: 85,
        feedback: 'Câu trả lời đúng ý chính.',
      });
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      const promise = service.evaluateEssay(userId, quizId, {
        questionId: essayQuestionId,
        answer: 'Some essay answer here.',
      });

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(`Quiz "${quizId}" not found`);
    });

    it('should throw NotFoundException when question is not in the quiz', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [essayQuestion],
      });

      const promise = service.evaluateEssay(userId, quizId, {
        questionId: 'missing-question-id',
        answer: 'Some essay answer here.',
      });

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(
        `Question "missing-question-id" not found in quiz "${quizId}"`,
      );
    });

    it('should throw BadRequestException when question type is not ESSAY', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [singleChoiceQuestion],
      });

      const promise = service.evaluateEssay(userId, quizId, {
        questionId: singleQuestionId,
        answer: 'Some essay answer here.',
      });

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow(
        `Question "${singleQuestionId}" is not an ESSAY question`,
      );
      expect(essayGrader.gradeEssay).not.toHaveBeenCalled();
    });

    it('should pass null correctAnswer to EssayGraderService when reference answer is missing', async () => {
      const essayWithoutReference = {
        ...essayQuestion,
        correctAnswer: null,
      };
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [essayWithoutReference],
      });
      essayGrader.gradeEssay.mockResolvedValue({
        score: 60,
        feedback: 'Có ý đúng nhưng còn thiếu chi tiết.',
      });

      await service.evaluateEssay(userId, quizId, {
        questionId: essayQuestionId,
        answer: 'My answer without a reference answer.',
      });

      expect(essayGrader.gradeEssay).toHaveBeenCalledWith(
        essayQuestion.questionText,
        null,
        essayQuestion.explanation,
        'My answer without a reference answer.',
        userId,
      );
    });
  });

  describe('runCode', () => {
    it('should find code challenge question, parse testCases, call CodeRunnerService, and return result', async () => {
      const runCodeResult = {
        passed: true,
        results: [
          {
            input: '1 2',
            expected: '3',
            actual: '3',
            passed: true,
            isHidden: false,
          },
        ],
        totalPassed: 1,
        totalTests: 1,
      };
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [codeQuestion],
      });
      codeRunner.runCode.mockResolvedValue(runCodeResult);

      const result = await service.runCode(userId, quizId, {
        questionId: codeQuestionId,
        code: 'function add(a, b) { return a + b; }',
        language: 'javascript',
      });

      expect(codeRunner.runCode).toHaveBeenCalledWith(
        'function add(a, b) { return a + b; }',
        [
          { input: '1 2', expected: '3' },
          { input: '5 7', expected: '12', isHidden: true },
        ],
        'javascript',
      );
      expect(result).toEqual(runCodeResult);
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      const promise = service.runCode(userId, quizId, {
        questionId: codeQuestionId,
        code: 'console.log(1);',
        language: 'javascript',
      });

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(`Quiz "${quizId}" not found`);
    });

    it('should throw NotFoundException when question is not in quiz', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [codeQuestion],
      });

      const promise = service.runCode(userId, quizId, {
        questionId: 'missing-question-id',
        code: 'console.log(1);',
        language: 'javascript',
      });

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(
        `Question "missing-question-id" not found in quiz "${quizId}"`,
      );
    });

    it('should throw BadRequestException when question type is not CODE_CHALLENGE', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [essayQuestion],
      });

      const promise = service.runCode(userId, quizId, {
        questionId: essayQuestionId,
        code: 'console.log(1);',
        language: 'javascript',
      });

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow(
        `Question "${essayQuestionId}" is not a CODE_CHALLENGE question`,
      );
      expect(codeRunner.runCode).not.toHaveBeenCalled();
    });

    it('should pass an empty array when testCases is null', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        ...quiz,
        questions: [
          {
            ...codeQuestion,
            testCases: null,
          },
        ],
      });
      codeRunner.runCode.mockResolvedValue({
        passed: false,
        results: [],
        totalPassed: 0,
        totalTests: 0,
      });

      await service.runCode(userId, quizId, {
        questionId: codeQuestionId,
        code: 'console.log(1);',
        language: 'javascript',
      });

      expect(codeRunner.runCode).toHaveBeenCalledWith(
        'console.log(1);',
        [],
        'javascript',
      );
    });
  });
});
