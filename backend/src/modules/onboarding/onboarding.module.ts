import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/index.js';
import { OnboardingService } from './onboarding.service.js';
import { OnboardingController } from './onboarding.controller.js';

@Module({
  imports: [
    // AuthModule: cung cap JwtAuthGuard + JwtStrategy (de verify token)
    AuthModule,
  ],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    // AiService da duoc @Global() AiModule provide -> tu dong available
    // Khong can import AiModule hay register AiService o day
  ],
  // exports: khong can export gi tu OnboardingModule
  // (cac module khac khong dung OnboardingService)
})
export class OnboardingModule {}
