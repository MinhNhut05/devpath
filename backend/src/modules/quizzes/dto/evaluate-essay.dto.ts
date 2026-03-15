// evaluate-essay.dto.ts - Validate essay evaluation request
//
// Tại sao có MinLength(10)?
// → Tránh user submit essay trống hoặc quá ngắn (vd: "ok", "yes")
// → AI grading cần nội dung đủ dài để evaluate meaningful
//
// Tại sao MaxLength(5000)?
// → Giới hạn token gửi lên AI API → tiết kiệm cost
// → Essay trong bối cảnh học IT thường không cần quá dài
// → Nếu cần dài hơn → tăng limit sau dựa trên feedback

import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class EvaluateEssayDto {
  @IsUUID('4')
  questionId!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  answer!: string;
}
