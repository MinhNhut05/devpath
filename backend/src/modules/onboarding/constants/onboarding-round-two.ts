import type { OnboardingQuestion } from './onboarding-questions.js';

export const ROUND_TWO_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'targetRole',
    question: 'Trong 6-12 tháng tới, bạn muốn tiến gần nhất tới vai trò nào?',
    type: 'SINGLE_CHOICE',
    options: [
      { value: 'intern_junior', label: 'Thực tập sinh / Junior Developer' },
      { value: 'freelance', label: 'Làm freelance cho dự án nhỏ' },
      { value: 'career_change', label: 'Chuyển nghề sang IT' },
      { value: 'exploring', label: 'Đang khám phá để chọn hướng phù hợp' },
    ],
  },
  {
    id: 'workEnvironment',
    question: 'Bạn thấy mình hợp với môi trường làm việc nào hơn?',
    type: 'SINGLE_CHOICE',
    options: [
      { value: 'startup', label: 'Startup, linh hoạt và làm nhiều việc' },
      { value: 'corporate', label: 'Công ty lớn, quy trình rõ ràng' },
      { value: 'remote', label: 'Làm việc remote / từ xa' },
      { value: 'no_preference', label: 'Chưa có ưu tiên cụ thể' },
    ],
  },
  {
    id: 'timeline',
    question: 'Bạn muốn đạt mục tiêu học tập này trong khoảng bao lâu?',
    type: 'SINGLE_CHOICE',
    options: [
      { value: '3_months', label: 'Khoảng 3 tháng' },
      { value: '6_months', label: 'Khoảng 6 tháng' },
      { value: '1_year', label: 'Khoảng 1 năm' },
      { value: 'no_rush', label: 'Không gấp, ưu tiên học chắc' },
    ],
  },
  {
    id: 'learningStyle',
    question: 'Cách học nào giúp bạn tiếp thu tốt nhất?',
    type: 'SINGLE_CHOICE',
    options: [
      { value: 'video', label: 'Học qua video' },
      { value: 'text', label: 'Đọc tài liệu / bài viết' },
      { value: 'hands_on', label: 'Thực hành trực tiếp nhiều' },
      { value: 'mixed', label: 'Kết hợp nhiều cách học' },
    ],
  },
];
