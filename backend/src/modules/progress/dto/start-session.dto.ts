// dto/start-session.dto.ts
//
// DTO cho request bắt đầu learning session.
//
// Fields:
//   - lessonId (optional): UUID của lesson đang học
//     → Nếu có → track progress cho lesson đó
//     → Nếu không (AI_CHAT, general browse) → session không gắn lesson
//   - activityType (required): loại hoạt động (enum ActivityType từ Prisma)
//     → LESSON_VIEW | QUIZ_ATTEMPT | AI_CHAT

import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class StartSessionDto {
  @IsOptional()
  @IsUUID('4')
  lessonId?: string;

  @IsEnum(ActivityType)
  activityType!: ActivityType;
}
