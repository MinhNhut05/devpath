// subscriptions.controller.ts - Subscriptions API endpoints
//
// Base path: /api/v1/subscriptions (vi GlobalPrefix = 'api/v1')
//
// Tab 2 (GET endpoints):
//   GET /subscriptions/plans   -> public, khong can token
//   GET /subscriptions/current -> can JWT token
//   GET /subscriptions/history -> can JWT token, co pagination query
//
// Tab 5 (Integration endpoints):
//   POST /subscriptions/create          -> tao payment order (JWT required)
//   POST /subscriptions/webhook/momo    -> MoMo IPN callback (public)
//   GET  /subscriptions/webhook/vnpay   -> VNPay IPN callback (public)
//
// Webhook endpoints KHONG co @UseGuards -> payment providers can goi truc tiep.
// Security duoc dam bao boi signature verification trong service layer.

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/index.js';
import { SubscriptionsService } from './subscriptions.service.js';
import { PaymentHistoryQueryDto, CreatePaymentDto, MoMoWebhookDto } from './dto/index.js';

// req.user duoc gan boi JwtStrategy.validate()
// Shape: { id: string, email: string, role: string }
type JwtUser = { id: string; email: string; role: string };

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ── GET /api/v1/subscriptions/plans ──────────────────────────────────────
  /**
   * Lay danh sach tat ca subscription plans.
   * PUBLIC endpoint - khong can dang nhap.
   *
   * Response 200: PlanInfo[] (array 3 plans: FREE, PRO, ULTRA)
   */
  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  // ── GET /api/v1/subscriptions/current ────────────────────────────────────
  /**
   * Lay subscription dang active va tier hien tai cua user.
   * Yeu cau: Bearer token trong Authorization header.
   *
   * Response 200: { tier: UserTier, subscription: Subscription | null }
   */
  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentSubscription(@Req() req: Request) {
    const user = req.user as JwtUser;
    return this.subscriptionsService.getCurrentSubscription(user.id);
  }

  // ── GET /api/v1/subscriptions/history ────────────────────────────────────
  /**
   * Lay lich su giao dich cua user hien tai.
   * Yeu cau: Bearer token trong Authorization header.
   *
   * Query: ?limit=20&offset=0
   * Response 200: { items: PaymentLog[], total: number, limit: number, offset: number }
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getPaymentHistory(
    @Req() req: Request,
    @Query() query: PaymentHistoryQueryDto,
  ) {
    const user = req.user as JwtUser;
    return this.subscriptionsService.getPaymentHistory(user.id, query);
  }

  // ── POST /api/v1/subscriptions/create ────────────────────────────────────
  /**
   * Tao payment order moi va tra ve URL redirect den trang thanh toan.
   * Yeu cau: Bearer token trong Authorization header.
   *
   * Body: { tier: 'PRO' | 'ULTRA', provider: 'MOMO' | 'VNPAY' }
   * Response 201: { paymentUrl: string, orderId: string }
   *
   * Throws ConflictException neu user da co active subscription.
   */
  @Post('create')
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async createPayment(@Req() req: Request, @Body() dto: CreatePaymentDto) {
    const user = req.user as JwtUser;
    return this.subscriptionsService.createPaymentOrder(user.id, dto, req.ip);
  }

  // ── POST /api/v1/subscriptions/webhook/momo ──────────────────────────────
  /**
   * MoMo IPN (Instant Payment Notification) callback.
   * PUBLIC endpoint - MoMo server goi truc tiep, khong co JWT.
   * Security: HMAC-SHA256 signature verification trong service.
   *
   * Body: MoMoWebhookDto (partnerCode, orderId, resultCode, signature, ...)
   * Response 200: void (MoMo chi can HTTP 200 de xac nhan da nhan)
   */
  @Post('webhook/momo')
  @HttpCode(200)
  async momoWebhook(@Body() body: MoMoWebhookDto) {
    return this.subscriptionsService.handleMoMoWebhook(body);
  }

  // ── GET /api/v1/subscriptions/webhook/vnpay ──────────────────────────────
  /**
   * VNPay IPN callback.
   * PUBLIC endpoint - VNPay server goi truc tiep, khong co JWT.
   * Security: HMAC-SHA512 signature verification trong service.
   *
   * VNPay gui full query params (bao gom vnp_SecureHash) qua GET request.
   * Ta pass toan bo req.query de verify signature dung.
   *
   * Response 200: { RspCode: string, Message: string }
   * RspCode '00' = xac nhan thanh cong, '97' = sai signature, '01' = order not found
   */
  @Get('webhook/vnpay')
  @HttpCode(200)
  async vnpayWebhook(@Req() req: Request) {
    // Pass full query params cho signature verification
    return this.subscriptionsService.handleVNPayWebhook(
      req.query as Record<string, string>,
    );
  }
}
