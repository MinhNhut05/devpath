// subscription-expiry.cron.ts - Cron job de tu dong deactivate expired subscriptions
//
// Chay moi ngay luc 00:00 (midnight).
// Tim tat ca subscriptions co isActive = true va expiresAt <= now.
// Deactivate subscriptions + reset user tier ve FREE.
//
// Tai sao dung array-based $transaction thay vi interactive?
// -> 2 updateMany doc lap nhau (khong phu thuoc ket qua cua nhau)
// -> Array-based don gian hon, Prisma tu handle rollback neu 1 trong 2 fail
//
// Tai sao dung Logger?
// -> Cron job chay background, khong co HTTP response de tra ve
// -> Logger giup monitor so luong subscriptions bi deactivate

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../../prisma/index.js';

@Injectable()
export class SubscriptionExpiryCron {
  private readonly logger = new Logger(SubscriptionExpiryCron.name);

  constructor(private readonly prisma: PrismaService) {}

  // Cron expression: '0 0 * * *' = at 00:00 every day
  // Second(0) Minute(0) Hour(*) DayOfMonth(*) Month(*) DayOfWeek(*)
  @Cron('0 0 * * *')
  async handleExpiredSubscriptions() {
    const now = new Date();

    // Step 1: Tim tat ca active subscriptions da het han
    const expiredSubs = await this.prisma.subscription.findMany({
      where: { isActive: true, expiresAt: { lte: now } },
      select: { id: true, userId: true },
    });

    // Khong co gi het han -> return som, khong can transaction
    if (expiredSubs.length === 0) return;

    // Step 2: Chuan bi data
    const subIds = expiredSubs.map((s) => s.id);
    // new Set de loai bo duplicate userId (1 user co the co nhieu expired subs)
    const userIds = [...new Set(expiredSubs.map((s) => s.userId))];

    // Step 3: Array-based $transaction — 2 updateMany chay atomic
    // Neu 1 fail -> ca 2 rollback -> data consistency
    await this.prisma.$transaction([
      // Deactivate tat ca expired subscriptions
      this.prisma.subscription.updateMany({
        where: { id: { in: subIds } },
        data: { isActive: false },
      }),
      // Reset user tier ve FREE
      this.prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { tier: 'FREE' },
      }),
    ]);

    this.logger.log(
      `Deactivated ${expiredSubs.length} expired subscriptions`,
    );
  }
}
