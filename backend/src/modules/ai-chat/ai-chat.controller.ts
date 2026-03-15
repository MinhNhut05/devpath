// ai-chat.controller.ts - AI Chat endpoints
//
// Tat ca routes can @UseGuards(JwtAuthGuard):
// -> User phai dang nhap truoc khi dung AI Chat
// -> req.user se co { id, email, role } sau khi guard validate token
//
// Base path: /api/v1/ai (vi GlobalPrefix = 'api/v1')

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/index.js';
import { AiChatService } from './ai-chat.service.js';
import { ChatMessageDto, ChatHistoryQueryDto } from './dto/index.js';

// req.user duoc gan boi JwtStrategy.validate()
// Shape: { id: string, email: string, role: string }
type JwtUser = { id: string; email: string; role: string };

@Controller('ai')
@UseGuards(JwtAuthGuard) // Tat ca AI Chat endpoints can auth
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  // ── POST /api/v1/ai/chat ────────────────────────────────────────────────

  /**
   * Gui tin nhan cho AI va nhan response.
   *
   * Body: { message: string, model?: string, lessonId?: string }
   * Response 200: AI response text
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK) // 200 vi khong tao resource moi (chat la action)
  async chat(@Req() req: Request, @Body() dto: ChatMessageDto) {
    const user = req.user as JwtUser;
    return this.aiChatService.chat(user.id, dto);
  }

  // ── GET /api/v1/ai/chat/history ─────────────────────────────────────────

  /**
   * Lay lich su chat cua user hien tai.
   *
   * Query: ?limit=20&offset=0
   * Response 200: { messages: [], total: number, limit, offset }
   */
  @Get('chat/history')
  async getChatHistory(
    @Req() req: Request,
    @Query() query: ChatHistoryQueryDto,
  ) {
    const user = req.user as JwtUser;
    return this.aiChatService.getChatHistory(user.id, query);
  }

  // ── GET /api/v1/ai/quota ───────────────────────────────────────────────

  /**
   * Lay thong tin quota AI chat con lai cua user.
   *
   * Response 200: { tier, dailyLimit, used, remaining }
   */
  @Get('quota')
  async getQuota(@Req() req: Request) {
    const user = req.user as JwtUser;
    return this.aiChatService.getQuota(user.id);
  }

  // ── GET /api/v1/ai/models ──────────────────────────────────────────────

  /**
   * Lay danh sach AI models ma user duoc phep su dung.
   *
   * Response 200: { tier, models: string[] }
   */
  @Get('models')
  async getModels(@Req() req: Request) {
    const user = req.user as JwtUser;
    return this.aiChatService.getModels(user.id);
  }
}
