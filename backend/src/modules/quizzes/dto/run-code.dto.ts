// run-code.dto.ts - Validate code execution request
//
// Tại sao MaxLength(50000)?
// → Giới hạn kích thước code gửi lên → tránh abuse (submit file rất lớn)
// → 50KB đủ cho bài tập code ở level learning
//
// language là optional:
// → Default "javascript" nếu không chỉ định (xử lý ở service/runner)
// → Hỗ trợ mở rộng nhiều ngôn ngữ sau (python, java, etc.)

import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class RunCodeDto {
  @IsUUID('4')
  questionId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  code!: string;

  @IsString()
  @IsOptional()
  language?: string; // Default: 'javascript' — xử lý ở CodeRunnerService
}
