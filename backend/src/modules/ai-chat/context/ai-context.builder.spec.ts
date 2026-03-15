// ai-context.builder.spec.ts - Unit tests cho AiContextBuilder
//
// Mock: PrismaService (userLearningPath, lesson, trackLesson, userProgress, quizResult)
// Test: buildContext() voi/khong lessonId, systemPrompt format, extractKeyTopics

import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../prisma/index.js';
import { AiContextBuilder } from './ai-context.builder.js';

// ── Mock data ──────────────────────────────────────────────────────────────

const mockUserId = 'user-uuid-123';
const mockLessonId = 'lesson-uuid-456';
const mockLearningPathId = 'path-uuid-789';
const mockTrackId = 'track-uuid-101';

const mockLesson = {
  id: mockLessonId,
  title: 'React Hooks',
  summary: '- useState for state management\n- useEffect for side effects\n- Custom hooks',
  content: 'Full lesson content...',
  slug: 'react-hooks',
  type: 'THEORY',
  difficulty: 'beginner',
  estimatedMinutes: 30,
  order: 1,
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTrackLesson = {
  id: 'tl-uuid-202',
  trackId: mockTrackId,
  lessonId: mockLessonId,
  order: 1,
  track: {
    id: mockTrackId,
    name: 'React Fundamentals',
    learningPathId: mockLearningPathId,
    learningPath: {
      id: mockLearningPathId,
      name: 'Frontend Developer',
    },
  },
};

const mockUserLearningPath = {
  id: 'ulp-uuid-303',
  userId: mockUserId,
  learningPathId: mockLearningPathId,
  currentLessonId: mockLessonId,
  currentLesson: { id: mockLessonId, title: 'React Hooks' },
  startedAt: new Date(),
  completedAt: null,
};

const mockCompletedProgress = [
  {
    lesson: { title: 'HTML Basics', summary: 'HTML fundamentals' },
  },
  {
    lesson: { title: 'CSS Flexbox', summary: 'Flexbox layout' },
  },
];

const mockQuizResults = [
  {
    score: 85,
    quiz: { lesson: { title: 'HTML Basics' } },
  },
];

// ── Tests ──────────────────────────────────────────────────────────────────

describe('AiContextBuilder', () => {
  let builder: AiContextBuilder;
  let prisma: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      userLearningPath: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      lesson: {
        findUnique: jest.fn().mockResolvedValue(mockLesson),
      },
      trackLesson: {
        findFirst: jest.fn().mockResolvedValue(mockTrackLesson),
      },
      userProgress: {
        findMany: jest.fn().mockResolvedValue(mockCompletedProgress),
      },
      quizResult: {
        findMany: jest.fn().mockResolvedValue(mockQuizResults),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiContextBuilder,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    builder = module.get<AiContextBuilder>(AiContextBuilder);
  });

  // ─── With lessonId ──────────────────────────────────────────────────────

  describe('with lessonId', () => {
    it('should build full context when lessonId provided', async () => {
      // Happy path: co lessonId → query day du context tu DB
      prisma.userLearningPath.findFirst.mockResolvedValue(mockUserLearningPath);

      const result = await builder.buildContext(mockUserId, mockLessonId);

      // Verify context co day du thong tin
      expect(result.context.user.learningPath).toBe('Frontend Developer');
      expect(result.context.user.currentTrack).toBe('React Fundamentals');
      expect(result.context.lesson.title).toBe('React Hooks');
      expect(result.context.user.completedLessons).toContain('HTML Basics');
      expect(result.context.user.recentQuizScores).toHaveLength(1);
      expect(result.systemPrompt).toBeDefined();
    });

    it('should return fallback when lesson not found', async () => {
      // Lesson khong ton tai → fallback generic prompt
      prisma.lesson.findUnique.mockResolvedValue(null);

      const result = await builder.buildContext(mockUserId, 'nonexistent-id');

      // Fallback prompt van hoat dong
      expect(result.systemPrompt).toContain('learning assistant');
      expect(result.context.user.learningPath).toBe('');
    });

    it('should return fallback when lesson has no track', async () => {
      // Lesson ton tai nhung khong thuoc track nao → fallback
      prisma.trackLesson.findFirst.mockResolvedValue(null);

      const result = await builder.buildContext(mockUserId, mockLessonId);

      expect(result.systemPrompt).toContain('learning assistant');
      expect(result.context.lesson.title).toBe('');
    });
  });

  // ─── Without lessonId ───────────────────────────────────────────────────

  describe('without lessonId', () => {
    it('should use currentLessonId from active learning path', async () => {
      // Khong truyen lessonId → tim currentLessonId tu userLearningPath dang hoc
      prisma.userLearningPath.findFirst.mockResolvedValue({
        ...mockUserLearningPath,
        currentLessonId: mockLessonId,
        learningPath: { id: mockLearningPathId, name: 'Frontend Developer' },
      });
      // Mock cho recursive call voi lessonId
      prisma.userLearningPath.findFirst
        .mockResolvedValueOnce({
          ...mockUserLearningPath,
          currentLessonId: mockLessonId,
          learningPath: { id: mockLearningPathId, name: 'Frontend Developer' },
        })
        .mockResolvedValueOnce(mockUserLearningPath);

      const result = await builder.buildContext(mockUserId);

      // Da tim duoc lesson → co context day du
      expect(result.context.lesson.title).toBe('React Hooks');
    });

    it('should return fallback when user has no active learning path', async () => {
      // User chua bat dau path nao → fallback
      prisma.userLearningPath.findFirst.mockResolvedValue(null);

      const result = await builder.buildContext(mockUserId);

      expect(result.systemPrompt).toContain('learning assistant');
      expect(result.context.user.learningPath).toBe('');
    });

    it('should return fallback when active path has null currentLessonId', async () => {
      // Co active path nhung currentLessonId = null → fallback
      prisma.userLearningPath.findFirst.mockResolvedValue({
        ...mockUserLearningPath,
        currentLessonId: null,
        currentLesson: null,
        learningPath: { id: mockLearningPathId, name: 'Frontend Developer' },
      });

      const result = await builder.buildContext(mockUserId);

      expect(result.systemPrompt).toContain('learning assistant');
    });
  });

  // ─── System prompt format ───────────────────────────────────────────────

  describe('systemPrompt format', () => {
    it('should contain key sections in system prompt', async () => {
      // Verify system prompt co day du cac section quan trong
      prisma.userLearningPath.findFirst.mockResolvedValue(mockUserLearningPath);

      const result = await builder.buildContext(mockUserId, mockLessonId);

      expect(result.systemPrompt).toContain('CONTEXT:');
      expect(result.systemPrompt).toContain('LESSON CONTENT:');
      expect(result.systemPrompt).toContain('KEY TOPICS:');
      expect(result.systemPrompt).toContain('PREVIOUS LESSONS');
      expect(result.systemPrompt).toContain('RULES:');
    });

    it('should return generic fallback prompt when no context available', async () => {
      // Fallback prompt: khong co sections cu the, chi co generic message
      prisma.lesson.findUnique.mockResolvedValue(null);

      const result = await builder.buildContext(mockUserId, 'bad-id');

      expect(result.systemPrompt).toContain('helpful learning assistant');
      expect(result.systemPrompt).toContain('DevPath');
      expect(result.systemPrompt).not.toContain('CONTEXT:'); // khong co structured sections
    });
  });

  // ─── extractKeyTopics (tested through buildContext) ─────────────────────

  describe('key topics extraction', () => {
    it('should extract bullet points from summary', async () => {
      // Summary co bullet points (- prefix) → tach thanh key topics
      prisma.lesson.findUnique.mockResolvedValue({
        ...mockLesson,
        summary: '- useState for state\n- useEffect for side effects\n- Custom hooks',
      });
      prisma.userLearningPath.findFirst.mockResolvedValue(mockUserLearningPath);

      const result = await builder.buildContext(mockUserId, mockLessonId);

      expect(result.context.lesson.keyTopics).toContain('useState for state');
      expect(result.context.lesson.keyTopics).toContain('useEffect for side effects');
      expect(result.context.lesson.keyTopics).toContain('Custom hooks');
    });

    it('should use comma split fallback when no bullet points', async () => {
      // Summary khong co bullet points → split by comma
      prisma.lesson.findUnique.mockResolvedValue({
        ...mockLesson,
        summary: 'React, JavaScript, TypeScript, Node.js',
      });
      prisma.userLearningPath.findFirst.mockResolvedValue(mockUserLearningPath);

      const result = await builder.buildContext(mockUserId, mockLessonId);

      expect(result.context.lesson.keyTopics).toContain('React');
      expect(result.context.lesson.keyTopics).toContain('JavaScript');
    });
  });
});
