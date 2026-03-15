// dto/end-session.dto.ts
//
// DTO cho request kết thúc learning session.
//
// Fields:
//   - sessionId (required): UUID của LearningSession cần kết thúc
//     → Server dùng để tìm session, tính durationSeconds = now() - startedAt

import { IsUUID } from 'class-validator';

export class EndSessionDto {
  @IsUUID('4')
  sessionId!: string;
}
