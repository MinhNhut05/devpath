// google.strategy.ts - Google OAuth2 Strategy
//
// Flow:
//   1. User click "Login with Google" → frontend redirect tới GET /auth/google
//   2. GoogleAuthGuard kích hoạt strategy này → redirect tới Google consent screen
//   3. User đồng ý → Google redirect về GET /auth/google/callback với auth code
//   4. Passport tự động exchange code → access token → gọi Google API lấy profile
//   5. validate() được gọi với profile → map thành OAuthProfile chuẩn
//   6. Return value được gắn vào request.user → controller xử lý tiếp
//
// Tại sao scope cần 'email' + 'profile'?
//   - 'email': lấy email address (bắt buộc cho login)
//   - 'profile': lấy displayName, avatar (optional nhưng UX tốt hơn)

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import type { OAuthProfile } from '../auth.service.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      return done(
        new UnauthorizedException(
          'Could not retrieve email from Google account. Please ensure your Google account has a verified email.',
        ),
      );
    }

    const oauthProfile: OAuthProfile = {
      provider: 'google',
      providerId: profile.id,
      email,
      displayName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };

    // done(null, user) → Passport gắn user vào request.user
    done(null, oauthProfile);
  }
}
