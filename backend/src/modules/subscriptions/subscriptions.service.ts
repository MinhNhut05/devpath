// subscriptions.service.ts - Business logic cho Subscriptions module
//
// Tab 2 (GET endpoints):
//   getPlans()                 -> tra ve danh sach 3 plans (public)
//   getCurrentSubscription()   -> subscription dang active cua user
//   getPaymentHistory()        -> lich su giao dich (co pagination)
//
// Tab 5 (Integration):
//   createPaymentOrder()       -> tao payment order + redirect URL
//   handleMoMoWebhook()        -> xu ly MoMo IPN callback
//   handleVNPayWebhook()       -> xu ly VNPay IPN callback
//
// PrismaService duoc inject tu PrismaModule (@Global) -> khong can import PrismaModule

import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider, PaymentStatus, UserTier } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { SUBSCRIPTION_PLANS, type PlanInfo } from './constants/plans.js';
import { PaymentHistoryQueryDto, CreatePaymentDto, MoMoWebhookDto } from './dto/index.js';
import { MoMoService } from './payments/momo.service.js';
import { VNPayService } from './payments/vnpay.service.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly momoService: MoMoService,
    private readonly vnpayService: VNPayService,
    private readonly configService: ConfigService,
  ) {}

  // ── getPlans ─────────────────────────────────────────────────────────────
  // Tra ve danh sach tat ca subscription plans.
  // Public endpoint -> khong can userId.
  // SUBSCRIPTION_PLANS la Record<UserTier, PlanInfo> -> lay values de ra array.
  getPlans(): PlanInfo[] {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  // ── getCurrentSubscription ────────────────────────────────────────────────
  // Lay subscription dang active cua user + tier hien tai cua user.
  //
  // Dung Promise.all de chay 2 queries parallel -> nhanh hon sequential.
  // subscription: tim ban ghi Subscription voi isActive = true.
  // user.tier: tier hien tai (co the da expired nhung chua update cron).
  async getCurrentSubscription(userId: string) {
    const [subscription, user] = await Promise.all([
      this.prisma.subscription.findFirst({
        where: { userId, isActive: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true }, // Chi lay tier, khong can ca user record
      }),
    ]);

    return { tier: user?.tier, subscription };
  }

  // ── getPaymentHistory ─────────────────────────────────────────────────────
  // Lay lich su giao dich cua user (tat ca status: PENDING, COMPLETED, FAILED...).
  //
  // Pagination: limit + offset tu PaymentHistoryQueryDto.
  // Nullish coalescing (??) de dung default value khi query param = undefined.
  // orderBy: createdAt desc -> moi nhat len dau.
  async getPaymentHistory(userId: string, query: PaymentHistoryQueryDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    // Chay 2 queries parallel: lay items + dem total
    const [items, total] = await Promise.all([
      this.prisma.paymentLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.paymentLog.count({ where: { userId } }),
    ]);

    return { items, total, limit, offset };
  }

  // ── createPaymentOrder ─────────────────────────────────────────────────────
  // Tao payment order moi va tra ve URL de redirect user den trang thanh toan.
  //
  // Flow:
  // 1. Check user khong co active subscription -> ConflictException neu da co
  // 2. Generate orderId unique: DEVPATH_{timestamp}_{userId prefix}
  // 3. Lookup price tu SUBSCRIPTION_PLANS
  // 4. Create PaymentLog (PENDING) trong DB
  // 5. Goi payment provider (MoMo hoac VNPay) de lay payment URL
  // 6. Return { paymentUrl, orderId }
  //
  // Tai sao block khi da co active sub?
  // -> Tranh tinh trang user mua 2 subscription cung luc
  // -> User can huy/cho het han subscription cu truoc khi mua moi
  async createPaymentOrder(
    userId: string,
    dto: CreatePaymentDto,
    ipAddr?: string,
  ) {
    // Step 1: Check active subscription -> block neu da co
    const activeSub = await this.prisma.subscription.findFirst({
      where: { userId, isActive: true },
    });

    if (activeSub) {
      throw new ConflictException(
        'You already have an active subscription. Please wait until it expires or cancel it first.',
      );
    }

    // Step 2: Generate unique orderId
    // Format: DEVPATH_{timestamp}_{userId first 8 chars}
    // Unique vi timestamp + userId prefix
    const orderId = `DEVPATH_${Date.now()}_${userId.slice(0, 8)}`;

    // Step 3: Lookup price tu plan config
    const plan = SUBSCRIPTION_PLANS[dto.tier];
    const amount = plan.price;
    const orderInfo = `DevPath ${plan.name} subscription - 1 month`;

    // Step 4: Create PaymentLog (PENDING) — luu truoc de webhook co the tim duoc
    await this.prisma.paymentLog.create({
      data: {
        userId,
        provider: dto.provider,
        amount,
        status: PaymentStatus.PENDING,
        orderId,
        tier: dto.tier,
      },
    });

    // Step 5: Goi payment provider de tao payment URL
    let paymentUrl: string | undefined;

    if (dto.provider === PaymentProvider.MOMO) {
      const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
      const backendUrl = this.configService.get('BACKEND_URL', 'http://localhost:3001');

      const result = await this.momoService.createPayment({
        orderId,
        amount,
        orderInfo,
        redirectUrl: `${frontendUrl}/payment/callback`,
        ipnUrl: `${backendUrl}/api/v1/subscriptions/webhook/momo`,
      });

      paymentUrl = result.paymentUrl;
    } else if (dto.provider === PaymentProvider.VNPAY) {
      const result = this.vnpayService.createPayment({
        orderId,
        amount,
        orderInfo,
        ipAddr: ipAddr ?? '127.0.0.1',
      });

      paymentUrl = result.paymentUrl;
    }

    // Step 6: Return payment URL + orderId
    return { paymentUrl, orderId };
  }

  // ── handleMoMoWebhook ─────────────────────────────────────────────────────
  // Xu ly MoMo IPN (Instant Payment Notification) callback.
  //
  // MoMo gui POST request den ipnUrl khi user thanh toan xong.
  // Flow:
  // 1. Verify HMAC-SHA256 signature -> BadRequestException neu sai
  // 2. Tim PaymentLog theo orderId -> NotFoundException neu khong co
  // 3. Neu resultCode === 0 (success):
  //    - Interactive $transaction: create Subscription + update PaymentLog + update User tier
  // 4. Neu resultCode !== 0 (failed):
  //    - Update PaymentLog status = FAILED
  //
  // Tai sao dung interactive $transaction?
  // -> 3 operations phu thuoc nhau (can subscriptionId tu create de update PaymentLog)
  // -> Neu 1 fail -> ca 3 rollback -> data consistency
  async handleMoMoWebhook(body: MoMoWebhookDto) {
    // Step 1: Verify signature
    const isValid = this.momoService.verifySignature(body);
    if (!isValid) {
      throw new BadRequestException('Invalid signature');
    }

    // Step 2: Tim PaymentLog theo orderId
    const paymentLog = await this.prisma.paymentLog.findFirst({
      where: { orderId: body.orderId },
    });

    if (!paymentLog) {
      throw new NotFoundException('Order not found');
    }

    // Step 3: Xu ly ket qua thanh toan
    if (body.resultCode === 0) {
      // Success -> interactive $transaction
      await this.prisma.$transaction(async (tx) => {
        // Create Subscription (30 days)
        const subscription = await tx.subscription.create({
          data: {
            userId: paymentLog.userId,
            tier: paymentLog.tier,
            paymentProvider: PaymentProvider.MOMO,
            startsAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            isActive: true,
          },
        });

        // Update PaymentLog: COMPLETED + transactionId + subscriptionId
        await tx.paymentLog.update({
          where: { id: paymentLog.id },
          data: {
            status: PaymentStatus.COMPLETED,
            transactionId: String(body.transId),
            subscriptionId: subscription.id,
            rawResponse: body as any,
          },
        });

        // Update User tier
        await tx.user.update({
          where: { id: paymentLog.userId },
          data: { tier: paymentLog.tier },
        });
      });
    } else {
      // Failed -> update PaymentLog only
      await this.prisma.paymentLog.update({
        where: { id: paymentLog.id },
        data: {
          status: PaymentStatus.FAILED,
          rawResponse: body as any,
        },
      });
    }
  }

  // ── handleVNPayWebhook ─────────────────────────────────────────────────────
  // Xu ly VNPay IPN callback.
  //
  // VNPay gui GET request voi query params khi user thanh toan xong.
  // Return format: { RspCode, Message } — VNPay yeu cau response nay.
  //
  // Tai sao return object thay vi throw exception?
  // -> VNPay yeu cau IPN response phai co format cu the { RspCode, Message }
  // -> Neu throw exception -> VNPay khong hieu va se retry lien tuc
  async handleVNPayWebhook(query: Record<string, string>) {
    // Step 1: Verify signature
    const isValid = this.vnpayService.verifySignature(query);
    if (!isValid) {
      return { RspCode: '97', Message: 'Invalid Signature' };
    }

    // Step 2: Tim PaymentLog theo vnp_TxnRef (orderId)
    const paymentLog = await this.prisma.paymentLog.findFirst({
      where: { orderId: query.vnp_TxnRef },
    });

    if (!paymentLog) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // Step 3: Xu ly ket qua thanh toan
    if (query.vnp_ResponseCode === '00') {
      // Success -> interactive $transaction
      await this.prisma.$transaction(async (tx) => {
        // Create Subscription (30 days)
        const subscription = await tx.subscription.create({
          data: {
            userId: paymentLog.userId,
            tier: paymentLog.tier,
            paymentProvider: PaymentProvider.VNPAY,
            startsAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isActive: true,
          },
        });

        // Update PaymentLog: COMPLETED
        await tx.paymentLog.update({
          where: { id: paymentLog.id },
          data: {
            status: PaymentStatus.COMPLETED,
            transactionId: query.vnp_TransactionNo,
            subscriptionId: subscription.id,
            rawResponse: query as any,
          },
        });

        // Update User tier
        await tx.user.update({
          where: { id: paymentLog.userId },
          data: { tier: paymentLog.tier },
        });
      });
    } else {
      // Failed -> update PaymentLog only
      await this.prisma.paymentLog.update({
        where: { id: paymentLog.id },
        data: {
          status: PaymentStatus.FAILED,
          rawResponse: query as any,
        },
      });
    }

    // Step 4: Return VNPay-required response format
    return { RspCode: '00', Message: 'Confirm Success' };
  }
}
