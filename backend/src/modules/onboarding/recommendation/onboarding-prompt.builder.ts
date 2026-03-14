// onboarding-prompt.builder.ts - Build AI prompt từ OnboardingData
//
// Tại sao tách file này riêng?
// → Prompt engineering thay đổi thường xuyên (cải thiện chất lượng AI)
// → Dễ test độc lập: chỉ cần pass OnboardingData, kiểm tra output string
// → Không phụ thuộc network → test nhanh, không cần mock HTTP
//
// Cách hoạt động:
//   buildOnboardingPrompt(data) → { systemPrompt, userMessage }
//   → AiClient.chat(systemPrompt, userMessage) → raw JSON string
//   → parseRecommendation(raw) → RecommendationResult

import { CareerGoal, LearningBackground } from '@prisma/client';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Data shape từ Prisma OnboardingData model.
 * Dùng type riêng thay vì import trực tiếp từ @prisma/client để:
 * → Tránh coupling chặt với Prisma model (dễ thay đổi sau này)
 * → priorKnowledge trong Prisma là Json → cần cast sang string[]
 */
export interface OnboardingDataInput {
  careerGoal: CareerGoal;
  priorKnowledge: unknown; // Json field từ Prisma → cast trong builder
  learningBackground: LearningBackground;
  hoursPerWeek: number;
}

/**
 * Output của buildOnboardingPrompt.
 * systemPrompt: context + rules cho AI
 * userMessage: thông tin user cụ thể + yêu cầu JSON output
 */
export interface BuiltPrompt {
  systemPrompt: string;
  userMessage: string;
}

// ── Label Maps ────────────────────────────────────────────────────────────────

/**
 * Map CareerGoal enum → label tiếng Việt dễ đọc.
 * AI dùng label để hiểu context, không cần biết tên enum kỹ thuật.
 */
const CAREER_GOAL_LABELS: Record<CareerGoal, string> = {
  [CareerGoal.FRONTEND]: 'Frontend Developer (React, Vue, CSS)',
  [CareerGoal.BACKEND]: 'Backend Developer (Node.js, API, Database)',
  [CareerGoal.FULLSTACK]: 'Fullstack Developer (Frontend + Backend)',
  [CareerGoal.AI_PYTHON]: 'AI / Data Science (Python, Machine Learning)',
};

/**
 * Map LearningBackground enum → mô tả tiếng Việt.
 */
const LEARNING_BACKGROUND_LABELS: Record<LearningBackground, string> = {
  [LearningBackground.NO_BACKGROUND]: 'Chưa học lập trình bao giờ',
  [LearningBackground.SELF_TAUGHT]: 'Tự học (YouTube, blog, tài liệu online)',
  [LearningBackground.BOOTCAMP]: 'Học qua bootcamp hoặc khóa học trả phí',
  [LearningBackground.CS_DEGREE]: 'Có bằng Đại học CNTT hoặc ngành liên quan',
};

/**
 * Map CareerGoal → slug của learning path trong DB.
 * Slug này phải khớp với dữ liệu seed trong bảng learning_paths.
 * Dùng cho cả fallback lẫn validate AI output.
 */
export const CAREER_GOAL_TO_SLUG: Record<CareerGoal, string> = {
  [CareerGoal.FRONTEND]: 'frontend-developer',
  [CareerGoal.BACKEND]: 'backend-developer',
  [CareerGoal.FULLSTACK]: 'fullstack-developer',
  [CareerGoal.AI_PYTHON]: 'ai-python',
};

/**
 * Tất cả slugs hợp lệ — dùng để validate AI output trong parser.
 */
export const VALID_PATH_SLUGS = Object.values(CAREER_GOAL_TO_SLUG);

// ── Builder function ──────────────────────────────────────────────────────────

/**
 * Build system prompt + user message từ OnboardingData.
 *
 * System prompt: Giải thích role của AI, context về DevPath, yêu cầu format JSON
 * User message:  Thông tin cụ thể của user này
 *
 * @example
 * const { systemPrompt, userMessage } = buildOnboardingPrompt(onboardingData)
 * const raw = await aiClient.chat(systemPrompt, userMessage)
 */
export function buildOnboardingPrompt(data: OnboardingDataInput): BuiltPrompt {
  const careerGoalLabel = CAREER_GOAL_LABELS[data.careerGoal];
  const backgroundLabel = LEARNING_BACKGROUND_LABELS[data.learningBackground];

  // priorKnowledge là Json trong Prisma → cast sang string[]
  // Nếu rỗng hoặc không phải array → dùng mảng rỗng
  // Filter lấy chỉ các phần tử là string để đảm bảo type safety
  // Prisma Json field có thể chứa bất kỳ giá trị gì → phải validate từng element
  const priorKnowledge = Array.isArray(data.priorKnowledge)
    ? data.priorKnowledge.filter((item): item is string => typeof item === 'string')
    : [];

  const priorKnowledgeText =
    priorKnowledge.length > 0
      ? priorKnowledge.join(', ')
      : 'Chưa có kiến thức nền tảng nào';

  // Danh sách slugs hợp lệ để AI biết phải chọn trong số này
  const validSlugs = VALID_PATH_SLUGS.join(', ');

  // ── System Prompt ──────────────────────────────────────────────────────────
  // Giải thích context, role, và format output yêu cầu
  const systemPrompt = `You are a learning path advisor for DevPath, an IT learning platform for Vietnamese learners.

Your task: Analyze a new user's onboarding answers and recommend the most suitable learning path.

Available learning paths (use EXACTLY these slugs):
- frontend-developer: HTML, CSS, JavaScript, React (for Frontend Developers)
- backend-developer: Node.js, NestJS, SQL, API design (for Backend Developers)
- fullstack-developer: Full Frontend + Backend curriculum (for Fullstack Developers)
- ai-python: Python, NumPy, Pandas, Machine Learning basics (for AI/Data Science)

IMPORTANT - You MUST respond with ONLY a valid JSON object, no markdown, no explanation outside JSON:
{
  "primaryPath": "<one of the valid slugs above>",
  "alternativePaths": ["<slug>", "<slug>"],
  "reason": "<1-2 sentences explaining why this path fits the user, in Vietnamese>",
  "focusAreas": ["<topic 1>", "<topic 2>", "<topic 3>"],
  "tips": ["<personalized tip 1>", "<personalized tip 2>"]
}

Rules:
- primaryPath MUST be one of: ${validSlugs}
- alternativePaths: 0-2 other relevant slugs (can be empty array [])
- reason: in Vietnamese, mention their background and goal specifically
- focusAreas: 3-5 specific topics they should focus on given their prior knowledge gaps
- tips: 2-3 actionable study tips based on their hours/week and background
- Respond ONLY with the JSON object, nothing else`;

  // ── User Message ──────────────────────────────────────────────────────────
  // Thông tin cụ thể của user này
  const userMessage = `Please recommend a learning path for this new learner:

- Career goal: ${careerGoalLabel}
- Learning background: ${backgroundLabel}
- Prior knowledge: ${priorKnowledgeText}
- Available time: ${data.hoursPerWeek} hours per week

Based on this profile, which learning path should they take?`;

  return { systemPrompt, userMessage };
}
