// chat-history-query.dto.ts - Validate query params khi GET /ai/chat/history
//
// Pagination cho chat history: limit + offset.
// @Type(() => Number) can thiet vi query params luon la string
// -> class-transformer convert sang number truoc khi validate.

import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatHistoryQueryDto {
  // limit: so luong messages tra ve (default 20, max 100)
  @IsOptional()
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must not exceed 100' })
  @Type(() => Number)
  limit?: number = 20;

  // offset: skip bao nhieu messages (default 0)
  // Dung cho pagination: page 2 -> offset = limit
  @IsOptional()
  @IsInt({ message: 'offset must be an integer' })
  @Min(0, { message: 'offset must be at least 0' })
  @Type(() => Number)
  offset?: number = 0;
}
