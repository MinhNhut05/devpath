// quizzes.controller.ts - Quiz endpoints
//
// Controller này handle 2 resource paths khác nhau:
//   - /api/v1/lessons/:slug/quiz → lấy quiz theo lesson slug
//   - /api/v1/quizzes/:id/...   → các operations trên quiz
//
// Tại sao không đặt @Controller('quizzes') prefix?
// → Vì có route bắt đầu bằng "lessons/" → không có shared prefix
// → Giải pháp: @Controller() không prefix, dùng full path trong decorators
//
// Tất cả routes cần @UseGuards(JwtAuthGuard):
//   → Quiz content là protected
//   → Submit/evaluate/run cần userId để track results
//
// POST routes dùng @HttpCode(HttpStatus.OK):
//   → Submit, evaluate, run-code là actions trên existing resource
//   → Không tạo resource mới → 200 thay vì 201

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/index.js';
import { JwtAuthGuard } from '../auth/index.js';
import { SlugParamDto, SubmitQuizDto, EvaluateEssayDto, RunCodeDto } from './dto/index.js';
import { QuizzesService } from './quizzes.service.js';

@Controller() // Không prefix — vì mix 2 paths: lessons/:slug/quiz + quizzes/:id
@UseGuards(JwtAuthGuard) // Tất cả routes cần login
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  // ── GET /api/v1/lessons/:slug/quiz ────────────────────────────────────────
  //
  // Lấy quiz gắn với lesson theo slug.
  // Dùng SlugParamDto để validate slug format (pattern từ LessonsController).
  // Response: quiz + questions (không chứa correctAnswer cho client)
  @Get('lessons/:slug/quiz')
  async getQuizByLessonSlug(
    @Param() params: SlugParamDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.quizzesService.getQuizByLessonSlug(userId, params.slug);
  }

  // ── GET /api/v1/quizzes/:id ───────────────────────────────────────────────
  //
  // Lấy quiz theo UUID.
  // Dùng ParseUUIDPipe để validate UUID format ở pipe level.
  @Get('quizzes/:id')
  async getQuizById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.quizzesService.getQuizById(userId, id);
  }

  // ── POST /api/v1/quizzes/:id/submit ───────────────────────────────────────
  //
  // Submit câu trả lời cho quiz (SINGLE_CHOICE + MULTIPLE_CHOICE).
  // @HttpCode(200) vì đây là action trên quiz, không tạo resource mới.
  // Body: { answers: [{ questionId, selected: ["a"] }] }
  @Post('quizzes/:id/submit')
  @HttpCode(HttpStatus.OK)
  async submitQuiz(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() submitQuizDto: SubmitQuizDto,
  ) {
    return this.quizzesService.submitQuiz(userId, id, submitQuizDto);
  }

  // ── GET /api/v1/quizzes/:id/results ───────────────────────────────────────
  //
  // Lấy kết quả quiz (history các lần attempt).
  // Response: list QuizResult records cho user + quiz này.
  @Get('quizzes/:id/results')
  async getQuizResults(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.quizzesService.getQuizResults(userId, id);
  }

  // ── POST /api/v1/quizzes/:id/evaluate-essay ──────────────────────────────
  //
  // Gửi câu trả lời essay để AI chấm điểm.
  // @HttpCode(200) vì đây là evaluate action, không tạo resource mới.
  // Body: { questionId, answer: "user's essay text" }
  @Post('quizzes/:id/evaluate-essay')
  @HttpCode(HttpStatus.OK)
  async evaluateEssay(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() evaluateEssayDto: EvaluateEssayDto,
  ) {
    return this.quizzesService.evaluateEssay(userId, id, evaluateEssayDto);
  }

  // ── POST /api/v1/quizzes/:id/run-code ────────────────────────────────────
  //
  // Chạy code challenge — execute code qua Judge0 API và check test cases.
  // @HttpCode(200) vì đây là run action, không tạo resource mới.
  // Body: { questionId, code: "user's code", language?: "javascript" }
  @Post('quizzes/:id/run-code')
  @HttpCode(HttpStatus.OK)
  async runCode(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() runCodeDto: RunCodeDto,
  ) {
    return this.quizzesService.runCode(userId, id, runCodeDto);
  }
}
