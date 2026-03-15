// lessons.module.ts - Lessons module registration
//
// Module quản lý lesson-level operations:
//   - Xem lesson detail
//   - Start/Complete lesson (progress tracking)
//   - Check prerequisites
//
// imports: [AuthModule] → tất cả routes cần JwtAuthGuard
// PrismaService có sẵn qua @Global() PrismaModule

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/index.js';
import { LessonsService } from './lessons.service.js';
import { LessonsController } from './lessons.controller.js';

@Module({
  imports: [
    // AuthModule: cung cấp JwtAuthGuard + JwtStrategy
    // Tất cả lesson routes cần auth (content là protected)
    AuthModule,
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
  // exports: không cần — module khác không dùng LessonsService
})
export class LessonsModule {}
