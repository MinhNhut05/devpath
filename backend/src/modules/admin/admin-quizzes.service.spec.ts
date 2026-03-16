// admin-quizzes.service.spec.ts
// Tests: createQuiz (success, lesson not found, already has quiz),
// updateQuiz (success, not found, replace questions),
// deleteQuiz (success, not found)

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { QuestionType } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { AdminQuizzesService } from './admin-quizzes.service.js';

describe('AdminQuizzesService', () => {
  let service: AdminQuizzesService;
  let prisma: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      lesson: { findUnique: jest.fn() },
      quiz: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      quizQuestion: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminQuizzesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AdminQuizzesService>(AdminQuizzesService);
    prisma = module.get(PrismaService);
  });

  // ── createQuiz ─────────────────────────────────────────────────────────

  describe('createQuiz()', () => {
    const dto = {
      lessonId: 'lesson-1',
      title: 'HTML Quiz',
      questions: [
        {
          questionText: 'What is HTML?',
          questionType: QuestionType.SINGLE_CHOICE,
          options: [{ id: 'a', text: 'Markup Language' }],
          correctAnswer: ['a'],
          order: 1,
        },
      ],
    };

    it('should create quiz with questions in transaction', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
      // No existing quiz for this lesson
      prisma.quiz.findUnique
        .mockResolvedValueOnce(null) // check existing quiz
        .mockResolvedValueOnce({     // return with questions
          id: 'quiz-1',
          title: 'HTML Quiz',
          questions: [{ id: 'q-1', questionText: 'What is HTML?' }],
        });
      prisma.quiz.create.mockResolvedValue({ id: 'quiz-1' });
      prisma.quizQuestion.createMany.mockResolvedValue({ count: 1 });

      const result = await service.createQuiz(dto);

      expect(result!.id).toBe('quiz-1');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when lesson not found', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.createQuiz(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when lesson already has a quiz', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
      prisma.quiz.findUnique.mockResolvedValue({ id: 'existing-quiz' });

      await expect(service.createQuiz(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ── updateQuiz ─────────────────────────────────────────────────────────

  describe('updateQuiz()', () => {
    it('should update quiz fields without replacing questions', async () => {
      prisma.quiz.findUnique
        .mockResolvedValueOnce({ id: 'quiz-1' }) // check exists
        .mockResolvedValueOnce({                  // return result
          id: 'quiz-1',
          title: 'Updated Quiz',
          questions: [],
        });
      prisma.quiz.update.mockResolvedValue({});

      const result = await service.updateQuiz('quiz-1', { title: 'Updated Quiz' });

      expect(result!.title).toBe('Updated Quiz');
      // Should NOT delete/recreate questions when not provided
      expect(prisma.quizQuestion.deleteMany).not.toHaveBeenCalled();
    });

    it('should replace questions when provided', async () => {
      prisma.quiz.findUnique
        .mockResolvedValueOnce({ id: 'quiz-1' })
        .mockResolvedValueOnce({
          id: 'quiz-1',
          questions: [{ id: 'q-new' }],
        });
      prisma.quiz.update.mockResolvedValue({});
      prisma.quizQuestion.deleteMany.mockResolvedValue({});
      prisma.quizQuestion.createMany.mockResolvedValue({});

      const newQuestions = [
        {
          questionText: 'New Q?',
          questionType: QuestionType.SINGLE_CHOICE,
          options: [{ id: 'a', text: 'Yes' }],
          correctAnswer: ['a'],
          order: 1,
        },
      ];

      await service.updateQuiz('quiz-1', { questions: newQuestions });

      expect(prisma.quizQuestion.deleteMany).toHaveBeenCalledWith({
        where: { quizId: 'quiz-1' },
      });
      expect(prisma.quizQuestion.createMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when quiz not found', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.updateQuiz('nonexistent', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── deleteQuiz ─────────────────────────────────────────────────────────

  describe('deleteQuiz()', () => {
    it('should hard-delete quiz', async () => {
      prisma.quiz.findUnique.mockResolvedValue({ id: 'quiz-1' });
      prisma.quiz.delete.mockResolvedValue({ id: 'quiz-1' });

      const result = await service.deleteQuiz('quiz-1');

      expect(result.id).toBe('quiz-1');
      expect(prisma.quiz.delete).toHaveBeenCalledWith({ where: { id: 'quiz-1' } });
    });

    it('should throw NotFoundException when quiz not found', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.deleteQuiz('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
