// progress.module.ts - Progress Module
//
// Module theo dõi tiến độ học tập của user:
//   - Overall progress: % hoàn thành tổng thể
//   - Path progress: tiến độ theo từng learning path
//   - Activity data: lịch sử hoạt động (heatmap)
//   - Learning sessions: bắt đầu / kết thúc session học
//
// Import AuthModule để dùng JwtAuthGuard trong controller.
// PrismaModule là @Global() → không cần import thêm.

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/index.js';
import { ProgressController } from './progress.controller.js';
import { ProgressService } from './progress.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
