// ai.service.ts - Shared AI service cho toat bo project
//
// Tai sao tach thanh shared module thay vi de trong onboarding?
// -> DRY: onboarding, ai-chat, quiz grading deu can goi AI API
// -> Single point of change: doi AI provider chi sua 1 file
// -> @Global() -> inject AiService o bat ky module nao
//
// Logic extract tu onboarding/recommendation/ai-client.ts (giu nguyen pattern)
// Khac biet: them options parameter (model, maxTokens) cho flexibility

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Message theo Anthropic message format.
 * role: 'user' | 'assistant'
 * content: noi dung tin nhan
 */
export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Request body gui len AI API (Anthropic-compatible format).
 */
interface AiRequestBody {
  model: string;
  max_tokens: number;
  system: string;
  messages: AiMessage[];
}

/**
 * Shape cua response tu AI API.
 * Chi lay phan content[0].text, bo qua cac field khac.
 */
interface AiApiResponse {
  content: Array<{ type: string; text: string }>;
}

/**
 * Options cho chat method - cho phep override model va maxTokens per-call.
 * Useful khi ai-chat module can dung model khac voi onboarding.
 */
export interface AiChatOptions {
  model?: string;
  maxTokens?: number;
}

// ── Model tier mapping ────────────────────────────────────────────────────────
//
// Map user tier -> danh sach models duoc phep su dung.
// free: models mien phi (Gemini Flash)
// pro: free + models tot hon (Claude Sonnet, Gemini Pro)
// ultra: pro + models manh nhat (Claude Opus)
//
// Tai sao dung Record<string, string[]> thay vi enum?
// -> Flexible: them tier moi chi can them key, khong can sua enum
// -> Default fallback = free cho unknown tier

const MODEL_TIERS: Record<string, string[]> = {
  free: ['gemini-2.5-flash', 'gemini-2.5-flash-thinking'],
  pro: [
    'gemini-2.5-flash',
    'gemini-2.5-flash-thinking',
    'claude-sonnet-4-5',
    'gemini-3-pro-low',
    'gemini-3-pro-high',
  ],
  ultra: [
    'gemini-2.5-flash',
    'gemini-2.5-flash-thinking',
    'claude-sonnet-4-5',
    'gemini-3-pro-low',
    'gemini-3-pro-high',
    'claude-opus-4-6-thinking',
  ],
};

// ── AiService class ──────────────────────────────────────────────────────────

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  // Timeout 30 giay — du cho recommendation va chat responses
  private readonly timeoutMs = 30_000;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'AI_BASE_URL',
      'https://manager.devteamos.me',
    );
    this.apiKey = this.configService.get<string>('AI_API_KEY', '');
    this.model = this.configService.get<string>('AI_MODEL', 'gemini-2.5-flash');
  }

  /**
   * Goi AI API voi system prompt + user message.
   * Tra ve text content cua AI response.
   *
   * @param systemPrompt - System instruction cho AI
   * @param userMessage - Noi dung user gui
   * @param options - Override model/maxTokens (optional)
   *   - model: default = this.model (tu env AI_MODEL)
   *   - maxTokens: default = 1024
   *
   * @throws Error neu network fail, timeout, hoac API tra loi HTTP
   */
  async chat(
    systemPrompt: string,
    userMessage: string,
    options?: AiChatOptions,
  ): Promise<string> {
    const url = `${this.baseUrl}/v1/messages`;

    const body: AiRequestBody = {
      model: options?.model ?? this.model,
      max_tokens: options?.maxTokens ?? 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    };

    // AbortController de implement timeout voi native fetch
    // fetch khong co built-in timeout -> phai dung AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          Authorization: `Bearer ${this.apiKey}`,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `AI API returned HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const data = (await response.json()) as AiApiResponse;

      const text = data.content?.[0]?.text;
      if (!text) {
        throw new Error('AI API response missing content text');
      }

      return text;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`AI API timeout after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Tra ve danh sach models ma user duoc phep su dung dua tren tier.
   *
   * @param userTier - 'free' | 'pro' | 'ultra'
   * @returns string[] - Danh sach model names
   *
   * Neu tier khong ton tai (unknown) -> fallback ve free tier.
   * Hien tai: tat ca users deu la 'free' (chua co field tier trong schema).
   */
  getAvailableModels(userTier: string): string[] {
    return MODEL_TIERS[userTier] ?? MODEL_TIERS['free'];
  }
}
