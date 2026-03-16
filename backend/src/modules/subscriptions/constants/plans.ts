// constants/plans.ts - Subscription plan definitions
//
// Defines the 3 tiers available in DevPath:
//   FREE  -> 10 AI interactions/day, no payment required
//   PRO   -> 100 AI interactions/day, 99,000 VND/month
//   ULTRA -> 500 AI interactions/day, 199,000 VND/month
//
// SUBSCRIPTION_PLANS is a lookup Record keyed by UserTier enum.
// Used by:
//   - SubscriptionsService.getPlans() -> GET /subscriptions/plans
//   - AiChatService quota calculation
//   - Tab 3: CreatePaymentDto validation (price lookup)

import { UserTier } from '@prisma/client';

export interface PlanInfo {
  tier: UserTier;
  name: string;
  price: number; // VND/month (0 = free)
  dailyAiLimit: number; // Max AI interactions per day
  description: string;
}

export const SUBSCRIPTION_PLANS: Record<UserTier, PlanInfo> = {
  [UserTier.FREE]: {
    tier: UserTier.FREE,
    name: 'Free',
    price: 0,
    dailyAiLimit: 10,
    description:
      'Gói miễn phí. Truy cập toàn bộ nội dung học, 10 lượt AI chat/ngày.',
  },
  [UserTier.PRO]: {
    tier: UserTier.PRO,
    name: 'Pro',
    price: 99000,
    dailyAiLimit: 100,
    description:
      'Gói Pro 99,000đ/tháng. 100 lượt AI chat/ngày, ưu tiên hỗ trợ.',
  },
  [UserTier.ULTRA]: {
    tier: UserTier.ULTRA,
    name: 'Ultra',
    price: 199000,
    dailyAiLimit: 500,
    description:
      'Gói Ultra 199,000đ/tháng. 500 lượt AI chat/ngày, hỗ trợ 24/7.',
  },
};
