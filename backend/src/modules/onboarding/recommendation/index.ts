// recommendation/index.ts - Barrel export cho recommendation engine
//
// Service chi can import tu 1 cho:
//   import { buildOnboardingPrompt, parseRecommendation, getFallbackRecommendation } from './recommendation/index.js'
//
// Note: AiClient da duoc chuyen sang shared AiModule (backend/src/modules/ai/)
// AiService giờ được inject tự động qua @Global() AiModule

// ── Prompt Builder ────────────────────────────────────────────────────────────
export { buildOnboardingPrompt, CAREER_GOAL_TO_SLUG, VALID_PATH_SLUGS } from './onboarding-prompt.builder.js';
export type { OnboardingDataInput, BuiltPrompt } from './onboarding-prompt.builder.js';

// ── Parser ────────────────────────────────────────────────────────────────────
export { parseRecommendation } from './onboarding-recommendation.parser.js';
export type { RecommendationResult } from './onboarding-recommendation.parser.js';

// ── Fallback ──────────────────────────────────────────────────────────────────
export { getFallbackRecommendation } from './onboarding-recommendation.fallback.js';
