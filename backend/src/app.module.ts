import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/index.js';
import { AuthModule } from './modules/auth/index.js';
import { OnboardingModule } from './modules/onboarding/index.js';

@Module({
  imports: [
    // ConfigModule loads environment variables from .env file
    // isGlobal: true makes ConfigService available everywhere
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // PrismaModule is @Global() so it's available everywhere
    PrismaModule,

    // ThrottlerModule: Global rate limiting
    // Bảo vệ TOÀN BỘ API khỏi abuse (DDoS, scraping...)
    // Default: 100 requests per 60 seconds per IP
    // Có thể override per-route bằng @Throttle() decorator
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('RATE_LIMIT_TTL', 60000),
          limit: config.get<number>('RATE_LIMIT_MAX', 100),
        },
      ],
    }),

    // AuthModule: JWT token generation, strategies, guards, OTP flow
    AuthModule,

    // OnboardingModule: onboarding questions, submit answers, AI recommendation, confirm path
    OnboardingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Register ThrottlerGuard globally
    // Mọi request sẽ bị check rate limit tự động
    // Không cần @UseGuards(ThrottlerGuard) trên từng route
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
