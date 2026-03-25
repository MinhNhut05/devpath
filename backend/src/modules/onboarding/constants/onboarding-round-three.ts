import { CareerGoal } from '@prisma/client';

import type { OnboardingQuestion } from './onboarding-questions.js';

const RATING_OPTIONS = [
  { value: '1', label: '1 — Mới bắt đầu' },
  { value: '2', label: '2 — Biết cơ bản' },
  { value: '3', label: '3 — Tạm ổn' },
  { value: '4', label: '4 — Khá tự tin' },
  { value: '5', label: '5 — Tự tin' },
] as const;

function createSkillQuestion(id: string, question: string): OnboardingQuestion {
  return {
    id,
    question,
    type: 'SINGLE_CHOICE',
    options: [...RATING_OPTIONS],
  };
}

export const ROUND_THREE_QUESTIONS_BY_GOAL: Record<CareerGoal, OnboardingQuestion[]> = {
  [CareerGoal.FRONTEND]: [
    createSkillQuestion('html_css', 'Mức độ tự tin của bạn với HTML/CSS hiện tại như thế nào?'),
    createSkillQuestion('javascript', 'Bạn tự đánh giá kiến thức JavaScript của mình ở mức nào?'),
    createSkillQuestion('react', 'Bạn đã quen với React hoặc thư viện UI tương tự tới đâu?'),
    createSkillQuestion('git_basics', 'Bạn tự tin tới đâu với Git cơ bản (commit, branch, push)?'),
    createSkillQuestion('responsive_design', 'Bạn cảm thấy mình làm giao diện responsive tốt tới mức nào?'),
  ],
  [CareerGoal.BACKEND]: [
    createSkillQuestion('nodejs', 'Bạn tự đánh giá kiến thức Node.js của mình ở mức nào?'),
    createSkillQuestion('sql_databases', 'Bạn tự tin tới đâu khi làm việc với SQL và database?'),
    createSkillQuestion('restful_api', 'Bạn hiểu và xây dựng RESTful API tới mức nào?'),
    createSkillQuestion('git_basics', 'Bạn tự tin tới đâu với Git cơ bản (commit, branch, push)?'),
    createSkillQuestion('linux_basics', 'Bạn cảm thấy mình quen với các thao tác Linux cơ bản tới mức nào?'),
  ],
  [CareerGoal.FULLSTACK]: [
    createSkillQuestion('javascript', 'Bạn tự đánh giá kiến thức JavaScript của mình ở mức nào?'),
    createSkillQuestion('nodejs', 'Bạn tự đánh giá kiến thức Node.js của mình ở mức nào?'),
    createSkillQuestion('sql_databases', 'Bạn tự tin tới đâu khi làm việc với SQL và database?'),
    createSkillQuestion('react', 'Bạn đã quen với React hoặc thư viện UI tương tự tới đâu?'),
    createSkillQuestion('git_basics', 'Bạn tự tin tới đâu với Git cơ bản (commit, branch, push)?'),
  ],
  [CareerGoal.AI_PYTHON]: [
    createSkillQuestion('python_basics', 'Bạn tự đánh giá nền tảng Python của mình ở mức nào?'),
    createSkillQuestion('math_statistics', 'Bạn tự tin tới đâu với toán và thống kê cơ bản cho AI/Data?'),
    createSkillQuestion('machine_learning', 'Bạn đã hiểu các khái niệm machine learning tới mức nào?'),
    createSkillQuestion('data_handling', 'Bạn cảm thấy mình xử lý dữ liệu (CSV, pandas, làm sạch dữ liệu) tốt tới đâu?'),
    createSkillQuestion('git_basics', 'Bạn tự tin tới đâu với Git cơ bản (commit, branch, push)?'),
  ],
};

export function getRoundThreeQuestions(careerGoal: CareerGoal): OnboardingQuestion[] {
  return ROUND_THREE_QUESTIONS_BY_GOAL[careerGoal] ?? [];
}
