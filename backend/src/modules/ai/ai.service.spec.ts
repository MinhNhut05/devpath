// ai.service.spec.ts - Unit tests cho AiService (shared AI module)
//
// Mock: global.fetch (via jest.spyOn), ConfigService
// AiService dung native fetch de goi AI API -> mock fetch response
// ConfigService cung cap AI_BASE_URL, AI_API_KEY, AI_MODEL

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { AiService } from './ai.service.js';

// ── Mock data ──────────────────────────────────────────────────────────────

const mockBaseUrl = 'https://mock-ai-api.test';
const mockApiKey = 'test-api-key-123';
const mockModel = 'gemini-2.5-flash';

// Response thanh cong tu AI API (Anthropic-compatible format)
const mockAiResponse = {
  content: [{ type: 'text', text: 'Xin chao, toi la AI tro ly!' }],
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('AiService', () => {
  let service: AiService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                AI_BASE_URL: mockBaseUrl,
                AI_API_KEY: mockApiKey,
                AI_MODEL: mockModel,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);

    // Mock global.fetch — AiService dung native fetch (khong dung axios)
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => mockAiResponse,
    } as Response);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  // ─── chat() ─────────────────────────────────────────────────────────────

  describe('chat()', () => {
    it('should return AI response text on happy path', async () => {
      // Happy path: fetch OK → tra ve content[0].text
      const result = await service.chat('System prompt', 'Hello AI');

      expect(result).toBe('Xin chao, toi la AI tro ly!');
    });

    it('should call fetch with correct URL and headers', async () => {
      // Verify headers dung format Anthropic-compatible API
      await service.chat('System prompt', 'Hello AI');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, options] = fetchSpy.mock.calls[0];

      expect(url).toBe(`${mockBaseUrl}/v1/messages`);
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({
        'Content-Type': 'application/json',
        'x-api-key': mockApiKey,
        Authorization: `Bearer ${mockApiKey}`,
        'anthropic-version': '2023-06-01',
      });
    });

    it('should use custom model when provided in options', async () => {
      // User truyen model khac → dung model do thay vi default
      await service.chat('System prompt', 'Hello AI', {
        model: 'claude-sonnet-4-5',
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.model).toBe('claude-sonnet-4-5');
    });

    it('should use custom maxTokens when provided in options', async () => {
      // Override maxTokens de gioi han response length
      await service.chat('System prompt', 'Hello AI', { maxTokens: 2048 });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.max_tokens).toBe(2048);
    });

    it('should use default model and maxTokens when options not provided', async () => {
      // Khong truyen options → dung default tu env: AI_MODEL + maxTokens=1024
      await service.chat('System prompt', 'Hello AI');

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.model).toBe(mockModel);
      expect(body.max_tokens).toBe(1024);
    });

    it('should send correct request body with system prompt and user message', async () => {
      // Verify body gui len API dung format Anthropic messages
      await service.chat('You are a tutor', 'Explain React hooks');

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.system).toBe('You are a tutor');
      expect(body.messages).toEqual([
        { role: 'user', content: 'Explain React hooks' },
      ]);
    });

    it('should throw error when API returns HTTP error', async () => {
      // API tra ve 500 → throw Error voi status code
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as Response);

      await expect(service.chat('prompt', 'msg')).rejects.toThrow(
        'AI API returned HTTP 500: Internal Server Error',
      );
    });

    it('should throw error when response is missing content text', async () => {
      // API tra ve OK nhung content rong → throw error
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ content: [] }),
      } as Response);

      await expect(service.chat('prompt', 'msg')).rejects.toThrow(
        'AI API response missing content text',
      );
    });

    it('should throw timeout error when AbortError occurs', async () => {
      // Fetch bi abort (timeout) → throw readable error message
      // Dung Error voi name = 'AbortError' (giong nhu AbortController behavior trong Node.js)
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      fetchSpy.mockRejectedValueOnce(abortError);

      await expect(service.chat('prompt', 'msg')).rejects.toThrow(
        'AI API timeout after 30000ms',
      );
    });

    it('should re-throw non-abort errors as-is', async () => {
      // Network error khac (khong phai timeout) → throw nguyen error
      const networkError = new Error('Network failure');
      fetchSpy.mockRejectedValueOnce(networkError);

      await expect(service.chat('prompt', 'msg')).rejects.toThrow(
        'Network failure',
      );
    });
  });

  // ─── getAvailableModels() ───────────────────────────────────────────────

  describe('getAvailableModels()', () => {
    it('should return free tier models', () => {
      // Free tier: chi co Gemini Flash models
      const models = service.getAvailableModels('free');

      expect(models).toContain('gemini-2.5-flash');
      expect(models).toContain('gemini-2.5-flash-thinking');
      expect(models).toHaveLength(2);
    });

    it('should return pro tier models (includes free + more)', () => {
      // Pro tier: free models + Claude Sonnet, Gemini Pro
      const models = service.getAvailableModels('pro');

      expect(models).toContain('gemini-2.5-flash');
      expect(models).toContain('claude-sonnet-4-5');
      expect(models).toContain('gemini-3-pro-low');
      expect(models.length).toBeGreaterThan(2);
    });

    it('should return ultra tier models (includes all)', () => {
      // Ultra tier: tat ca models ke ca Claude Opus
      const models = service.getAvailableModels('ultra');

      expect(models).toContain('claude-opus-4-6-thinking');
      expect(models).toContain('claude-sonnet-4-5');
      expect(models).toContain('gemini-2.5-flash');
    });

    it('should fallback to free tier for unknown tier', () => {
      // Tier khong ton tai → fallback ve free tier (an toan)
      const models = service.getAvailableModels('unknown-tier');
      const freeModels = service.getAvailableModels('free');

      expect(models).toEqual(freeModels);
    });
  });
});
