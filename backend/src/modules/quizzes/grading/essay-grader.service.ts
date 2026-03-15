// essay-grader.service.ts - AI-powered essay grading
//
// Service chấm điểm câu trả lời tự luận (ESSAY question type).
// Sử dụng AI API (Anthropic-compatible) qua manager.devteamos.me.
//
// Tại sao tách thành service riêng thay vì để trong QuizzesService?
// → Single Responsibility: QuizzesService lo orchestration, EssayGraderService lo AI grading
// → Dễ test: mock EssayGraderService trong unit tests
// → Dễ thay đổi: switch AI provider mà không ảnh hưởng quiz logic
//
// Tại sao KHÔNG import AiClient từ onboarding module?
// → AiClient thuộc onboarding module — không phải shared utility
// → Tránh cross-module coupling không cần thiết
// → Essay grading cần max_tokens khác (512 vs 1024) + timeout riêng
// → Viết fetch inline đơn giản hơn, dễ maintain hơn trong context này

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../../prisma/index.js';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Kết quả chấm điểm từ AI.
 * score: 0-100 (integer)
 * feedback: nhận xét bằng tiếng Việt
 */
interface GradingResult {
  score: number;
  feedback: string;
}

/**
 * Shape của response từ Anthropic-compatible AI API.
 * Chỉ lấy content[0].text.
 */
interface AiApiResponse {
  content: Array<{ type: string; text: string }>;
}

// ── EssayGraderService ────────────────────────────────────────────────────────

/**
 * EssayGraderService: Chấm điểm câu trả lời tự luận bằng AI.
 *
 * Flow:
 *   1. Build system prompt (grading rubric + JSON format)
 *   2. Build user message (question + reference answer + student answer)
 *   3. Gọi AI API (native fetch, 30s timeout)
 *   4. Parse JSON response → { score, feedback }
 *   5. Log AIInteractionLog (fire-and-forget)
 *   6. Update AIUsageQuota (fire-and-forget)
 *   7. Return { score, feedback }
 *
 * Error handling: KHÔNG throw — luôn trả về fallback { score: 0, feedback: '...' }
 * để không làm gián đoạn quiz flow khi AI gặp sự cố.
 */
@Injectable()
export class EssayGraderService {
  private readonly logger = new Logger(EssayGraderService.name);

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  // Timeout 30 giây — đủ cho essay grading, không block UX quá lâu
  private readonly timeoutMs = 30_000;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'AI_BASE_URL',
      'https://manager.devteamos.me',
    );
    this.apiKey = this.configService.get<string>('AI_API_KEY', '');
    this.model = this.configService.get<string>('AI_MODEL', 'gemini-2.5-flash');
  }

  /**
   * Chấm điểm essay answer bằng AI.
   *
   * @param questionText - Đề bài (context cho AI)
   * @param correctAnswer - Đáp án mẫu (nullable — nếu có, AI dùng làm rubric)
   * @param explanation - Giải thích thêm (nullable — context bổ sung cho AI)
   * @param userAnswer - Câu trả lời của user
   * @param userId - ID của user (dùng để log + update quota)
   * @returns { score: 0-100, feedback: string } — điểm + nhận xét từ AI
   *
   * KHÔNG throw — luôn trả về fallback nếu AI gặp sự cố.
   */
  async gradeEssay(
    questionText: string,
    correctAnswer: string | null,
    explanation: string | null,
    userAnswer: string,
    userId: string,
  ): Promise<{ score: number; feedback: string }> {
    // ── Step 1: Build system prompt ─────────────────────────────────────────
    //
    // Rubric rõ ràng giúp AI chấm nhất quán hơn.
    // Yêu cầu JSON output để parse programmatically.
    const systemPrompt = `Bạn là giáo viên chấm bài tự luận cho học viên IT tại Việt Nam.
Nhiệm vụ: Đọc câu hỏi, đáp án mẫu (nếu có), và bài làm của học viên, sau đó chấm điểm.

Rubric chấm điểm:
- 90-100: Trả lời đầy đủ, chính xác, có ví dụ hoặc giải thích rõ ràng
- 70-89: Trả lời đúng ý chính nhưng thiếu chi tiết hoặc ví dụ
- 50-69: Trả lời đúng một phần, có hiểu biết cơ bản nhưng còn thiếu sót
- 30-49: Trả lời sơ sài, thiếu nhiều nội dung quan trọng
- 0-29: Không trả lời hoặc hoàn toàn sai

Yêu cầu output (JSON thuần, không markdown, không giải thích thêm):
{
  "score": <số nguyên 0-100>,
  "feedback": "<nhận xét ngắn gọn bằng tiếng Việt, tối đa 200 từ, nêu điểm tốt và cần cải thiện>"
}`;

    // ── Step 2: Build user message ──────────────────────────────────────────
    //
    // Cung cấp đủ context để AI chấm chính xác:
    // - Câu hỏi (bắt buộc)
    // - Đáp án mẫu (optional — nếu null thì AI tự đánh giá theo kiến thức)
    // - Giải thích (optional — context bổ sung)
    // - Bài làm của học viên (bắt buộc)
    const referenceSection =
      correctAnswer != null
        ? `\n\nĐÁP ÁN MẪU:\n${correctAnswer}`
        : '\n\n(Không có đáp án mẫu — chấm dựa trên kiến thức kỹ thuật)';

    const explanationSection =
      explanation != null ? `\n\nGIẢI THÍCH BỔ SUNG:\n${explanation}` : '';

    const userMessage = `CÂU HỎI:\n${questionText}${referenceSection}${explanationSection}\n\nBÀI LÀM CỦA HỌC VIÊN:\n${userAnswer}`;

    // ── Step 3: Gọi AI API ──────────────────────────────────────────────────
    //
    // Đo responseTimeMs để log vào AIInteractionLog.
    const startTime = Date.now();
    let rawText = '';
    let aiError: Error | null = null;

    try {
      rawText = await this.callAiApi(systemPrompt, userMessage);
    } catch (error: unknown) {
      aiError = error instanceof Error ? error : new Error(String(error));
    }

    const responseTimeMs = Date.now() - startTime;

    // ── Step 4: Parse JSON response ─────────────────────────────────────────
    //
    // AI có thể wrap JSON trong markdown code block → strip trước khi parse.
    // Validate: score phải là number 0-100, feedback phải là string.
    let result: GradingResult;

    if (aiError != null) {
      // AI call failed — trả fallback phù hợp với loại lỗi
      const isTimeout =
        aiError.message.includes('timeout') ||
        aiError.message.includes('AbortError');

      result = {
        score: 0,
        feedback: isTimeout
          ? 'Hệ thống AI đang bận, không thể chấm bài tự động. Vui lòng thử lại sau.'
          : 'Không thể chấm điểm tự động lúc này. Vui lòng thử lại sau.',
      };

      this.logger.warn(
        `AI call failed for userId=${userId}: ${aiError.message}`,
      );
    } else {
      result = this.parseGradingResponse(rawText);
    }

    // ── Step 5: Log AIInteractionLog (fire-and-forget) ──────────────────────
    //
    // Ước tính tokens: (prompt + response) / 4 (rule of thumb: 1 token ≈ 4 chars)
    // Fire-and-forget: không await để không delay response cho user.
    // Dùng .catch() để log lỗi mà không crash service.
    const estimatedTokens = Math.ceil(
      (systemPrompt.length + userMessage.length + rawText.length) / 4,
    );

    this.prisma.aIInteractionLog
      .create({
        data: {
          userId,
          sessionContext: 'quiz',
          questionSummary: questionText.slice(0, 500), // VarChar(500) limit
          responseSummary: result.feedback.slice(0, 500), // VarChar(500) limit
          tokensUsed: estimatedTokens,
          modelUsed: this.model,
          responseTimeMs,
        },
      })
      .catch((err: unknown) => {
        this.logger.error('Failed to log AI interaction', err);
      });

    // ── Step 6: Update AIUsageQuota (fire-and-forget) ───────────────────────
    //
    // Upsert daily quota: tạo mới nếu chưa có, increment nếu đã có.
    // setHours(0,0,0,0) → normalize về đầu ngày để match @db.Date trong Prisma.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.prisma.aIUsageQuota
      .upsert({
        where: { userId_date: { userId, date: today } },
        create: { userId, date: today, usedCount: 1 },
        update: { usedCount: { increment: 1 } },
      })
      .catch((err: unknown) => {
        this.logger.error('Failed to update AI usage quota', err);
      });

    // ── Step 7: Return result ───────────────────────────────────────────────
    return result;
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Gọi Anthropic-compatible AI API.
   * Native fetch + AbortController timeout 30s.
   *
   * @throws Error nếu timeout, HTTP error, hoặc response không hợp lệ
   */
  private async callAiApi(
    systemPrompt: string,
    userMessage: string,
  ): Promise<string> {
    const url = `${this.baseUrl}/v1/messages`;

    const body = {
      model: this.model,
      max_tokens: 512, // Essay feedback ngắn gọn, 512 là đủ
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    };

    // AbortController để implement timeout với native fetch
    // Node 18+ fetch không có built-in timeout option
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
      // AbortError = request bị cancel do timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`AI API timeout after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      // Luôn clear timeout để tránh memory leak
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse JSON response từ AI và validate.
   *
   * AI đôi khi wrap JSON trong markdown code block (```json ... ```)
   * → Strip trước khi parse.
   *
   * Validation:
   * - score phải là number trong [0, 100] → clamp nếu out of range
   * - feedback phải là string non-empty
   *
   * Fallback nếu parse fail: { score: 0, feedback: 'Không thể chấm điểm...' }
   */
  private parseGradingResponse(rawText: string): GradingResult {
    try {
      // Strip markdown code block nếu có: ```json ... ``` hoặc ``` ... ```
      const stripped = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();

      const parsed = JSON.parse(stripped) as unknown;

      // Type guard: validate shape
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('score' in parsed) ||
        !('feedback' in parsed)
      ) {
        throw new Error('Invalid response shape: missing score or feedback');
      }

      const { score, feedback } = parsed as { score: unknown; feedback: unknown };

      if (typeof score !== 'number' || typeof feedback !== 'string') {
        throw new Error('Invalid response types: score must be number, feedback must be string');
      }

      if (!feedback.trim()) {
        throw new Error('Empty feedback string');
      }

      // Clamp score về [0, 100] — AI đôi khi trả số ngoài range
      const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

      return { score: clampedScore, feedback: feedback.trim() };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to parse AI grading response: ${errMsg}`, {
        rawText: rawText.slice(0, 200), // Log 200 chars đầu để debug
      });

      return {
        score: 0,
        feedback:
          'Không thể chấm điểm tự động lúc này. Vui lòng liên hệ giáo viên để được hỗ trợ.',
      };
    }
  }
}
