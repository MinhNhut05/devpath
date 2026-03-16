// admin-content.service.spec.ts
// Tests: generateContent — validate path, validate trackIds, generate lessons + quizzes,
// handle AI errors gracefully, skip quiz on bad JSON

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/index.js';
import { AiService } from '../ai/index.js';
import { AdminContentService } from './admin-content.service.js';

describe('AdminContentService', () => {
  let service: AdminContentService;
  let prisma: any;
  let aiService: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      learningPath: { findUnique: jest.fn() },
      lesson: { create: jest.fn() },
      trackLesson: { create: jest.fn() },
      quiz: { create: jest.fn() },
      quizQuestion: { createMany: jest.fn() },
    };

    aiService = {
      chat: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminContentService,
        { provide: PrismaService, useValue: prisma },
        { provide: AiService, useValue: aiService },
      ],
    }).compile();

    service = module.get<AdminContentService>(AdminContentService);
    prisma = module.get(PrismaService);
    aiService = module.get(AiService);
  });

  const baseDto = {
    learningPathSlug: 'frontend',
    lessons: [
      { title: 'HTML Basics', slug: 'html-basics', trackId: 'track-1', order: 1 },
    ],
    generateQuiz: false,
    quizQuestionsCount: 5,
  };

  // ── Validation ──────────────────────────────────────────────────────────

  describe('validation', () => {
    it('should throw NotFoundException when learningPath not found', async () => {
      prisma.learningPath.findUnique.mockResolvedValue(null);

      await expect(service.generateContent(baseDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when trackId does not belong to path', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({
        id: 'lp-1',
        name: 'Frontend',
        slug: 'frontend',
        tracks: [{ id: 'track-other' }], // different trackId
      });

      await expect(service.generateContent(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── Generate lessons without quiz ───────────────────────────────────────

  describe('generate lessons (no quiz)', () => {
    it('should create lesson with AI-generated summary', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({
        id: 'lp-1',
        name: 'Frontend',
        slug: 'frontend',
        tracks: [{ id: 'track-1' }],
      });
      aiService.chat.mockResolvedValue('# AI generated summary\n\nContent here...');
      prisma.lesson.create.mockResolvedValue({ id: 'lesson-new' });
      prisma.trackLesson.create.mockResolvedValue({});

      const result = await service.generateContent(baseDto);

      expect(result.created).toBe(1);
      expect(result.lessons).toHaveLength(1);
      expect(result.lessons[0]).toEqual({
        slug: 'html-basics',
        title: 'HTML Basics',
        hasQuiz: false,
      });
      expect(result.errors).toEqual([]);

      // Verify lesson created with AI summary
      expect(prisma.lesson.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'HTML Basics',
          slug: 'html-basics',
          summary: '# AI generated summary\n\nContent here...',
          estimatedMins: 60,
          isPublished: false,
        }),
      });

      // Verify trackLesson junction created
      expect(prisma.trackLesson.create).toHaveBeenCalledWith({
        data: {
          trackId: 'track-1',
          lessonId: 'lesson-new',
          order: 1,
        },
      });
    });

    it('should handle multiple lessons', async () => {
      const multiDto = {
        ...baseDto,
        lessons: [
          { title: 'HTML', slug: 'html', trackId: 'track-1', order: 1 },
          { title: 'CSS', slug: 'css', trackId: 'track-1', order: 2 },
          { title: 'JS', slug: 'js', trackId: 'track-1', order: 3 },
        ],
      };

      prisma.learningPath.findUnique.mockResolvedValue({
        id: 'lp-1',
        name: 'Frontend',
        slug: 'frontend',
        tracks: [{ id: 'track-1' }],
      });
      aiService.chat.mockResolvedValue('Summary content');
      prisma.lesson.create
        .mockResolvedValueOnce({ id: 'l-1' })
        .mockResolvedValueOnce({ id: 'l-2' })
        .mockResolvedValueOnce({ id: 'l-3' });
      prisma.trackLesson.create.mockResolvedValue({});

      const result = await service.generateContent(multiDto);

      expect(result.created).toBe(3);
      expect(result.lessons).toHaveLength(3);
      expect(aiService.chat).toHaveBeenCalledTimes(3);
    });
  });

  // ── Generate lessons with quiz ──────────────────────────────────────────

  describe('generate lessons with quiz', () => {
    const quizDto = {
      ...baseDto,
      generateQuiz: true,
      quizQuestionsCount: 3,
    };

    const validQuizJson = JSON.stringify([
      {
        questionText: 'What is HTML?',
        questionType: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: 'Markup language' },
          { id: 'b', text: 'Programming language' },
        ],
        correctAnswer: ['a'],
        explanation: 'HTML is a markup language.',
      },
      {
        questionText: 'What is CSS?',
        questionType: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: 'Styling language' },
          { id: 'b', text: 'Database' },
        ],
        correctAnswer: ['a'],
        explanation: 'CSS styles web pages.',
      },
      {
        questionText: 'What is div?',
        questionType: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: 'Block element' },
          { id: 'b', text: 'Inline element' },
        ],
        correctAnswer: ['a'],
        explanation: 'div is a block element.',
      },
    ]);

    it('should create lesson with quiz and questions', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({
        id: 'lp-1',
        name: 'Frontend',
        slug: 'frontend',
        tracks: [{ id: 'track-1' }],
      });
      aiService.chat
        .mockResolvedValueOnce('Lesson summary') // summary call
        .mockResolvedValueOnce(validQuizJson);    // quiz call
      prisma.lesson.create.mockResolvedValue({ id: 'lesson-1' });
      prisma.trackLesson.create.mockResolvedValue({});
      prisma.quiz.create.mockResolvedValue({ id: 'quiz-1' });
      prisma.quizQuestion.createMany.mockResolvedValue({ count: 3 });

      const result = await service.generateContent(quizDto);

      expect(result.created).toBe(1);
      expect(result.lessons[0].hasQuiz).toBe(true);
      expect(result.errors).toEqual([]);

      // Verify quiz created
      expect(prisma.quiz.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          lessonId: 'lesson-1',
          title: 'Quiz: HTML Basics',
          passThreshold: 70,
        }),
      });

      // Verify 3 questions created
      expect(prisma.quizQuestion.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            quizId: 'quiz-1',
            questionText: 'What is HTML?',
            order: 1,
          }),
        ]),
      });
    });

    it('should handle AI response wrapped in ```json``` code block', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({
        id: 'lp-1',
        name: 'Frontend',
        slug: 'frontend',
        tracks: [{ id: 'track-1' }],
      });
      // Wrap quiz JSON in markdown code block
      aiService.chat
        .mockResolvedValueOnce('Summary')
        .mockResolvedValueOnce('```json\n' + validQuizJson + '\n```');
      prisma.lesson.create.mockResolvedValue({ id: 'lesson-1' });
      prisma.trackLesson.create.mockResolvedValue({});
      prisma.quiz.create.mockResolvedValue({ id: 'quiz-1' });
      prisma.quizQuestion.createMany.mockResolvedValue({ count: 3 });

      const result = await service.generateContent(quizDto);

      expect(result.lessons[0].hasQuiz).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should skip quiz and add error when AI returns invalid JSON', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({
        id: 'lp-1',
        name: 'Frontend',
        slug: 'frontend',
        tracks: [{ id: 'track-1' }],
      });
      aiService.chat
        .mockResolvedValueOnce('Summary')
        .mockResolvedValueOnce('This is not valid JSON at all');
      prisma.lesson.create.mockResolvedValue({ id: 'lesson-1' });
      prisma.trackLesson.create.mockResolvedValue({});

      const result = await service.generateContent(quizDto);

      // Lesson should still be created
      expect(result.created).toBe(1);
      expect(result.lessons[0].hasQuiz).toBe(false);
      // Error should be recorded
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Quiz generation failed');
      expect(result.errors[0]).toContain('html-basics');
    });

    it('should skip quiz when AI returns empty array', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({
        id: 'lp-1',
        name: 'Frontend',
        slug: 'frontend',
        tracks: [{ id: 'track-1' }],
      });
      aiService.chat
        .mockResolvedValueOnce('Summary')
        .mockResolvedValueOnce('[]'); // empty array
      prisma.lesson.create.mockResolvedValue({ id: 'lesson-1' });
      prisma.trackLesson.create.mockResolvedValue({});

      const result = await service.generateContent(quizDto);

      expect(result.created).toBe(1);
      expect(result.lessons[0].hasQuiz).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('empty or non-array');
    });
  });

  // ── Error handling ──────────────────────────────────────────────────────

  describe('error handling', () => {
    it('should add error and continue when AI summary fails for a lesson', async () => {
      const multiDto = {
        ...baseDto,
        lessons: [
          { title: 'HTML', slug: 'html', trackId: 'track-1', order: 1 },
          { title: 'CSS', slug: 'css', trackId: 'track-1', order: 2 },
        ],
      };

      prisma.learningPath.findUnique.mockResolvedValue({
        id: 'lp-1',
        name: 'Frontend',
        slug: 'frontend',
        tracks: [{ id: 'track-1' }],
      });
      // First lesson: AI fails
      aiService.chat
        .mockRejectedValueOnce(new Error('AI API timeout'))
        .mockResolvedValueOnce('CSS summary'); // second lesson OK
      prisma.lesson.create.mockResolvedValue({ id: 'l-2' });
      prisma.trackLesson.create.mockResolvedValue({});

      const result = await service.generateContent(multiDto);

      expect(result.created).toBe(1); // only CSS succeeded
      expect(result.lessons).toHaveLength(1);
      expect(result.lessons[0].slug).toBe('css');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('html');
      expect(result.errors[0]).toContain('AI API timeout');
    });

    it('should add error when prisma.lesson.create fails (e.g. unique constraint)', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({
        id: 'lp-1',
        name: 'Frontend',
        slug: 'frontend',
        tracks: [{ id: 'track-1' }],
      });
      aiService.chat.mockResolvedValue('Summary');
      prisma.lesson.create.mockRejectedValue(new Error('Unique constraint failed'));

      const result = await service.generateContent(baseDto);

      expect(result.created).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Unique constraint failed');
    });
  });
});
