import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../../prisma/index.js';
import { EssayGraderService } from './essay-grader.service.js';

describe('EssayGraderService', () => {
  let service: EssayGraderService;
  let prisma: any;
  let configService: { get: jest.Mock };
  let fetchMock: jest.Mock;

  const userId = 'user-uuid-123';
  const questionText = 'Explain semantic HTML.';
  const correctAnswer = 'Semantic HTML uses meaningful tags.';
  const explanation = 'It improves accessibility and SEO.';
  const userAnswer = 'Semantic HTML makes content structure more meaningful.';

  const createFetchResponse = (text: string) => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn().mockResolvedValue({
      content: [{ type: 'text', text }],
    }),
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      aIInteractionLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
      aIUsageQuota: {
        upsert: jest.fn().mockResolvedValue({ id: 'quota-1' }),
      },
    };

    configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const values: Record<string, string> = {
          AI_BASE_URL: 'https://manager.devteamos.me',
          AI_API_KEY: 'test-ai-key',
          AI_MODEL: 'gemini-2.5-flash',
        };
        return values[key] ?? defaultValue;
      }),
    };

    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EssayGraderService,
        { provide: ConfigService, useValue: configService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<EssayGraderService>(EssayGraderService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return score and feedback when AI returns valid JSON', async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse(
        JSON.stringify({
          score: 88,
          feedback: 'Bài làm đúng ý chính và có giải thích rõ ràng.',
        }),
      ),
    );

    const result = await service.gradeEssay(
      questionText,
      correctAnswer,
      explanation,
      userAnswer,
      userId,
    );

    expect(result).toEqual({
      score: 88,
      feedback: 'Bài làm đúng ý chính và có giải thích rõ ràng.',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://manager.devteamos.me/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-api-key': 'test-ai-key',
          Authorization: 'Bearer test-ai-key',
        }),
      }),
    );
  });

  it('should strip markdown code fences and parse wrapped JSON correctly', async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse(
        '```json\n{\n  "score": 91,\n  "feedback": "Bài làm tốt, chỉ cần thêm ví dụ cụ thể."\n}\n```',
      ),
    );

    const result = await service.gradeEssay(
      questionText,
      correctAnswer,
      explanation,
      userAnswer,
      userId,
    );

    expect(result).toEqual({
      score: 91,
      feedback: 'Bài làm tốt, chỉ cần thêm ví dụ cụ thể.',
    });
  });

  it('should return parse fallback when AI returns invalid JSON', async () => {
    fetchMock.mockResolvedValue(createFetchResponse('not-json-response'));

    const result = await service.gradeEssay(
      questionText,
      correctAnswer,
      explanation,
      userAnswer,
      userId,
    );

    expect(result).toEqual({
      score: 0,
      feedback:
        'Không thể chấm điểm tự động lúc này. Vui lòng liên hệ giáo viên để được hỗ trợ.',
    });
  });

  it('should return timeout fallback when AI request times out', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    fetchMock.mockRejectedValue(abortError);

    const result = await service.gradeEssay(
      questionText,
      correctAnswer,
      explanation,
      userAnswer,
      userId,
    );

    expect(result).toEqual({
      score: 0,
      feedback:
        'Hệ thống AI đang bận, không thể chấm bài tự động. Vui lòng thử lại sau.',
    });
  });

  it('should return generic fallback when AI API responds with HTTP 500', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const result = await service.gradeEssay(
      questionText,
      correctAnswer,
      explanation,
      userAnswer,
      userId,
    );

    expect(result).toEqual({
      score: 0,
      feedback: 'Không thể chấm điểm tự động lúc này. Vui lòng thử lại sau.',
    });
  });

  it('should clamp score to 100 when AI returns a score above range', async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse(
        JSON.stringify({
          score: 120,
          feedback: 'Điểm được AI trả quá cao.',
        }),
      ),
    );

    const result = await service.gradeEssay(
      questionText,
      correctAnswer,
      explanation,
      userAnswer,
      userId,
    );

    expect(result).toEqual({
      score: 100,
      feedback: 'Điểm được AI trả quá cao.',
    });
  });

  it('should clamp score to 0 when AI returns a score below range', async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse(
        JSON.stringify({
          score: -5,
          feedback: 'Điểm âm là không hợp lệ.',
        }),
      ),
    );

    const result = await service.gradeEssay(
      questionText,
      correctAnswer,
      explanation,
      userAnswer,
      userId,
    );

    expect(result).toEqual({
      score: 0,
      feedback: 'Điểm âm là không hợp lệ.',
    });
  });

  it('should call AIInteractionLog.create without awaiting it', async () => {
    const pendingPromise = new Promise(() => undefined);
    prisma.aIInteractionLog.create.mockReturnValue(pendingPromise);
    prisma.aIUsageQuota.upsert.mockResolvedValue({ id: 'quota-2' });
    fetchMock.mockResolvedValue(
      createFetchResponse(
        JSON.stringify({
          score: 75,
          feedback: 'Bài làm ổn.',
        }),
      ),
    );

    const result = await service.gradeEssay(
      questionText,
      correctAnswer,
      explanation,
      userAnswer,
      userId,
    );

    expect(result).toEqual({
      score: 75,
      feedback: 'Bài làm ổn.',
    });
    expect(prisma.aIInteractionLog.create).toHaveBeenCalledTimes(1);
    expect(prisma.aIInteractionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        sessionContext: 'quiz',
        questionSummary: questionText,
        responseSummary: 'Bài làm ổn.',
        modelUsed: 'gemini-2.5-flash',
      }),
    });
  });

  it("should upsert AIUsageQuota using today's date at midnight", async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse(
        JSON.stringify({
          score: 82,
          feedback: 'Câu trả lời khá tốt.',
        }),
      ),
    );

    await service.gradeEssay(
      questionText,
      correctAnswer,
      explanation,
      userAnswer,
      userId,
    );

    expect(prisma.aIUsageQuota.upsert).toHaveBeenCalledTimes(1);

    const upsertArg = prisma.aIUsageQuota.upsert.mock.calls[0][0];
    const dateArg = upsertArg.where.userId_date.date as Date;

    expect(dateArg).toBeInstanceOf(Date);
    expect(dateArg.getHours()).toBe(0);
    expect(dateArg.getMinutes()).toBe(0);
    expect(dateArg.getSeconds()).toBe(0);
    expect(dateArg.getMilliseconds()).toBe(0);
    expect(upsertArg).toEqual({
      where: {
        userId_date: {
          userId,
          date: dateArg,
        },
      },
      create: {
        userId,
        date: dateArg,
        usedCount: 1,
      },
      update: {
        usedCount: { increment: 1 },
      },
    });
  });
});
