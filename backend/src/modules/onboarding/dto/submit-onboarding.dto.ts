// submit-onboarding.dto.ts - Validate body khi user POST /onboarding/submit
//
// DTO (Data Transfer Object): class dùng để validate + type dữ liệu đầu vào
// NestJS ValidationPipe sẽ tự động validate trước khi vào controller
//
// Tại sao dùng class thay vì interface?
// → class-validator cần INSTANCE (class), không phải type interface
// → TypeScript compile interface → mất hoàn toàn, class vẫn còn metadata
//
// Decorators từ class-validator:
//   @IsEnum() → chỉ nhận giá trị trong enum
//   @IsArray() → phải là mảng
//   @IsString({ each: true }) → mỗi phần tử trong mảng phải là string
//   @IsInt() → phải là số nguyên
//   @Min() → giá trị tối thiểu

import {
  IsEnum,
  IsArray,
  IsString,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { CareerGoal, LearningBackground } from '@prisma/client';

// @prisma/client tự generate enum CareerGoal và LearningBackground
// từ schema.prisma → tránh duplicate định nghĩa tay

export class SubmitOnboardingDto {
  // careerGoal: một trong 4 giá trị enum từ schema
  @IsEnum(CareerGoal, {
    message: `careerGoal must be one of: ${Object.values(CareerGoal).join(', ')}`,
  })
  careerGoal!: CareerGoal;

  // priorKnowledge: mảng string (json trong DB)
  // Ít nhất 0 item (có thể chưa biết gì), tối đa 20
  @IsArray({ message: 'priorKnowledge must be an array' })
  @IsString({ each: true, message: 'Each prior knowledge item must be a string' })
  @ArrayMinSize(0)
  @ArrayMaxSize(20)
  priorKnowledge!: string[];

  // learningBackground: một trong 4 giá trị enum từ schema
  @IsEnum(LearningBackground, {
    message: `learningBackground must be one of: ${Object.values(LearningBackground).join(', ')}`,
  })
  learningBackground!: LearningBackground;

  // hoursPerWeek: số nguyên từ 1 đến 168 (7*24)
  @IsInt({ message: 'hoursPerWeek must be an integer' })
  @Min(1, { message: 'hoursPerWeek must be at least 1' })
  @Max(168, { message: 'hoursPerWeek cannot exceed 168 (hours in a week)' })
  hoursPerWeek!: number;
}
