// github.strategy.ts - GitHub OAuth2 Strategy
//
// Flow tương tự Google nhưng có 1 edge case quan trọng:
//   GitHub KHÔNG luôn trả về email trong profile!
//   - User có thể set email là private trên GitHub
//   - scope 'user:email' cho phép đọc email nhưng vẫn có thể rỗng
//   - Ta bắt buộc cần email → throw error nếu không có
//
// Tại sao scope 'user:email' thay vì chỉ 'user'?
//   - 'user': đọc thông tin public (username, avatar, etc.)
//   - 'user:email': cho phép đọc TẤT CẢ email addresses (kể cả private)

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import type { OAuthProfile } from '../auth.service.js';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<void> {
    // Edge case: GitHub có thể không trả email
    // profile.emails có thể là undefined hoặc mảng rỗng
    const email = profile.emails?.[0]?.value;

    if (!email) {
      return done(
        new UnauthorizedException(
          'GitHub account must have a public email. Please set your email to public in GitHub settings.',
        ),
      );
    }

    const oauthProfile: OAuthProfile = {
      provider: 'github',
      providerId: profile.id,
      email,
      // GitHub: displayName có thể null, fallback sang username
      displayName: profile.displayName || profile.username,
      avatarUrl: profile.photos?.[0]?.value,
    };

    done(null, oauthProfile);
  }
}
