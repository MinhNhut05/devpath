// confirm-path.dto.ts - Validate body khi user POST /onboarding/confirm
//
// User chọn learning path sau khi xem AI recommendation
// Chỉ cần gửi learningPathId (UUID của path đã chọn)

import { IsUUID, IsNotEmpty } from 'class-validator';

export class ConfirmPathDto {
  // learningPathId: UUID của LearningPath đã được AI đề xuất
  // IsUUID: validate đúng format UUID v4
  @IsUUID('4', { message: 'learningPathId must be a valid UUID' })
  @IsNotEmpty({ message: 'learningPathId is required' })
  learningPathId!: string;
}
