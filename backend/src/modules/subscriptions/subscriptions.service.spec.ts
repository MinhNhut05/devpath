// subscriptions.service.spec.ts - Unit tests cho SubscriptionsService
//
// Mock pattern: plain object + jest.fn() (giong progress.service.spec.ts)
// $transaction mock: ho tro ca interactive (function) va array-based
//
// 11 test cases, 6 describe blocks:
//   getPlans (1) | getCurrentSubscription (2) | createPaymentOrder (2)
//   handleMoMoWebhook (3) | handleVNPayWebhook (3)

import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentProvider, PaymentStatus, UserTier } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { SubscriptionsService } from './subscriptions.service.js';
import { MoMoService } from './payments/momo.service.js';
import { VNPayService } from './payments/vnpay.service.js';
import { ConfigService } from '@nestjs/config';

const mockUserId = 'user-uuid-123';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: any;
  let momoService: any;
  let vnpayService: any;
  let configService: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      subscription: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      paymentLog: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      // Mock $transaction: ho tro ca interactive (function) va array-based
      $transaction: jest.fn().mockImplementation(async (fnOrArray) => {
        if (typeof fnOrArray === 'function') return fnOrArray(prisma);
        return Promise.all(fnOrArray);
      }),
    };

    momoService = {
      createPayment: jest.fn(),
      verifySignature: jest.fn(),
    };

    vnpayService = {
      createPayment: jest.fn(),
      verifySignature: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('http://localhost:3001'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MoMoService, useValue: momoService },
        { provide: VNPayService, useValue: vnpayService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  // ── getPlans ──────────────────────────────────────────────────────────────

  describe('getPlans', () => {
    it('should return 3 plans with correct prices', () => {
      const plans = service.getPlans();

      expect(plans).toHaveLength(3);

      const free = plans.find((p) => p.tier === UserTier.FREE);
      const pro = plans.find((p) => p.tier === UserTier.PRO);
      const ultra = plans.find((p) => p.tier === UserTier.ULTRA);

      expect(free?.price).toBe(0);
      expect(pro?.price).toBe(99000);
      expect(ultra?.price).toBe(199000);
    });
  });

  // ── getCurrentSubscription ────────────────────────────────────────────────

  describe('getCurrentSubscription', () => {
    it('should return tier=FREE and subscription=null for FREE user', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ tier: UserTier.FREE });

      const result = await service.getCurrentSubscription(mockUserId);

      expect(result.tier).toBe(UserTier.FREE);
      expect(result.subscription).toBeNull();
    });

    it('should return tier=PRO and subscription object for PRO user', async () => {
      const mockSub = {
        id: 'sub-1',
        userId: mockUserId,
        tier: UserTier.PRO,
        isActive: true,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      prisma.subscription.findFirst.mockResolvedValue(mockSub);
      prisma.user.findUnique.mockResolvedValue({ tier: UserTier.PRO });

      const result = await service.getCurrentSubscription(mockUserId);

      expect(result.tier).toBe(UserTier.PRO);
      expect(result.subscription).toEqual(mockSub);
    });
  });

  // ── createPaymentOrder ────────────────────────────────────────────────────

  describe('createPaymentOrder', () => {
    it('should create PaymentLog + call momoService + return payment URL', async () => {
      // No active sub
      prisma.subscription.findFirst.mockResolvedValue(null);
      prisma.paymentLog.create.mockResolvedValue({});
      momoService.createPayment.mockResolvedValue({
        paymentUrl: 'https://momo.vn/pay/123',
        requestId: 'req-123',
      });

      const result = await service.createPaymentOrder(
        mockUserId,
        { tier: UserTier.PRO, provider: PaymentProvider.MOMO },
        '127.0.0.1',
      );

      expect(result.paymentUrl).toBe('https://momo.vn/pay/123');
      expect(result.orderId).toContain('DEVPATH_');
      expect(prisma.paymentLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          provider: PaymentProvider.MOMO,
          amount: 99000,
          status: PaymentStatus.PENDING,
          tier: UserTier.PRO,
        }),
      });
      expect(momoService.createPayment).toHaveBeenCalled();
    });

    it('should throw ConflictException if user has active subscription', async () => {
      // Active sub exists
      prisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-active',
        isActive: true,
      });

      await expect(
        service.createPaymentOrder(mockUserId, {
          tier: UserTier.PRO,
          provider: PaymentProvider.MOMO,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── handleMoMoWebhook ────────────────────────────────────────────────────

  describe('handleMoMoWebhook', () => {
    const mockMoMoBody = {
      partnerCode: 'MOMO',
      orderId: 'DEVPATH_123_user-uuid',
      requestId: 'req-123',
      amount: 99000,
      orderInfo: 'DevPath Pro subscription',
      orderType: 'momo_wallet',
      transId: 'trans-456',
      resultCode: 0,
      message: 'Successful.',
      payType: 'qr',
      responseTime: 1705312200000,
      extraData: '',
      signature: 'valid-sig',
    };

    it('should throw BadRequestException if signature is invalid', async () => {
      momoService.verifySignature.mockReturnValue(false);

      await expect(
        service.handleMoMoWebhook(mockMoMoBody),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create Subscription + update tier on resultCode=0', async () => {
      momoService.verifySignature.mockReturnValue(true);
      prisma.paymentLog.findFirst.mockResolvedValue({
        id: 'log-1',
        userId: mockUserId,
        tier: UserTier.PRO,
      });
      prisma.subscription.create.mockResolvedValue({ id: 'sub-new' });
      prisma.paymentLog.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      await service.handleMoMoWebhook(mockMoMoBody);

      // $transaction duoc goi (interactive mode)
      expect(prisma.$transaction).toHaveBeenCalled();
      // Subscription duoc tao
      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          tier: UserTier.PRO,
          paymentProvider: PaymentProvider.MOMO,
          isActive: true,
        }),
      });
      // User tier duoc update
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { tier: UserTier.PRO },
      });
    });

    it('should update PaymentLog to FAILED on resultCode!=0', async () => {
      momoService.verifySignature.mockReturnValue(true);
      prisma.paymentLog.findFirst.mockResolvedValue({
        id: 'log-1',
        userId: mockUserId,
        tier: UserTier.PRO,
      });
      prisma.paymentLog.update.mockResolvedValue({});

      await service.handleMoMoWebhook({
        ...mockMoMoBody,
        resultCode: 1006, // user cancelled
      });

      expect(prisma.paymentLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: expect.objectContaining({
          status: PaymentStatus.FAILED,
        }),
      });
      // Subscription should NOT be created
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });
  });

  // ── handleVNPayWebhook ────────────────────────────────────────────────────

  describe('handleVNPayWebhook', () => {
    const mockVNPayQuery: Record<string, string> = {
      vnp_TxnRef: 'DEVPATH_123_user-uuid',
      vnp_TransactionNo: '14095637',
      vnp_ResponseCode: '00',
      vnp_Amount: '9900000',
      vnp_OrderInfo: 'DevPath Pro subscription',
      vnp_SecureHash: 'valid-hash',
      vnp_PayDate: '20260115103000',
    };

    it('should return RspCode 97 if signature is invalid', async () => {
      vnpayService.verifySignature.mockReturnValue(false);

      const result = await service.handleVNPayWebhook(mockVNPayQuery);

      expect(result).toEqual({
        RspCode: '97',
        Message: 'Invalid Signature',
      });
    });

    it('should create Subscription + update tier on responseCode=00', async () => {
      vnpayService.verifySignature.mockReturnValue(true);
      prisma.paymentLog.findFirst.mockResolvedValue({
        id: 'log-1',
        userId: mockUserId,
        tier: UserTier.PRO,
      });
      prisma.subscription.create.mockResolvedValue({ id: 'sub-new' });
      prisma.paymentLog.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      const result = await service.handleVNPayWebhook(mockVNPayQuery);

      expect(result).toEqual({
        RspCode: '00',
        Message: 'Confirm Success',
      });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          tier: UserTier.PRO,
          paymentProvider: PaymentProvider.VNPAY,
          isActive: true,
        }),
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { tier: UserTier.PRO },
      });
    });

    it('should update PaymentLog to FAILED on responseCode!=00', async () => {
      vnpayService.verifySignature.mockReturnValue(true);
      prisma.paymentLog.findFirst.mockResolvedValue({
        id: 'log-1',
        userId: mockUserId,
        tier: UserTier.PRO,
      });
      prisma.paymentLog.update.mockResolvedValue({});

      const result = await service.handleVNPayWebhook({
        ...mockVNPayQuery,
        vnp_ResponseCode: '24', // user cancelled
      });

      expect(result).toEqual({
        RspCode: '00',
        Message: 'Confirm Success',
      });
      expect(prisma.paymentLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: expect.objectContaining({
          status: PaymentStatus.FAILED,
        }),
      });
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });
  });
});
