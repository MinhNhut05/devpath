// github.strategy.ts - GitHub OAuth2 Strategy
//
// Flow tương tự Google nhưng có 1 edge case quan trọng:
//   GitHub KHÔNG luôn trả về email trong profile!
//   - User có thể set email là private trên GitHub
//   - scope 'user:email' cho phép đọc email nhưng profile.emails vẫn rỗng
//
// GIẢI PHÁP: Khi profile.emails rỗng → dùng accessToken gọi
//   GitHub API /user/emails trực tiếp → lấy email primary+verified
//
// Tại sao scope 'user:email' thay vì chỉ 'user'?
//   - 'user': đọc thông tin public (username, avatar, etc.)
//   - 'user:email': cho phép đọc TẤT CẢ email addresses (kể cả private)
//     VÀ cho phép gọi GET /user/emails API

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import type { OAuthProfile } from '../auth.service.js';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubStrategy.name);

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
    // Bước 1: Thử lấy email từ profile (nếu user set email public)
    let email = profile.emails?.[0]?.value;

    // Bước 2: Nếu không có → gọi GitHub API /user/emails
    // Đây là edge case phổ biến: ~30% GitHub users set email private
    if (!email) {
      this.logger.warn(
        'No email in profile, fetching from GitHub /user/emails API...',
      );
      try {
        email = await this.fetchPrimaryEmail(accessToken);
      } catch (err) {
        this.logger.error(
          `Failed to fetch email from GitHub API: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (!email) {
      return done(
        new UnauthorizedException(
          'Không thể lấy email từ GitHub. Vui lòng vào GitHub Settings → Emails → bỏ chọn "Keep my email addresses private", sau đó thử lại.',
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

  /**
   * Gọi GitHub API để lấy email khi profile.emails rỗng.
   *
   * GET https://api.github.com/user/emails
   * → Trả về mảng emails, ta tìm email primary + verified
   *
   * Tại sao cần cả primary VÀ verified?
   *   - primary: email chính của user
   *   - verified: đã xác thực (tránh fake email)
   *   - Fallback: nếu không có verified → lấy primary
   *   - Fallback 2: nếu không có primary → lấy email đầu tiên
   */
  private async fetchPrimaryEmail(accessToken: string): Promise<string | null> {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevPath-Learning', // GitHub API yêu cầu User-Agent
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const emails: Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }> = await response.json();

    // Ưu tiên: primary + verified > primary > bất kỳ email nào
    const primaryVerified = emails.find((e) => e.primary && e.verified);
    if (primaryVerified) return primaryVerified.email;

    const primary = emails.find((e) => e.primary);
    if (primary) return primary.email;

    // Fallback cuối: email đầu tiên trong list
    return emails[0]?.email || null;
  }
}
