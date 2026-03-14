// onboarding.module.ts - Onboarding module registration
//
// Module nhỏ hơn AuthModule nhiều vì:
//   - Không cần JwtModule (chỉ dùng guard của AuthModule)
//   - Không cần PassportModule
//   - PrismaService có sẵn qua @Global() PrismaModule
//
// imports: [AuthModule] → để lấy JwtAuthGuard từ AuthModule
//   Tại sao phải import AuthModule?
//   → JwtAuthGuard được export từ AuthModule
//   → OnboardingController dùng @UseGuards(JwtAuthGuard)
//   → NestJS cần biết JwtAuthGuard đến từ đâu để inject đúng

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/index.js';
import { AiClient } from './recommendation/index.js';
import { OnboardingService } from './onboarding.service.js';
import { OnboardingController } from './onboarding.controller.js';

@Module({
  imports: [
    // AuthModule: cung cấp JwtAuthGuard + JwtStrategy (để verify token)
    AuthModule,
  ],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    // AiClient là @Injectable() → NestJS tự inject ConfigService vào constructor
    // ConfigModule.forRoot({ isGlobal: true }) → ConfigService available everywhere
    // Không cần import ConfigModule lại ở đây
    AiClient,
  ],
  // exports: không cần export gì từ OnboardingModule
  // (các module khác không dùng OnboardingService)
})
export class OnboardingModule {}
