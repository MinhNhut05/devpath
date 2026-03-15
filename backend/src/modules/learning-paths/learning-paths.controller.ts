// learning-paths.controller.ts - Learning Paths endpoints
//
// Controller này có MIX giữa public và protected routes:
//   - GET routes: public (ai cũng xem được danh sách learning paths)
//   - POST enroll: protected (chỉ user đã login mới enroll được)
//
// Tại sao KHÔNG đặt @UseGuards(JwtAuthGuard) ở class level?
// → Vì GET routes là public, không cần auth
// → Chỉ đặt guard trên từng method cần auth (POST enroll)
// → Khác với OnboardingController (tất cả routes đều cần auth)

import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { CurrentUser, JwtPayload } from '../../common/decorators/index.js';
import { JwtAuthGuard } from '../auth/index.js';
import { SlugParamDto } from './dto/index.js';
import { LearningPathsService } from './learning-paths.service.js';

@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly learningPathsService: LearningPathsService) {}

  // ── GET /api/v1/learning-paths ──────────────────────────────────────────

  /**
   * Liệt kê tất cả learning paths đã published.
   * Public endpoint — ai cũng xem được (dùng cho landing page, marketing).
   *
   * Response: { success: true, data: [{ id, name, slug, description, ... }] }
   */
  @Get()
  async listPaths() {
    return this.learningPathsService.listPaths();
  }

  // ── GET /api/v1/learning-paths/:slug ────────────────────────────────────

  /**
   * Lấy chi tiết 1 learning path theo slug.
   * Public — hiển thị tracks, lesson count để user preview trước khi enroll.
   *
   * @param slug - URL-friendly identifier (vd: "frontend-developer")
   * Response 200: path detail + tracks
   * Response 404: path không tồn tại hoặc chưa published
   */
  @Get(':slug')
  async getPathBySlug(@Param() params: SlugParamDto) {
    return this.learningPathsService.getPathBySlug(params.slug);
  }

  // ── GET /api/v1/learning-paths/:slug/lessons ────────────────────────────

  /**
   * Lấy tất cả lessons trong 1 learning path, grouped by track.
   * Public — để user xem outline trước khi quyết định enroll.
   *
   * @param slug - Learning path slug
   * Response 200: tracks[].lessons[]
   * Response 404: path không tồn tại
   */
  @Get(':slug/lessons')
  async getPathLessons(@Param() params: SlugParamDto) {
    return this.learningPathsService.getPathLessons(params.slug);
  }

  // ── POST /api/v1/learning-paths/:slug/enroll ────────────────────────────

  /**
   * User đăng ký (enroll) vào 1 learning path.
   * Tạo UserLearningPath record, set currentLessonId = bài đầu tiên.
   *
   * @param slug - Learning path slug
   * Response 201: UserLearningPath vừa tạo
   * Response 404: path không tồn tại hoặc chưa published
   * Response 409: user đã enroll path này rồi (ConflictException)
   * Response 422: path chưa có tracks/lessons (UnprocessableEntityException)
   */
  @Post(':slug/enroll')
  @UseGuards(JwtAuthGuard) // Chỉ route này cần auth — user phải login để enroll
  @HttpCode(HttpStatus.CREATED) // 201 vì tạo mới UserLearningPath record
  async enrollInPath(
    @Param() params: SlugParamDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.learningPathsService.enrollInPath(userId, params.slug);
  }
}
