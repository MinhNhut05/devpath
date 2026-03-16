// create-payment.dto.ts - DTO cho POST /subscriptions/create-payment (Tab 3)
//
// Validate body khi user muon mua subscription:
//   - tier: chi cho phep PRO hoac ULTRA (FREE thi khong mua)
//   - provider: chon MOMO hoac VNPAY
//
// File nay duoc tao o Tab 2 de Tab 3 co the import luon khi implement POST.

import { IsEnum, IsNotIn } from 'class-validator';
import { UserTier, PaymentProvider } from '@prisma/client';

export class CreatePaymentDto {
  // tier: tier muon nang cap len
  // @IsNotIn([UserTier.FREE]) -> khong the "mua" goi Free
  @IsEnum(UserTier, { message: 'tier must be a valid UserTier (PRO or ULTRA)' })
  @IsNotIn([UserTier.FREE], { message: 'Cannot purchase FREE tier' })
  tier!: UserTier;

  // provider: cong thanh toan
  @IsEnum(PaymentProvider, {
    message: 'provider must be MOMO or VNPAY',
  })
  provider!: PaymentProvider;
}
