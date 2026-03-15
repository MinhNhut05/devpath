// chat-message.dto.ts - Validate body khi user POST /ai/chat
//
// DTO cho tin nhan chat gui len AI.
// Frontend gui message + optional model va lessonId (context).

import { IsString, IsOptional, MinLength, MaxLength, IsUUID } from 'class-validator';

export class ChatMessageDto {
  // message: noi dung tin nhan cua user
  // MinLength(1): khong cho gui message rong
  // MaxLength(2000): gioi han do dai de tranh abuse
  @IsString()
  @MinLength(1, { message: 'Message must not be empty' })
  @MaxLength(2000, { message: 'Message must not exceed 2000 characters' })
  message!: string;

  // model: AI model muon dung (optional)
  // Neu khong truyen -> service se dung default model tu env
  // Service se validate model co nam trong tier cua user khong
  @IsString()
  @IsOptional()
  model?: string;

  // lessonId: context cua cuoc hoi thoai (optional)
  // Khi user dang hoc 1 bai va chat -> AI se co context cua bai do
  @IsUUID('4', { message: 'lessonId must be a valid UUID v4' })
  @IsOptional()
  lessonId?: string;
}
