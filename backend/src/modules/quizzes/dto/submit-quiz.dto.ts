// submit-quiz.dto.ts - Validate quiz submission payload
//
// Tại sao dùng nested DTO (QuizAnswerDto)?
// → answers là array of objects → cần validate từng item
// → @ValidateNested({ each: true }) + @Type(() => QuizAnswerDto) để class-validator
//   validate mỗi element trong array
// → @Type() từ class-transformer: transform plain object → class instance
//   (class-validator	chỉ validate class instances, không validate plain objects)
//
// selected là string[] (không phải single string):
// → SINGLE_CHOICE: ["a"] (1 phần tử)
// → MULTIPLE_CHOICE: ["a", "c"] (nhiều phần tử)
// → Thống nhất 1 format cho cả 2 types → đơn giản hoá logic auto-grade

import { IsArray, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QuizAnswerDto {
  @IsUUID('4')
  questionId!: string;

  @IsArray()
  @IsString({ each: true })
  selected!: string[];
}

export class SubmitQuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}
