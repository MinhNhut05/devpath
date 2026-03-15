// lessons.controller.ts - Lesson endpoints
//
// Tất cả routes trong controller này cần @UseGuards(JwtAuthGuard):
//   → User phải login để xem lesson detail (content là protected)
//   → Start/Complete cần userId để track progress
//
// Tại sao đặt guard ở class level?
// → Tất cả 3 routes đều cần auth → đặt 1 lần gọn hơn
// → Khác với LearningPathsController (mix public + protected)

import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/index.js';
import { JwtAuthGuard } from '../auth/index.js';
import { SlugParamDto } from './dto/index.js';
import { LessonsService } from './lessons.service.js';

@Controller('lessons')
@UseGuards(JwtAuthGuard) // Tất cả routes cần login
// Lesson content là protected → user phải login + đã enroll path
// Service sẽ check enrollment (logic ở service, không phải guard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // ── GET /api/v1/lessons/:slug ───────────────────────────────────────────

  /**
   * Lấy chi tiết 1 lesson theo slug.
   * User phải login VÀ đã enroll learning path chứa lesson này.
   *
   * @param slug - URL-friendly identifier (vd: "html-la-gi")
   * Response 200: lesson detail (summary, content, externalLinks)
   * Response 404: lesson không tồn tại hoặc chưa published
   * Response 403: user chưa enroll path chứa lesson / chưa đủ prerequisites
   */
  @Get(':slug')
  async getLessonBySlug(
    @Param() params: SlugParamDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lessonsService.getLessonBySlug(userId, params.slug);
  }

  // ── POST /api/v1/lessons/:slug/start ────────────────────────────────────

  /**
   * Đánh dấu bắt đầu học lesson.
   * Tạo/update UserProgress → status: IN_PROGRESS.
   *
   * @param slug - Lesson slug
   * Response 200: UserProgress record (update trạng thái, không tạo mới resource)
   * Response 404: lesson không tồn tại
   * Response 403: chưa enroll / chưa đủ prerequisites
   */
  @Post(':slug/start')
  @HttpCode(HttpStatus.OK) // 200 vì update trạng thái progress, không tạo resource mới
  async startLesson(
    @Param() params: SlugParamDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lessonsService.startLesson(userId, params.slug);
  }

  // ── POST /api/v1/lessons/:slug/complete ─────────────────────────────────

  /**
   * Đánh dấu hoàn thành lesson.
   * Update UserProgress → status: COMPLETED, set completedAt.
   *
   * @param slug - Lesson slug
   * Response 200: UserProgress record (update trạng thái)
   * Response 404: lesson không tồn tại
   * Response 403: chưa enroll / chưa đủ prerequisites
   * Response 422: chưa start lesson (phải IN_PROGRESS trước)
   */
  @Post(':slug/complete')
  @HttpCode(HttpStatus.OK) // 200 vì update trạng thái, không tạo resource mới
  async completeLesson(
    @Param() params: SlugParamDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lessonsService.completeLesson(userId, params.slug);
  }
}
