// payment-history-query.dto.ts - Validate query params cho GET /subscriptions/history
//
// Pagination: limit + offset (giong ChatHistoryQueryDto trong ai-chat).
// @Type(() => Number): can thiet vi query string luon la string,
//   class-transformer tu dong convert sang number truoc khi validate.

import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentHistoryQueryDto {
  // limit: so luong payment logs tra ve (default 20, max 50)
  @IsOptional()
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(50, { message: 'limit must not exceed 50' })
  @Type(() => Number)
  limit?: number = 20;

  // offset: skip bao nhieu records (default 0)
  @IsOptional()
  @IsInt({ message: 'offset must be an integer' })
  @Min(0, { message: 'offset must be at least 0' })
  @Type(() => Number)
  offset?: number = 0;
}
