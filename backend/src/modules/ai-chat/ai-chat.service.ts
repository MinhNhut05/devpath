// ai-chat.service.ts - Business logic cho AI Chat feature
//
// AiService (shared) duoc inject tu @Global() AiModule.
// PrismaService duoc inject tu @Global() PrismaModule.
// ConfigService la global (ConfigModule.forRoot({ isGlobal: true })).
// AiContextBuilder build system prompt tu database context (lesson, progress, quiz).

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/index.js';
import { AiService } from '../ai/index.js';
import { AiContextBuilder } from './context/index.js';
import type { ChatMessageDto } from './dto/index.js';
import type { ChatHistoryQueryDto } from './dto/index.js';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly configService: ConfigService, // global — khong can add vao module
    private readonly contextBuilder: AiContextBuilder,
  ) {}

  /**
   * Xu ly tin nhan chat tu user va tra ve AI response.
   *
   * Flow:
   *  0. Check & update quota (throw neu het)
   *  1. Xac dinh model se dung (validate tier neu dto.model co truyen)
   *  2. Build context tu database (lesson, progress, quiz) → system prompt
   *  3. Goi aiService.chat() voi system prompt + message
   *  4. Log interaction vao bang AIInteractionLog
   *  5. Tra ve { message, model, context }
   */
  async chat(userId: string, dto: ChatMessageDto) {
    // --- Buoc 0: Kiem tra quota truoc khi lam bat ky viec gi ---
    // Neu het quota → throw BadRequestException ngay, khong ton resource AI
    await this.checkAndUpdateQuota(userId);

    // --- Buoc 1: Xac dinh model se dung ---
    // TODO: doc tier thuc tu Subscription khi branch payment hoan thanh
    // Tam thoi: tat ca users deu la 'free' tier
    const tier = 'free';
    const availableModels = this.aiService.getAvailableModels(tier);

    let selectedModel: string;
    if (dto.model) {
      // User chi dinh model cu the → validate xem co nam trong tier khong
      if (!availableModels.includes(dto.model)) {
        throw new BadRequestException('Model not available for your tier');
      }
      selectedModel = dto.model;
    } else {
      // Dung model mac dinh tu env AI_MODEL (fallback: gemini-2.5-flash)
      selectedModel = this.configService.get<string>('AI_MODEL', 'gemini-2.5-flash');
    }

    // --- Buoc 2: Build context tu database ---
    // AiContextBuilder query lesson, progress, quiz scores → render system prompt
    const { systemPrompt } = await this.contextBuilder.buildContext(userId, dto.lessonId);

    // --- Buoc 3: Goi AI ---
    const startTime = Date.now();
    let aiResponse: string;
    try {
      aiResponse = await this.aiService.chat(systemPrompt, dto.message, {
        model: selectedModel,
      });
    } catch (error) {
      // Chi AI fail moi tra fallback — loi validate van throw nhu binh thuong
      this.logger.error(`AI call failed for userId=${userId}`, error);
      return {
        message: 'Hệ thống AI đang bận. Vui lòng thử lại sau.',
        model: null,
        fallback: true,
      };
    }
    const responseTimeMs = Date.now() - startTime;

    // --- Buoc 4: Log interaction vao DB ---
    const sessionContext = dto.lessonId ? 'lesson' : 'general';
    await this.prisma.aIInteractionLog.create({
      data: {
        userId,
        lessonId: dto.lessonId ?? null,
        sessionContext,
        // Luu 500 ky tu dau (tranh luu qua dai vao summary field)
        questionSummary: dto.message.substring(0, 500),
        responseSummary: aiResponse.substring(0, 500),
        // Uoc tinh token: ~4 chars / token (GPT convention)
        tokensUsed: Math.ceil((dto.message.length + aiResponse.length) / 4),
        modelUsed: selectedModel,
        responseTimeMs,
      },
    });

    // --- Buoc 5: Tra ve ket qua ---
    return {
      message: aiResponse,
      model: selectedModel,
      context: sessionContext,
    };
  }

  /**
   * Lay lich su chat cua user voi pagination (offset/limit).
   *
   * - Sort theo createdAt desc (moi nhat truoc)
   * - Tra ve items + total + hasMore de frontend biet con trang khong
   */
  async getChatHistory(userId: string, query: ChatHistoryQueryDto) {
    // Lay danh sach log va tong so ban ghi trong 1 round-trip
    const [items, total] = await Promise.all([
      this.prisma.aIInteractionLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: query.offset ?? 0,
        take: query.limit ?? 20,
        select: {
          id: true,
          lessonId: true,
          sessionContext: true,
          questionSummary: true,
          responseSummary: true,
          modelUsed: true,
          createdAt: true,
        },
      }),
      this.prisma.aIInteractionLog.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
      // hasMore: con ban ghi chua lay het khong?
      hasMore: (query.offset ?? 0) + items.length < total,
    };
  }

  /**
   * Lay thong tin quota AI con lai cua user trong ngay hom nay.
   *
   * - Tra ve so luot da dung, toi da, va con lai
   * - Default free tier: 10 luot/ngay (theo Prisma schema maxCount default)
   */
  async getQuota(userId: string) {
    // Lay dau ngay hom nay theo UTC (khop voi cot date kieu @db.Date trong Prisma)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const quota = await this.prisma.aIUsageQuota.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    // Neu chua co record hom nay → dung gia tri mac dinh
    const max = quota?.maxCount ?? 10;
    const used = quota?.usedCount ?? 0;

    return {
      date: today.toISOString().split('T')[0],
      used,
      max,
      remaining: Math.max(0, max - used),
    };
  }

  /**
   * Kiem tra quota truoc khi goi AI, sau do tang counter atomic.
   *
   * - Neu da het quota → throw BadRequestException
   * - Neu con quota → upsert voi increment de tranh race condition
   * - Duoc goi boi chat() truoc khi thuc hien AI request
   */
  async checkAndUpdateQuota(userId: string): Promise<void> {
    // Lay dau ngay UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Doc quota hien tai cua user hom nay
    const quota = await this.prisma.aIUsageQuota.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    const max = quota?.maxCount ?? 10;
    const used = quota?.usedCount ?? 0;

    // Neu da dung het quota → bao loi, khong cho goi AI
    if (used >= max) {
      throw new BadRequestException('Daily AI quota exceeded. Try again tomorrow.');
    }

    // Upsert: tao moi neu chua co record hom nay, tang +1 neu da co
    // Dung increment de tranh race condition khi nhieu request dong thoi
    await this.prisma.aIUsageQuota.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        usedCount: 1,
        maxCount: 10,
      },
      update: {
        usedCount: { increment: 1 },
      },
    });
  }

  /**
   * Lay danh sach models ma user duoc phep su dung.
   *
   * TODO: doc tier thuc tu Subscription khi branch payment hoan thanh.
   * Tam thoi: tat ca users deu la 'free' tier.
   */
  async getModels(userId: string) {
    // TODO: doc user tier tu DB khi co field tier trong schema
    // Tam thoi: tat ca users deu la 'free' tier
    this.logger.log(`Get models for userId=${userId}`);
    const tier = 'free';
    const models = this.aiService.getAvailableModels(tier);
    return { tier, models };
  }
}
