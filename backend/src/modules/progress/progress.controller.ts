// progress.controller.ts - Progress endpoints
//
// Controller quản lý 5 routes cho progress tracking:
//   - GET  /api/v1/progress              → overall progress của user
//   - GET  /api/v1/progress/path/:pathId → progress theo learning path
//   - GET  /api/v1/progress/activity     → activity data (heatmap, streaks)
//   - POST /api/v1/progress/session/start → bắt đầu learning session
//   - POST /api/v1/progress/session/end   → kết thúc learning session
//
// @UseGuards(JwtAuthGuard) ở class level → tất cả routes đều cần login.
// @CurrentUser('id') lấy userId từ JWT payload, không dùng @Req().
// POST routes dùng @HttpCode(200) vì là action trên resource, không tạo mới.

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/index.js';
import { CurrentUser } from '../../common/decorators/index.js';
import {
  StartSessionDto,
  EndSessionDto,
  ActivityQueryDto,
} from './dto/index.js';
import { ProgressService } from './progress.service.js';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // ── GET /api/v1/progress ─────────────────────────────────────────────────
  //
  // Lấy tổng quan tiến độ học tập của user:
  //   - Tổng số lessons đã học / tổng lessons
  //   - % hoàn thành
  //   - Learning paths đang tham gia
  @Get()
  async getOverallProgress(@CurrentUser('id') userId: string) {
    return this.progressService.getOverallProgress(userId);
  }

  // ── GET /api/v1/progress/path/:pathId ────────────────────────────────────
  //
  // Lấy tiến độ của user theo một learning path cụ thể.
  // pathId là UUID của LearningPath.
  @Get('path/:pathId')
  async getPathProgress(
    @Param('pathId') pathId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.progressService.getPathProgress(pathId, userId);
  }

  // ── GET /api/v1/progress/activity ────────────────────────────────────────
  //
  // Lấy dữ liệu hoạt động theo ngày (dùng cho heatmap calendar).
  // Query param: ?days=30 (default) | 7 | 90 | 365
  @Get('activity')
  async getActivityData(
    @Query() query: ActivityQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.progressService.getActivityData(query, userId);
  }

  // ── POST /api/v1/progress/session/start ──────────────────────────────────
  //
  // Bắt đầu một learning session mới.
  // Body: { lessonId?: UUID, activityType: ActivityType }
  // @HttpCode(200) vì là action, không tạo resource mới theo REST semantics.
  @Post('session/start')
  @HttpCode(HttpStatus.OK)
  async startSession(
    @Body() dto: StartSessionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.progressService.startSession(dto, userId);
  }

  // ── POST /api/v1/progress/session/end ────────────────────────────────────
  //
  // Kết thúc một learning session (tính thời gian học).
  // Body: { sessionId: UUID }
  // @HttpCode(200) vì là action update, không tạo resource mới.
  @Post('session/end')
  @HttpCode(HttpStatus.OK)
  async endSession(
    @Body() dto: EndSessionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.progressService.endSession(dto, userId);
  }
}
