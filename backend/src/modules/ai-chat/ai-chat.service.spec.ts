// ai-chat.service.spec.ts - Unit tests cho AiChatService
//
// Mock: PrismaService (aIInteractionLog, aIUsageQuota), AiService, ConfigService, AiContextBuilder
// Test tat ca methods: chat(), getQuota(), getChatHistory(), getModels(), checkAndUpdateQuota()

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/index.js';
import { AiService } from '../ai/index.js';
import { AiContextBuilder } from './context/index.js';
import { AiChatService } from './ai-chat.service.js';

// ── Mock data ──────────────────────────────────────────────────────────────

const mockUserId = 'user-uuid-123';
const mockLessonId = 'lesson-uuid-456';

const mockChatDto = {
  message: 'Explain React hooks',
  model: undefined as string | undefined,
  lessonId: undefined as string | undefined,
};

const mockContextResult = {
  systemPrompt: 'You are a helpful learning assistant...',
  context: {
    user: {
      learningPath: 'Frontend',
      currentTrack: 'React',
      currentLesson: 'React Hooks',
      completedLessons: ['HTML Basics'],
      recentQuizScores: [{ lesson: 'HTML Basics', score: 80 }],
    },
    lesson: { title: 'React Hooks', summary: 'Learn hooks', keyTopics: ['useState'] },
    previousLessons: [{ title: 'HTML Basics', summary: 'HTML fundamentals' }],
  },
};

const mockInteractionLog = {
  id: 'log-uuid-789',
  userId: mockUserId,
  lessonId: null,
  sessionContext: 'general',
  questionSummary: 'Explain React hooks',
  responseSummary: 'React hooks la...',
  tokensUsed: 10,
  modelUsed: 'gemini-2.5-flash',
  responseTimeMs: 500,
  createdAt: new Date('2026-03-16T10:00:00.000Z'),
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('AiChatService', () => {
  let service: AiChatService;
  let prisma: any;
  let aiService: any;
  let contextBuilder: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      aIInteractionLog: {
        create: jest.fn().mockResolvedValue(mockInteractionLog),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      aIUsageQuota: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    aiService = {
      chat: jest.fn().mockResolvedValue('React hooks la cach su dung state trong functional component.'),
      getAvailableModels: jest.fn().mockReturnValue(['gemini-2.5-flash', 'gemini-2.5-flash-thinking']),
    };

    contextBuilder = {
      buildContext: jest.fn().mockResolvedValue(mockContextResult),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: AiService, useValue: aiService },
        { provide: AiContextBuilder, useValue: contextBuilder },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'AI_MODEL') return 'gemini-2.5-flash';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AiChatService>(AiChatService);
  });

  // ─── chat() ─────────────────────────────────────────────────────────────

  describe('chat()', () => {
    it('should return AI response on happy path', async () => {
      // Happy path: quota OK, context built, AI responds → tra ve message + model
      const result = await service.chat(mockUserId, { ...mockChatDto });

      expect(result).toEqual({
        message: 'React hooks la cach su dung state trong functional component.',
        model: 'gemini-2.5-flash',
        context: 'general',
      });
    });

    it('should check quota BEFORE calling AI', async () => {
      // Dam bao thu tu: quota check → context build → AI call
      // Neu quota check fail → khong goi AI (tiet kiem resource)
      const callOrder: string[] = [];

      prisma.aIUsageQuota.findUnique.mockImplementation(async () => {
        callOrder.push('quotaCheck');
        return null; // chua co record → con quota
      });
      prisma.aIUsageQuota.upsert.mockImplementation(async () => {
        callOrder.push('quotaUpsert');
        return {};
      });
      contextBuilder.buildContext.mockImplementation(async () => {
        callOrder.push('buildContext');
        return mockContextResult;
      });
      aiService.chat.mockImplementation(async () => {
        callOrder.push('aiChat');
        return 'response';
      });

      await service.chat(mockUserId, { ...mockChatDto });

      // quotaCheck phai xay ra truoc buildContext va aiChat
      expect(callOrder.indexOf('quotaCheck')).toBeLessThan(callOrder.indexOf('buildContext'));
      expect(callOrder.indexOf('quotaCheck')).toBeLessThan(callOrder.indexOf('aiChat'));
    });

    it('should throw BadRequestException when quota exceeded', async () => {
      // User da het quota → throw ngay, khong goi AI
      prisma.aIUsageQuota.findUnique.mockResolvedValue({
        usedCount: 10,
        maxCount: 10,
      });

      await expect(service.chat(mockUserId, { ...mockChatDto })).rejects.toThrow(
        BadRequestException,
      );
      // AI khong duoc goi khi het quota
      expect(aiService.chat).not.toHaveBeenCalled();
    });

    it('should use model from dto when provided and valid', async () => {
      // User chi dinh model → validate xem co trong tier khong
      aiService.getAvailableModels.mockReturnValue(['gemini-2.5-flash', 'gemini-2.5-flash-thinking']);

      const result = await service.chat(mockUserId, {
        ...mockChatDto,
        model: 'gemini-2.5-flash-thinking',
      });

      expect(result.model).toBe('gemini-2.5-flash-thinking');
      expect(aiService.chat).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { model: 'gemini-2.5-flash-thinking' },
      );
    });

    it('should throw BadRequestException when model not available for tier', async () => {
      // User chi dinh model khong co trong tier → throw
      aiService.getAvailableModels.mockReturnValue(['gemini-2.5-flash']);

      await expect(
        service.chat(mockUserId, { ...mockChatDto, model: 'claude-opus-4-6-thinking' }),
      ).rejects.toThrow('Model not available for your tier');
    });

    it('should use default model when dto.model not provided', async () => {
      // Khong truyen model → dung AI_MODEL tu env (gemini-2.5-flash)
      const result = await service.chat(mockUserId, {
        ...mockChatDto,
        model: undefined,
      });

      expect(result.model).toBe('gemini-2.5-flash');
    });

    it('should pass lessonId to contextBuilder', async () => {
      // Khi user chat trong context 1 bai hoc → truyen lessonId de build context
      await service.chat(mockUserId, {
        ...mockChatDto,
        lessonId: mockLessonId,
      });

      expect(contextBuilder.buildContext).toHaveBeenCalledWith(mockUserId, mockLessonId);
    });

    it('should return fallback when AI call fails', async () => {
      // AI API fail → tra ve fallback message, khong throw error ra ngoai
      aiService.chat.mockRejectedValue(new Error('AI API timeout'));

      const result = await service.chat(mockUserId, { ...mockChatDto });

      expect(result).toEqual({
        message: 'H\u1EC7 th\u1ED1ng AI \u0111ang b\u1EADn. Vui l\u00F2ng th\u1EED l\u1EA1i sau.',
        model: null,
        fallback: true,
      });
    });

    it('should log interaction to AIInteractionLog', async () => {
      // Sau khi AI tra loi → luu log vao DB
      await service.chat(mockUserId, { ...mockChatDto });

      expect(prisma.aIInteractionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          sessionContext: 'general',
          questionSummary: expect.any(String),
          responseSummary: expect.any(String),
          tokensUsed: expect.any(Number),
          modelUsed: 'gemini-2.5-flash',
          responseTimeMs: expect.any(Number),
        }),
      });
    });

    it('should set sessionContext to "lesson" when lessonId provided', async () => {
      // Chat trong context bai hoc → sessionContext = 'lesson'
      await service.chat(mockUserId, {
        ...mockChatDto,
        lessonId: mockLessonId,
      });

      expect(prisma.aIInteractionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionContext: 'lesson',
          lessonId: mockLessonId,
        }),
      });
    });

    it('should set sessionContext to "general" when no lessonId', async () => {
      // Chat khong co context → sessionContext = 'general'
      await service.chat(mockUserId, {
        ...mockChatDto,
        lessonId: undefined,
      });

      expect(prisma.aIInteractionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionContext: 'general',
          lessonId: null,
        }),
      });
    });
  });

  // ─── getQuota() ─────────────────────────────────────────────────────────

  describe('getQuota()', () => {
    it('should return default values when no quota record exists today', async () => {
      // Chua co record hom nay → used=0, max=10, remaining=10
      prisma.aIUsageQuota.findUnique.mockResolvedValue(null);

      const result = await service.getQuota(mockUserId);

      expect(result.used).toBe(0);
      expect(result.max).toBe(10);
      expect(result.remaining).toBe(10);
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // format YYYY-MM-DD
    });

    it('should return partial used quota', async () => {
      // Da dung 3/10 → remaining = 7
      prisma.aIUsageQuota.findUnique.mockResolvedValue({
        usedCount: 3,
        maxCount: 10,
      });

      const result = await service.getQuota(mockUserId);

      expect(result.used).toBe(3);
      expect(result.max).toBe(10);
      expect(result.remaining).toBe(7);
    });

    it('should return fully used quota', async () => {
      // Da dung het 10/10 → remaining = 0
      prisma.aIUsageQuota.findUnique.mockResolvedValue({
        usedCount: 10,
        maxCount: 10,
      });

      const result = await service.getQuota(mockUserId);

      expect(result.used).toBe(10);
      expect(result.remaining).toBe(0);
    });

    it('should not return negative remaining', async () => {
      // Edge case: usedCount > maxCount (race condition) → remaining = 0, khong am
      prisma.aIUsageQuota.findUnique.mockResolvedValue({
        usedCount: 15,
        maxCount: 10,
      });

      const result = await service.getQuota(mockUserId);

      expect(result.remaining).toBe(0);
    });
  });

  // ─── getChatHistory() ───────────────────────────────────────────────────

  describe('getChatHistory()', () => {
    it('should return items and pagination info', async () => {
      // Happy path: co data → tra ve items + total + hasMore
      const mockItems = [mockInteractionLog];
      prisma.aIInteractionLog.findMany.mockResolvedValue(mockItems);
      prisma.aIInteractionLog.count.mockResolvedValue(1);

      const result = await service.getChatHistory(mockUserId, { limit: 20, offset: 0 });

      expect(result.items).toEqual(mockItems);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should return hasMore=true when more items exist', async () => {
      // Co 50 items, lay 20 → hasMore = true
      const mockItems = Array.from({ length: 20 }, (_, i) => ({
        ...mockInteractionLog,
        id: `log-${i}`,
      }));
      prisma.aIInteractionLog.findMany.mockResolvedValue(mockItems);
      prisma.aIInteractionLog.count.mockResolvedValue(50);

      const result = await service.getChatHistory(mockUserId, { limit: 20, offset: 0 });

      expect(result.hasMore).toBe(true);
    });

    it('should pass correct skip/take to Prisma', async () => {
      // Verify pagination params truyen dung cho Prisma
      prisma.aIInteractionLog.findMany.mockResolvedValue([]);
      prisma.aIInteractionLog.count.mockResolvedValue(0);

      await service.getChatHistory(mockUserId, { limit: 10, offset: 5 });

      expect(prisma.aIInteractionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId },
          skip: 5,
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should use default values when query params not provided', async () => {
      // Khong truyen limit/offset → dung default (20/0)
      prisma.aIInteractionLog.findMany.mockResolvedValue([]);
      prisma.aIInteractionLog.count.mockResolvedValue(0);

      const result = await service.getChatHistory(mockUserId, {} as any);

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });
  });

  // ─── getModels() ────────────────────────────────────────────────────────

  describe('getModels()', () => {
    it('should return tier and available models', async () => {
      // Tra ve tier hien tai + danh sach models
      const result = await service.getModels(mockUserId);

      expect(result).toEqual({
        tier: 'free',
        models: ['gemini-2.5-flash', 'gemini-2.5-flash-thinking'],
      });
    });

    it('should call getAvailableModels with correct tier', async () => {
      // Verify goi AiService.getAvailableModels dung tier
      await service.getModels(mockUserId);

      expect(aiService.getAvailableModels).toHaveBeenCalledWith('free');
    });
  });

  // ─── checkAndUpdateQuota() ──────────────────────────────────────────────

  describe('checkAndUpdateQuota()', () => {
    it('should upsert quota when no existing record (first use today)', async () => {
      // Chua co record hom nay → upsert tao moi voi usedCount=1
      prisma.aIUsageQuota.findUnique.mockResolvedValue(null);

      await service.checkAndUpdateQuota(mockUserId);

      expect(prisma.aIUsageQuota.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId_date: expect.objectContaining({
              userId: mockUserId,
            }),
          }),
          create: expect.objectContaining({
            userId: mockUserId,
            usedCount: 1,
            maxCount: 10,
          }),
          update: expect.objectContaining({
            usedCount: { increment: 1 },
          }),
        }),
      );
    });

    it('should throw BadRequestException when quota exceeded', async () => {
      // Da dung het quota → throw, khong goi upsert
      prisma.aIUsageQuota.findUnique.mockResolvedValue({
        usedCount: 10,
        maxCount: 10,
      });

      await expect(service.checkAndUpdateQuota(mockUserId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.checkAndUpdateQuota(mockUserId)).rejects.toThrow(
        'Daily AI quota exceeded',
      );
      expect(prisma.aIUsageQuota.upsert).not.toHaveBeenCalled();
    });

    it('should increment usedCount when quota still available', async () => {
      // Con quota → upsert voi increment (5/10 → 6/10)
      prisma.aIUsageQuota.findUnique.mockResolvedValue({
        usedCount: 5,
        maxCount: 10,
      });

      await service.checkAndUpdateQuota(mockUserId);

      expect(prisma.aIUsageQuota.upsert).toHaveBeenCalledTimes(1);
    });

    it('should use composite key userId_date in where clause', async () => {
      // Verify composite key userId + date (dau ngay UTC)
      prisma.aIUsageQuota.findUnique.mockResolvedValue(null);

      await service.checkAndUpdateQuota(mockUserId);

      const findCall = prisma.aIUsageQuota.findUnique.mock.calls[0][0];
      expect(findCall.where.userId_date).toBeDefined();
      expect(findCall.where.userId_date.userId).toBe(mockUserId);
      // date phai la dau ngay UTC (00:00:00.000Z)
      const date = findCall.where.userId_date.date as Date;
      expect(date.getUTCHours()).toBe(0);
      expect(date.getUTCMinutes()).toBe(0);
      expect(date.getUTCSeconds()).toBe(0);
    });
  });
});
