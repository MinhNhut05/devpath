// onboarding-recommendation.fallback.ts - Rule-based fallback khi AI fail
//
// Khi nào fallback được gọi?
// 1. AI API timeout (> 30 giây)
// 2. Network error (AI server down)
// 3. AI trả về format sai (parseRecommendation trả về null)
//
// Tại sao cần fallback thay vì chỉ throw error?
// → Onboarding là bước quan trọng — user không thể "bị kẹt" ở đây
// → Rule-based đủ tốt cho majority of cases (4 career goals rõ ràng)
// → UX tốt hơn: user vẫn thấy recommendation, không thấy error screen
//
// Fallback KHÔNG BAO GIỜ throw — luôn trả về valid RecommendationResult

import { CareerGoal, LearningBackground } from '@prisma/client';
import {
  CAREER_GOAL_TO_SLUG,
  type OnboardingDataInput,
} from './onboarding-prompt.builder.js';
import type { RecommendationResult } from './onboarding-recommendation.parser.js';

// ── Fallback Rules ────────────────────────────────────────────────────────────

/**
 * Map CareerGoal → alternative paths có thể phù hợp.
 * VD: FULLSTACK → suggest cả frontend và backend như paths khác
 */
const ALTERNATIVE_PATHS: Record<CareerGoal, string[]> = {
  [CareerGoal.FRONTEND]: [],
  [CareerGoal.BACKEND]: [],
  [CareerGoal.FULLSTACK]: ['frontend-developer', 'backend-developer'],
  [CareerGoal.AI_PYTHON]: [],
};

/**
 * Map CareerGoal → reason tiếng Việt mặc định.
 * Sẽ được customize thêm dựa trên background trong buildFallbackReason().
 */
const BASE_REASONS: Record<CareerGoal, string> = {
  [CareerGoal.FRONTEND]:
    'Dựa trên mục tiêu trở thành Frontend Developer, lộ trình Frontend sẽ giúp bạn nắm vững HTML, CSS, JavaScript và React.',
  [CareerGoal.BACKEND]:
    'Dựa trên mục tiêu trở thành Backend Developer, lộ trình Backend sẽ giúp bạn thành thạo Node.js, API design và cơ sở dữ liệu.',
  [CareerGoal.FULLSTACK]:
    'Dựa trên mục tiêu trở thành Fullstack Developer, lộ trình Fullstack sẽ bao gồm cả Frontend lẫn Backend để bạn có thể làm việc toàn diện.',
  [CareerGoal.AI_PYTHON]:
    'Dựa trên mục tiêu về AI/Data Science, lộ trình AI Python sẽ giúp bạn thành thạo Python, NumPy, Pandas và các thuật toán Machine Learning cơ bản.',
};

/**
 * Topics cần học cho từng career goal khi chưa có prior knowledge.
 * Sẽ được filter bớt nếu user đã biết một số topics.
 */
const ALL_FOCUS_AREAS: Record<CareerGoal, string[]> = {
  [CareerGoal.FRONTEND]: ['HTML & CSS fundamentals', 'JavaScript ES6+', 'DOM manipulation', 'React cơ bản', 'Responsive design'],
  [CareerGoal.BACKEND]: ['Node.js fundamentals', 'REST API design', 'SQL & PostgreSQL', 'Authentication & JWT', 'NestJS framework'],
  [CareerGoal.FULLSTACK]: ['HTML, CSS, JavaScript', 'React', 'Node.js & Express', 'SQL Database', 'API integration'],
  [CareerGoal.AI_PYTHON]: ['Python fundamentals', 'NumPy & Pandas', 'Data visualization', 'Statistics cơ bản', 'Scikit-learn'],
};

/**
 * Map prior knowledge → topics đã biết (để filter ra khỏi focusAreas).
 * Giúp fallback cũng có tính cá nhân hóa cơ bản.
 */
const PRIOR_KNOWLEDGE_COVERAGE: Record<string, string[]> = {
  html: ['HTML & CSS fundamentals', 'HTML, CSS, JavaScript'],
  css: ['HTML & CSS fundamentals', 'Responsive design', 'HTML, CSS, JavaScript'],
  javascript: ['JavaScript ES6+', 'DOM manipulation', 'HTML, CSS, JavaScript'],
  typescript: ['JavaScript ES6+'],
  python: ['Python fundamentals'],
  react: ['React cơ bản', 'React'],
  nodejs: ['Node.js fundamentals', 'Node.js & Express'],
  sql: ['SQL & PostgreSQL', 'SQL Database'],
};

// ── Fallback function ─────────────────────────────────────────────────────────

/**
 * Rule-based fallback recommendation khi AI không available.
 * Luôn trả về valid RecommendationResult, không bao giờ throw.
 *
 * Logic:
 * 1. primaryPath = CAREER_GOAL_TO_SLUG[careerGoal] (luôn map 1-1)
 * 2. alternativePaths = ALTERNATIVE_PATHS[careerGoal]
 * 3. reason = base reason + context về background
 * 4. focusAreas = filter bỏ topics user đã biết
 * 5. tips = dựa trên hoursPerWeek + background
 *
 * @example
 * const result = getFallbackRecommendation(onboardingData)
 * // result.source === 'fallback'
 */
export function getFallbackRecommendation(
  data: OnboardingDataInput,
): RecommendationResult {
  const primaryPath = CAREER_GOAL_TO_SLUG[data.careerGoal];
  const alternativePaths = ALTERNATIVE_PATHS[data.careerGoal];

  // ── Build reason ──────────────────────────────────────────────────────────
  const reason = buildFallbackReason(data);

  // ── Build focusAreas ──────────────────────────────────────────────────────
  const focusAreas = buildFocusAreas(data);

  // ── Build tips ────────────────────────────────────────────────────────────
  const tips = buildStudyTips(data);

  return {
    source: 'fallback',
    primaryPath,
    alternativePaths,
    reason,
    focusAreas,
    tips,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build reason text với context về background của user.
 */
function buildFallbackReason(data: OnboardingDataInput): string {
  const baseReason = BASE_REASONS[data.careerGoal];

  // Thêm context về background để reason tự nhiên hơn
  if (data.learningBackground === LearningBackground.NO_BACKGROUND) {
    return `${baseReason} Lộ trình được thiết kế phù hợp cho người mới bắt đầu, không cần kiến thức nền.`;
  }

  if (data.learningBackground === LearningBackground.CS_DEGREE) {
    return `${baseReason} Với nền tảng đại học CNTT, bạn có thể học nhanh hơn ở các phần cơ bản.`;
  }

  return baseReason;
}

/**
 * Build focusAreas bằng cách filter bỏ topics user đã biết.
 * Trả về tối đa 4 topics để không overwhelming.
 */
function buildFocusAreas(data: OnboardingDataInput): string[] {
  const allAreas = ALL_FOCUS_AREAS[data.careerGoal];

  // Filter lấy chỉ các phần tử là string để tránh TypeError khi gọi toLowerCase()
  // Prisma Json field có thể chứa bất kỳ giá trị gì → phải validate từng element
  const priorKnowledge = Array.isArray(data.priorKnowledge)
    ? data.priorKnowledge.filter((item): item is string => typeof item === 'string')
    : [];

  // Tập hợp các topics đã covered bởi prior knowledge
  const coveredTopics = new Set<string>();
  for (const knowledge of priorKnowledge) {
    const covered = PRIOR_KNOWLEDGE_COVERAGE[knowledge.toLowerCase()];
    if (covered) {
      covered.forEach((topic) => coveredTopics.add(topic));
    }
  }

  // Filter bỏ topics đã biết, lấy tối đa 4
  const remaining = allAreas.filter((area) => !coveredTopics.has(area));

  // Nếu user đã biết hết → trả về advanced topics (lấy 2 cuối trong list)
  if (remaining.length === 0) {
    return allAreas.slice(-2);
  }

  return remaining.slice(0, 4);
}

/**
 * Build study tips dựa trên hoursPerWeek và learning background.
 * Luôn trả về ít nhất 2 tips.
 */
function buildStudyTips(data: OnboardingDataInput): string[] {
  const tips: string[] = [];

  // Tip 1: Dựa trên số giờ/tuần
  if (data.hoursPerWeek <= 5) {
    tips.push(
      'Với 5 giờ/tuần, hãy tập trung vào 1 bài/ngày và đừng bỏ qua bài quiz — đây là cách hiệu quả nhất để giữ kiến thức.',
    );
  } else if (data.hoursPerWeek <= 10) {
    tips.push(
      'Chia đều 1-2 giờ mỗi ngày thay vì học dồn 1 buổi/tuần — học đều đặn giúp nhớ lâu hơn nhiều.',
    );
  } else if (data.hoursPerWeek <= 20) {
    tips.push(
      'Với 10-20 giờ/tuần, bạn có thể hoàn thành 2-3 bài/tuần. Hãy thực hành code ngay sau mỗi bài lý thuyết.',
    );
  } else {
    tips.push(
      'Với hơn 20 giờ/tuần, đây là tốc độ rất tốt! Hãy xen kẽ giữa học lý thuyết và làm dự án thực tế để củng cố kiến thức.',
    );
  }

  // Tip 2: Dựa trên learning background
  if (data.learningBackground === LearningBackground.NO_BACKGROUND) {
    tips.push(
      'Đừng nản lòng nếu thấy khó ở đầu — mọi developer đều bắt đầu từ zero. Hãy đọc kỹ phần giải thích và thử code theo từng bước.',
    );
  } else if (data.learningBackground === LearningBackground.SELF_TAUGHT) {
    tips.push(
      'Kinh nghiệm tự học là lợi thế lớn. Hãy chú ý đến phần "best practices" trong mỗi bài — đây là thứ khó tìm được từ YouTube.',
    );
  } else if (data.learningBackground === LearningBackground.BOOTCAMP) {
    tips.push(
      'Với nền bootcamp, bạn đã quen với pace học nhanh. Hãy focus vào phần lý thuyết sâu và các design patterns thay vì chỉ làm cho chạy.',
    );
  } else {
    tips.push(
      'Với nền đại học CNTT, bạn có thể skip một số phần cơ bản. Hãy dùng feature "Mark as known" để đi nhanh hơn đến nội dung nâng cao.',
    );
  }

  return tips;
}
