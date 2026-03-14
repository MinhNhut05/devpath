// recommendation/index.ts - Barrel export cho recommendation engine
//
// Service chỉ cần import từ 1 chỗ:
//   import { AiClient, buildOnboardingPrompt, parseRecommendation, getFallbackRecommendation } from './recommendation/index.js'
//
// Tại sao dùng barrel export?
// → Gom tất cả public API vào 1 điểm → service không cần biết internal structure
// → Nếu sau này refactor (tách file, đổi tên) → chỉ cần sửa index.ts, không sửa service

// ── AiClient ──────────────────────────────────────────────────────────────────
export { AiClient } from './ai-client.js';
export type { AiMessage } from './ai-client.js';

// ── Prompt Builder ────────────────────────────────────────────────────────────
export { buildOnboardingPrompt, CAREER_GOAL_TO_SLUG, VALID_PATH_SLUGS } from './onboarding-prompt.builder.js';
export type { OnboardingDataInput, BuiltPrompt } from './onboarding-prompt.builder.js';

// ── Parser ────────────────────────────────────────────────────────────────────
export { parseRecommendation } from './onboarding-recommendation.parser.js';
export type { RecommendationResult } from './onboarding-recommendation.parser.js';

// ── Fallback ──────────────────────────────────────────────────────────────────
export { getFallbackRecommendation } from './onboarding-recommendation.fallback.js';
