// src/modules/lessons/dto/index.ts
// Barrel export cho DTOs

// Re-export SlugParamDto từ learning-paths để dùng chung
// Tránh duplicate code — 1 DTO, 2 modules dùng
export { SlugParamDto } from '../../learning-paths/dto/slug-param.dto.js';
