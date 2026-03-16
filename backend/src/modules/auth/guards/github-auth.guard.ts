// github-auth.guard.ts - Guard kích hoạt GitHub OAuth flow
//
// Override handleRequest() để xử lý Passport 0.7 gọi 2 lần:
//   Lần 1: strategy.validate() → trả user hợp lệ ✅
//   Lần 2: session serialization fail → user=false ❌
//
// Fix: Cache user từ lần 1, return cached user ở lần 2
// (Cùng pattern với GoogleAuthGuard)

import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  private readonly logger = new Logger(GithubAuthGuard.name);

  // Không dùng Passport session (DevPath dùng JWT)
  getAuthenticateOptions() {
    return { session: false };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = (await super.canActivate(context)) as boolean;
      return result;
    } catch (err) {
      const request = context.switchToHttp().getRequest();
      request.authError = err;
      this.logger.error(
        `GitHub OAuth strategy failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return true;
    }
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Passport 0.7 gọi handleRequest() 2 lần cho OAuth callback:
    //   Lần 1: user = OAuthProfile (từ validate()) → cache lại
    //   Lần 2: user = false (session serialize fail) → trả cached user
    if (user && typeof user === 'object' && Object.keys(user).length > 0) {
      request._oauthUser = user;
      return user;
    }

    // Lần 2: trả cached user từ lần 1 (nếu có)
    if (request._oauthUser) {
      return request._oauthUser;
    }

    // Không có user từ bất kỳ lần nào → lỗi thật
    if (!request.authError) {
      request.authError = err || new Error('GitHub authentication failed');
      this.logger.error(
        `GitHub OAuth handleRequest failed: ${err?.message || 'No user returned'}`,
      );
    }
    return {};
  }
}
