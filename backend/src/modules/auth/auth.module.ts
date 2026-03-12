// auth.module.ts - Authentication module registration
//
// Module trong NestJS giống như "container" (hộp chứa):
// - imports: module nào module này CẦN (dependencies)
// - providers: service/strategy/guard nào module này TẠO RA (nội bộ)
// - exports: cái gì module KHÁC được phép dùng (public API)
//
// AuthModule KHÔNG dùng @Global() — tại sao?
// → @Global() làm module available ở MỌI NƠI mà không cần import
// → Tốt cho PrismaModule (dùng ở khắp nơi), nhưng Auth thì chỉ cần ở vài chỗ
// → Explicit import (import tường minh) tốt hơn: dễ trace dependency

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy, GoogleStrategy, GithubStrategy } from './strategies/index.js';
import { JwtAuthGuard, GoogleAuthGuard, GithubAuthGuard, RolesGuard } from './guards/index.js';
import { MailModule } from '../mail/index.js';

@Module({
  imports: [
    // PassportModule: cần thiết để Passport strategies hoạt động
    // defaultStrategy: 'jwt' → khi dùng @UseGuards(AuthGuard()) không cần truyền tên
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JwtModule.registerAsync() thay vì JwtModule.register() — tại sao?
    //
    // register({ secret: 'hardcode' })
    //   → Giá trị phải có NGAY lúc import → không thể đọc từ .env
    //
    // registerAsync({ useFactory: (config) => ... })
    //   → Chờ ConfigService load xong → rồi mới tạo config
    //   → Đọc được từ .env file
    //
    // Config này áp dụng cho jwtService.sign() MẶC ĐỊNH:
    //   - Khi gọi jwtService.sign(payload) → dùng JWT_ACCESS_SECRET + 15m
    //   - Khi gọi jwtService.sign(payload, { secret: '...' }) → override
    JwtModule.registerAsync({
      inject: [ConfigService], // Dependencies cần truyền vào useFactory

      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          // Cast: ConfigService.get() trả về `string`, nhưng JwtModule yêu cầu
          // branded `StringValue` type từ package 'ms'. Giá trị thật như '15m'
          // là hợp lệ — TypeScript chỉ không verify được tại compile time.
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as any,
        },
      }),
    }),

    // MailModule: cung cấp MailService để gửi email OTP
    MailModule,
  ],

  controllers: [AuthController],

  providers: [
    AuthService, // Business logic: generate/validate tokens, OAuth user management
    JwtStrategy, // Passport strategy: verify Access Token từ Bearer header
    GoogleStrategy, // Passport strategy: Google OAuth2 flow
    GithubStrategy, // Passport strategy: GitHub OAuth2 flow
    JwtAuthGuard, // Guard: kích hoạt JwtStrategy, gán user vào request.user
    GoogleAuthGuard, // Guard: kích hoạt Google OAuth flow
    GithubAuthGuard, // Guard: kích hoạt GitHub OAuth flow
    RolesGuard, // Guard: kiểm tra user role (dùng với @Roles() decorator)
  ],

  exports: [
    AuthService, // → Các module khác dùng generateTokenPair()
    JwtAuthGuard, // → Các module khác dùng @UseGuards(JwtAuthGuard)
    RolesGuard, // → Các module khác dùng @UseGuards(RolesGuard)
    // JwtStrategy KHÔNG export → chỉ dùng nội bộ AuthModule
  ],
})
export class AuthModule {}
