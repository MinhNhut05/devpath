// ai-client.ts - Native fetch wrapper để gọi AI API (Anthropic-compatible)
//
// Tại sao native fetch thay vì axios/@anthropic-ai/sdk?
// → Node 18+ có sẵn fetch global → không cần install thêm package
// → API endpoint manager.devteamos.me dùng Anthropic-compatible format
// → Chỉ cần 1 POST request đơn giản, không cần toàn bộ SDK
//
// Tại sao tách file riêng thay vì inline trong builder?
// → Single Responsibility: ai-client chỉ lo HTTP, builder chỉ lo prompt
// → Reusable: branch 06 (AI Chat) có thể dùng lại AiClient sau này
// → Dễ mock khi viết unit test

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Message theo Anthropic message format.
 * role: 'user' | 'assistant'
 * content: nội dung tin nhắn
 */
export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Request body gửi lên AI API (Anthropic-compatible format).
 */
interface AiRequestBody {
  model: string;
  max_tokens: number;
  system: string;
  messages: AiMessage[];
}

/**
 * Shape của response từ AI API.
 * Chỉ lấy phần content[0].text, bỏ qua các field khác.
 */
interface AiApiResponse {
  content: Array<{ type: string; text: string }>;
}

// ── AiClient class ────────────────────────────────────────────────────────────

/**
 * AiClient: HTTP wrapper để gọi Anthropic-compatible AI API.
 *
 * Sử dụng:
 *   const client = new AiClient(configService)
 *   const text = await client.chat(systemPrompt, userMessage)
 *
 * Config đọc từ env:
 *   AI_BASE_URL  - Base URL của AI provider (vd: https://manager.devteamos.me)
 *   AI_API_KEY   - API key (vd: sk-xxx)
 *   AI_MODEL     - Model name (vd: gemini-2.5-flash)
 */
@Injectable() // NestJS DI container quản lý lifecycle của class này
              // → Cho phép inject vào constructor của Service khác
              // → ConfigService sẽ được auto-inject (vì ConfigModule isGlobal)
export class AiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  // Timeout 30 giây — onboarding recommendation không cần realtime
  private readonly timeoutMs = 30_000;

  constructor(private readonly configService: ConfigService) {
    // Lấy config từ env, có default fallback để tránh crash khi thiếu env
    this.baseUrl = this.configService.get<string>(
      'AI_BASE_URL',
      'https://manager.devteamos.me',
    );
    this.apiKey = this.configService.get<string>('AI_API_KEY', '');
    this.model = this.configService.get<string>('AI_MODEL', 'gemini-2.5-flash');
  }

  /**
   * Gọi AI API với system prompt + user message.
   * Trả về text content của AI response.
   *
   * @throws Error nếu network fail, timeout, hoặc API trả lỗi HTTP
   */
  async chat(systemPrompt: string, userMessage: string): Promise<string> {
    const url = `${this.baseUrl}/v1/messages`;

    const body: AiRequestBody = {
      model: this.model,
      max_tokens: 1024, // Đủ cho recommendation JSON, không cần lớn hơn
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    };

    // AbortController để implement timeout với native fetch
    // fetch không có built-in timeout → phải dùng AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          // Anthropic-compatible API cũng chấp nhận Authorization Bearer
          Authorization: `Bearer ${this.apiKey}`,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        // HTTP error (4xx, 5xx) → throw để service bắt và dùng fallback
        throw new Error(
          `AI API returned HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const data = (await response.json()) as AiApiResponse;

      // Lấy text từ content[0] — Anthropic format luôn trả về mảng content
      const text = data.content?.[0]?.text;
      if (!text) {
        throw new Error('AI API response missing content text');
      }

      return text;
    } catch (error: unknown) {
      // AbortError = timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`AI API timeout after ${this.timeoutMs}ms`);
      }
      // Re-throw các error khác để service xử lý
      throw error;
    } finally {
      // Luôn clear timeout để tránh memory leak
      clearTimeout(timeoutId);
    }
  }
}
