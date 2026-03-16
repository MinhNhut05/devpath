// subscription-expiry.cron.spec.ts - Unit tests cho SubscriptionExpiryCron
//
// Tach rieng vi SubscriptionExpiryCron la class rieng, chi can mock PrismaService.
// 2 test cases:
//   1. No expired subs -> does nothing, $transaction NOT called
//   2. Expired subs found -> $transaction called with 2 updateMany

import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/index.js';
import { SubscriptionExpiryCron } from './subscription-expiry.cron.js';

describe('SubscriptionExpiryCron', () => {
  let cron: SubscriptionExpiryCron;
  let prisma: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      subscription: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        updateMany: jest.fn(),
      },
      // Array-based $transaction mock
      $transaction: jest.fn().mockImplementation(async (arr) => {
        return Promise.all(arr);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionExpiryCron,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    cron = module.get<SubscriptionExpiryCron>(SubscriptionExpiryCron);
  });

  describe('handleExpiredSubscriptions', () => {
    it('should do nothing when no expired subscriptions found', async () => {
      prisma.subscription.findMany.mockResolvedValue([]);

      await cron.handleExpiredSubscriptions();

      // $transaction should NOT be called
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should deactivate expired subs and reset user tier to FREE', async () => {
      const expiredSubs = [
        { id: 'sub-1', userId: 'user-1' },
        { id: 'sub-2', userId: 'user-2' },
        { id: 'sub-3', userId: 'user-1' }, // same user, 2 expired subs
      ];

      prisma.subscription.findMany.mockResolvedValue(expiredSubs);
      prisma.subscription.updateMany.mockResolvedValue({ count: 3 });
      prisma.user.updateMany.mockResolvedValue({ count: 2 });

      await cron.handleExpiredSubscriptions();

      // $transaction should be called with array of 2 updateMany
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      // Verify subscription.updateMany was called with all 3 sub IDs
      expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['sub-1', 'sub-2', 'sub-3'] } },
        data: { isActive: false },
      });

      // Verify user.updateMany was called with unique user IDs (dedup)
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'user-2'] } },
        data: { tier: 'FREE' },
      });
    });
  });
});
