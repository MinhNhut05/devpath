// learning-paths.module.ts - Learning Paths module registration
//
// Module này quản lý các API liên quan đến Learning Path:
//   - Liệt kê paths, xem chi tiết, xem lessons, enroll
//
// imports: [AuthModule] → để lấy JwtAuthGuard cho POST enroll
//   Tại sao phải import AuthModule?
//   → JwtAuthGuard được export từ AuthModule
//   → LearningPathsController dùng @UseGuards(JwtAuthGuard) cho enroll
//   → NestJS cần biết JwtAuthGuard đến từ đâu để inject đúng
//
// PrismaService có sẵn qua @Global() PrismaModule → không cần import

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/index.js';
import { LearningPathsService } from './learning-paths.service.js';
import { LearningPathsController } from './learning-paths.controller.js';

@Module({
  imports: [
    // AuthModule: cung cấp JwtAuthGuard + JwtStrategy (để verify token cho enroll)
    AuthModule,
  ],
  controllers: [LearningPathsController],
  providers: [LearningPathsService],
  // exports: không cần — module khác không dùng LearningPathsService
})
export class LearningPathsModule {}
