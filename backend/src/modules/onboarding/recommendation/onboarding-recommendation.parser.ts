// onboarding-recommendation.parser.ts - Parse AI JSON response thành structured data
//
// Tại sao cần parser riêng?
// → AI không phải lúc nào cũng trả về JSON hoàn hảo
// → Parser handle defensive: thiếu field, sai type, extra whitespace
// → Trả về null nếu không parse được → service dùng fallback
//
// Tại sao trả về null thay vì throw?
// → Service cần biết "parse thành công hay không" để quyết định dùng fallback
// → Throw sẽ bị catch cùng với network error → khó debug
// → null rõ ràng hơn: "AI respond nhưng format sai"

import { VALID_PATH_SLUGS } from './onboarding-prompt.builder.js';

// ── RecommendationResult (shared type) ───────────────────────────────────────

/**
 * Shape của recommendation result — contract giữa recommendation engine và service.
 *
 * source: 'ai' khi parse thành công, 'fallback' khi dùng rule-based fallback
 * primaryPath: slug của learning path được recommend chính
 * alternativePaths: các slug khác có thể phù hợp (có thể rỗng)
 * reason: lý do AI chọn path này (tiếng Việt)
 * focusAreas: các topic user nên tập trung (dựa trên prior knowledge gap)
 * tips: lời khuyên học tập cá nhân hóa
 */
export interface RecommendationResult {
  source: 'ai' | 'fallback';
  primaryPath: string;
  alternativePaths: string[];
  reason: string;
  focusAreas: string[];
  tips: string[];
}

// ── Internal type để validate AI JSON ────────────────────────────────────────

/**
 * Shape mong đợi từ AI JSON response.
 * Dùng unknown để force explicit type checking trước khi dùng.
 */
interface RawAiJson {
  primaryPath: unknown;
  alternativePaths: unknown;
  reason: unknown;
  focusAreas: unknown;
  tips: unknown;
}

// ── Parser function ───────────────────────────────────────────────────────────

/**
 * Parse raw AI response string thành RecommendationResult.
 *
 * Trả về null nếu:
 * - Không thể JSON.parse (AI trả về non-JSON)
 * - primaryPath không phải string hoặc không trong VALID_PATH_SLUGS
 * - reason không phải string
 *
 * Normalize (không trả null):
 * - alternativePaths: nếu không phải array → dùng []
 * - focusAreas: nếu không phải array string → dùng []
 * - tips: nếu không phải array string → dùng []
 *
 * @example
 * const result = parseRecommendation(rawText)
 * if (result === null) {
 *   // AI trả về format sai → dùng fallback
 * }
 */
export function parseRecommendation(raw: string): RecommendationResult | null {
  // ── Bước 1: Làm sạch raw string ───────────────────────────────────────────
  // AI đôi khi thêm whitespace, newline đầu/cuối
  // Nếu AI vẫn wrap trong ```json...``` dù đã dặn không → strip ra
  const cleaned = extractJsonString(raw.trim());

  // ── Bước 2: JSON.parse ────────────────────────────────────────────────────
  let parsed: RawAiJson;
  try {
    parsed = JSON.parse(cleaned) as RawAiJson;
  } catch {
    // AI không trả về valid JSON → null
    return null;
  }

  // ── Bước 3: Validate primaryPath (critical field) ─────────────────────────
  if (typeof parsed.primaryPath !== 'string') {
    return null;
  }

  // primaryPath phải nằm trong danh sách slug hợp lệ
  // Normalize: trim và lowercase để tránh lỗi do AI thêm khoảng trắng
  const primaryPath = parsed.primaryPath.trim().toLowerCase();
  if (!VALID_PATH_SLUGS.includes(primaryPath)) {
    return null;
  }

  // ── Bước 4: Validate reason (critical field) ──────────────────────────────
  if (typeof parsed.reason !== 'string' || parsed.reason.trim() === '') {
    return null;
  }

  // ── Bước 5: Normalize optional array fields ───────────────────────────────
  // Không return null nếu thiếu → dùng default rỗng

  const alternativePaths = normalizeStringArray(parsed.alternativePaths)
    // Filter chỉ giữ slugs hợp lệ, loại bỏ slug không tồn tại
    .filter((slug) => VALID_PATH_SLUGS.includes(slug))
    // Loại bỏ primaryPath nếu AI nhầm đưa vào alternativePaths
    .filter((slug) => slug !== primaryPath);

  const focusAreas = normalizeStringArray(parsed.focusAreas);
  const tips = normalizeStringArray(parsed.tips);

  // ── Bước 6: Return validated result ──────────────────────────────────────
  return {
    source: 'ai',
    primaryPath,
    alternativePaths,
    reason: parsed.reason.trim(),
    focusAreas,
    tips,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Nếu AI vẫn wrap JSON trong ```json...``` block → extract phần JSON thuần.
 * Nếu không tìm thấy code block → trả về nguyên string để JSON.parse thử.
 *
 * @example
 * extractJsonString('```json\n{"foo": "bar"}\n```') → '{"foo": "bar"}'
 * extractJsonString('{"foo": "bar"}') → '{"foo": "bar"}'
 */
function extractJsonString(raw: string): string {
  // Match ```json...``` hoặc ```...```
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch?.[1]) {
    return codeBlockMatch[1].trim();
  }
  return raw;
}

/**
 * Normalize một giá trị unknown thành string[].
 * Nếu không phải array → trả về []
 * Nếu là array → filter lấy phần tử là string, trim whitespace
 *
 * @example
 * normalizeStringArray(["a", "b", 42]) → ["a", "b"]
 * normalizeStringArray(null) → []
 * normalizeStringArray("not-array") → []
 */
function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
