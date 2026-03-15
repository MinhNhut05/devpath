// dto/activity-query.dto.ts
//
// DTO cho query params của GET /api/v1/progress/activity
//
// Fields:
//   - days (optional, default=30): số ngày nhìn lại
//     → Min 7 (ít nhất 1 tuần) / Max 365 (1 năm)
//     → @Type(() => Number) cần thiết vì query params luôn là string
//       class-transformer sẽ coerce "30" (string) → 30 (number) trước khi validate

import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ActivityQueryDto {
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(365)
  @Type(() => Number)
  days?: number = 30;
}
