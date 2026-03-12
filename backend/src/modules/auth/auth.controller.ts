// auth.controller.ts - Authentication endpoints
//
// Controller trong NestJS chỉ làm 2 việc:
//   1. Nhận request (validate input bằng DTO + ValidationPipe)
//   2. Gọi service method tương ứng, trả về response
//
// Controller KHÔNG chứa business logic → tất cả logic nằm trong AuthService
// → Tại sao? Separation of Concerns:
//   Controller = "lớp tiếp tân" (receptionist) → nhận request, trả response
//   Service = "lớp xử lý" (processor) → logic thực sự
//
// Response format (tự động bởi TransformInterceptor trong main.ts):
//   Success: { success: true, data: { ... }, meta: { timestamp, path } }
//   Error: { success: false, error: { code, message }, meta: { ... } }

import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { RequestOtpDto, VerifyOtpDto } from './dto/index.js';
import { GoogleAuthGuard, GithubAuthGuard, JwtAuthGuard } from './guards/index.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Request OTP ──────────────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/otp/request
   *
   * Gửi OTP code tới email của user.
   * Rate limited: 5 requests per email per hour (trong AuthService)
   *
   * Request body: { email: string }
   * Response: { success: true, data: { message: "If this email is valid..." } }
   */
  @Post('otp/request')
  @HttpCode(HttpStatus.OK) // 200 thay vì 201 (POST mặc định là 201)
  // Tại sao 200? Vì endpoint này KHÔNG tạo resource mới theo nghĩa REST
  // Nó chỉ trigger 1 action (gửi email) → 200 phù hợp hơn
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.email);
    // TransformInterceptor sẽ wrap thành:
    // { success: true, data: { message: "..." }, meta: { ... } }
  }

  // ─── Verify OTP ───────────────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/otp/verify
   *
   * Verify OTP code, trả về access token + set refresh token cookie.
   * Nếu email chưa có user → tự động tạo user mới (auto-creation)
   *
   * Request body: { email: string, code: string }
   * Response body: { success: true, data: { accessToken, user: { id, email, role, isNewUser } } }
   * Cookie: refreshToken (HttpOnly, Secure, SameSite=Strict, 7 days)
   *
   * @Res({ passthrough: true }) — Cho phép set cookie MÀ VẪN giữ TransformInterceptor
   * Nếu dùng @Res() (không có passthrough) → NestJS bỏ qua interceptor → response không được wrap
   */
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(dto.email, dto.code);

    // Set refresh token cookie (dùng helper method chung với OAuth)
    this.setRefreshTokenCookie(res, result.refreshToken);

    // Trả về accessToken + user trong response body
    // refreshToken KHÔNG trả về trong body → chỉ có trong cookie
    // → Client lưu accessToken trong memory (Zustand)
    // → Browser tự động gửi cookie khi gọi /auth/* endpoints
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  // ─── Helper: Set refresh token cookie ─────────────────────────────────────
  // Tách ra method riêng vì OTP verify + OAuth callback đều cần set cookie
  // → DRY (Don't Repeat Yourself)

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────

  /**
   * GET /api/v1/auth/google
   *
   * Redirect tới Google consent screen.
   * GoogleAuthGuard tự động xử lý redirect — không cần logic trong handler.
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Guard tự động redirect tới Google
  }

  /**
   * GET /api/v1/auth/google/callback
   *
   * Google redirect về đây sau khi user đồng ý.
   * GoogleAuthGuard xử lý exchange code → profile.
   * req.user = OAuthProfile (từ GoogleStrategy.validate())
   *
   * Flow:
   *   1. findOrCreateOAuthUser(profile) → tìm/tạo/merge user
   *   2. generateTokenPair(user) → tạo access + refresh token
   *   3. Set refresh token cookie
   *   4. Redirect về frontend với access token trong URL
   *
   * Tại sao redirect thay vì return JSON?
   * → Đây là browser redirect flow (không phải AJAX)
   * → Browser đang ở trang Google, không thể nhận JSON response
   * → Redirect về frontend, frontend đọc token từ URL query params
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as any;
    const user = await this.authService.findOrCreateOAuthUser(profile);
    const tokens = await this.authService.generateTokenPair(user);

    this.setRefreshTokenCookie(res, tokens.refreshToken);

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    res.redirect(
      `${frontendUrl}/auth/callback?token=${tokens.accessToken}&isNewUser=${user.isNewUser}`,
    );
  }

  // ─── GitHub OAuth ─────────────────────────────────────────────────────────

  /**
   * GET /api/v1/auth/github
   *
   * Redirect tới GitHub authorization page.
   */
  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin() {
    // Guard tự động redirect tới GitHub
  }

  /**
   * GET /api/v1/auth/github/callback
   *
   * GitHub redirect về đây. Tương tự Google callback.
   */
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as any;
    const user = await this.authService.findOrCreateOAuthUser(profile);
    const tokens = await this.authService.generateTokenPair(user);

    this.setRefreshTokenCookie(res, tokens.refreshToken);

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    res.redirect(
      `${frontendUrl}/auth/callback?token=${tokens.accessToken}&isNewUser=${user.isNewUser}`,
    );
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/refresh
   *
   * Dùng refresh token (từ cookie) để lấy access token mới.
   * Implement token rotation: xóa token cũ, tạo token pair mới.
   *
   * Token rotation nghĩa là gì?
   * → Mỗi lần refresh, refresh token cũ bị XÓA và token mới được tạo
   * → Nếu attacker steal refresh token và dùng trước user thật:
   *   - Attacker dùng → token cũ bị xóa, token mới được tạo
   *   - User thật dùng token cũ → không tìm thấy trong DB → 401
   *   - User phải đăng nhập lại → attacker mất quyền truy cập
   *
   * Cookie: refreshToken mới (replace cookie cũ)
   * Response body: { accessToken: string }
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Đọc refresh token từ cookie (HttpOnly → JS không thể đọc)
    const refreshToken = req.cookies?.['refreshToken'] as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // Validate token (4 lớp check: tồn tại, revoke, hết hạn, JWT signature)
    const user = await this.authService.validateRefreshToken(refreshToken);

    // Token rotation: xóa token cũ trước khi tạo mới
    // Phải xóa TRƯỚC khi generateRefreshToken → tránh duplicate trong DB
    await this.authService.deleteRefreshToken(refreshToken);

    // Tạo token pair mới
    const tokens = await this.authService.generateTokenPair(user);

    // Set cookie với refresh token mới
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/logout
   *
   * Revoke refresh token và clear cookie.
   * Access token tự hết hạn sau 15 phút (không thể invalidate ngay — stateless)
   *
   * Response: { message: 'Logged out successfully' }
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refreshToken'] as string | undefined;

    if (refreshToken) {
      // Revoke token trong DB (set revokedAt)
      // Nếu không tìm thấy → bỏ qua (idempotent)
      await this.authService.revokeRefreshToken(refreshToken);
    }

    // Clear cookie bằng cách set maxAge=0
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/api/v1/auth',
    });

    return { message: 'Logged out successfully' };
  }

  // ─── Current User ─────────────────────────────────────────────────────────

  /**
   * GET /api/v1/auth/me
   *
   * Trả về thông tin user hiện tại từ JWT payload.
   * Không cần DB query — thông tin đã có trong token.
   *
   * @UseGuards(JwtAuthGuard): verify Bearer token, gắn payload vào req.user
   *
   * Response: { id, email, role }
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request) {
    // req.user được gắn bởi JwtStrategy.validate()
    // Shape: { id: string, email: string, role: string }
    return req.user;
  }
}
