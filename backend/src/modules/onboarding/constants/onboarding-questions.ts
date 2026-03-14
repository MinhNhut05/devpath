// onboarding-questions.ts - Static onboarding question definitions
//
// Tại sao dùng static constants thay vì lưu trong DB?
// → Câu hỏi onboarding không thay đổi thường xuyên
// → Không cần query DB → nhanh hơn, đơn giản hơn
// → Dễ thay đổi logic mà không cần migration
//
// Cấu trúc mỗi câu hỏi:
//   id: key duy nhất → dùng khi submit answers
//   type: 'single' | 'multiple' → single chọn 1, multiple chọn nhiều
//   options: mảng các lựa chọn với value + label

export interface OnboardingOption {
  value: string;
  label: string;
}

export interface OnboardingQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: OnboardingOption[];
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  // ── Q1: Career Goal ─────────────────────────────────────────────────────
  // Enum trong schema: FRONTEND | BACKEND | FULLSTACK | AI_PYTHON
  {
    id: 'careerGoal',
    question: 'Bạn muốn trở thành gì trong ngành IT?',
    type: 'single',
    options: [
      { value: 'FRONTEND', label: 'Frontend Developer (React, Vue, ...)' },
      { value: 'BACKEND', label: 'Backend Developer (Node.js, Java, ...)' },
      { value: 'FULLSTACK', label: 'Fullstack Developer' },
      { value: 'AI_PYTHON', label: 'AI / Data Science (Python)' },
    ],
  },

  // ── Q2: Prior Knowledge ─────────────────────────────────────────────────
  // Kiểu Json trong schema → lưu dưới dạng string[]
  // type: 'multiple' → user chọn nhiều công nghệ đã biết
  {
    id: 'priorKnowledge',
    question: 'Bạn đã có kiến thức về công nghệ nào? (Chọn tất cả bạn biết)',
    type: 'multiple',
    options: [
      { value: 'html', label: 'HTML' },
      { value: 'css', label: 'CSS' },
      { value: 'javascript', label: 'JavaScript' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'python', label: 'Python' },
      { value: 'react', label: 'React' },
      { value: 'nodejs', label: 'Node.js' },
      { value: 'sql', label: 'SQL / Database' },
    ],
  },

  // ── Q3: Learning Background ──────────────────────────────────────────────
  // Enum trong schema: NO_BACKGROUND | SELF_TAUGHT | BOOTCAMP | CS_DEGREE
  {
    id: 'learningBackground',
    question: 'Bạn có nền tảng học lập trình từ đâu?',
    type: 'single',
    options: [
      { value: 'NO_BACKGROUND', label: 'Chưa học lập trình bao giờ' },
      { value: 'SELF_TAUGHT', label: 'Tự học (YouTube, blog, ...)' },
      { value: 'BOOTCAMP', label: 'Học qua bootcamp / khóa học' },
      { value: 'CS_DEGREE', label: 'Có bằng CNTT / liên quan' },
    ],
  },

  // ── Q4: Hours per Week ──────────────────────────────────────────────────
  // Số Int trong schema (hoursPerWeek) → value là chuỗi số để tiện display
  {
    id: 'hoursPerWeek',
    question: 'Bạn có thể dành bao nhiêu giờ mỗi tuần để học?',
    type: 'single',
    options: [
      { value: '5', label: 'Dưới 5 giờ / tuần' },
      { value: '10', label: '5 – 10 giờ / tuần' },
      { value: '20', label: '10 – 20 giờ / tuần' },
      { value: '30', label: 'Hơn 20 giờ / tuần' },
    ],
  },
];
