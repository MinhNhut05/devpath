// subscriptions.module.ts - NestJS module registration cho Subscriptions
//
// imports: [AuthModule] -> cung cap JwtAuthGuard + JwtStrategy
// PrismaModule khong can import vi da @Global() trong app.module.ts
//
// providers: SubscriptionsService, MoMoService, VNPayService, SubscriptionExpiryCron
// exports: [SubscriptionsService] -> de cac module khac co the inject

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/index.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { SubscriptionsService } from './subscriptions.service.js';
import { MoMoService } from './payments/momo.service.js';
import { VNPayService } from './payments/vnpay.service.js';
import { SubscriptionExpiryCron } from './subscription-expiry.cron.js';

@Module({
  imports: [
    // AuthModule: cung cap JwtAuthGuard + JwtStrategy (de verify Bearer token)
    AuthModule,
  ],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    MoMoService, // Tab 3: MoMo payment integration
    VNPayService, // Tab 4: VNPay payment integration
    SubscriptionExpiryCron, // Cron: deactivate expired subs daily
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
