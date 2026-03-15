// src/modules/quizzes/dto/index.ts
// Barrel export cho DTOs

export { SubmitQuizDto, QuizAnswerDto } from './submit-quiz.dto.js';
export { EvaluateEssayDto } from './evaluate-essay.dto.js';
export { RunCodeDto } from './run-code.dto.js';

// Re-export SlugParamDto từ learning-paths để dùng chung
// Tránh duplicate code — 1 DTO, nhiều modules dùng (pattern từ lessons/dto)
export { SlugParamDto } from '../../learning-paths/dto/slug-param.dto.js';
