// auth.service.ts - Core authentication logic
//
// Service này chịu trách nhiệm tạo và validate JWT tokens.
// Đây là "backbone" (xương sống) của auth system —
// mọi login method (OTP, Google, GitHub) đều gọi generateTokenPair() ở cuối.
//
// Flow tổng quát:
//   User login thành công → generateTokenPair(user)
//   → Access Token (15min, stateless)  → client giữ trong memory
//   → Refresh Token (7 days, stateful) → client giữ trong HttpOnly cookie
//
// Tại sao tách 2 loại token?
//   - Access Token ngắn hạn → nếu bị steal, chỉ có tác dụng 15 phút
//   - Refresh Token dài hạn nhưng lưu DB → có thể revoke (thu hồi) ngay lập tức

import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/index.js';
import { MailService } from '../mail/index.js';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// ─── Types ────────────────────────────────────────────────────────────────────

// User object tối thiểu cần để tạo token
// Dùng interface thay vì Prisma's full User type → loose coupling (ít phụ thuộc)
export interface TokenUser {
  id: string;
  email: string;
  role: UserRole;
}

// Return type của generateTokenPair()
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Shape của JWT payload khi decode
// "iat" = issued at (thời điểm tạo), "exp" = expiry (thời điểm hết hạn)
interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

// Return type của verifyOtp()
// Controller cần cả refreshToken (để set cookie) và user info (để trả về client)
export interface OtpVerifyResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    isNewUser: boolean; // Frontend dùng để redirect tới onboarding
  };
}

// OAuth profile trả về từ Google/GitHub strategy
// Cả 2 strategies đều map profile về chung interface này
// → findOrCreateOAuthUser() xử lý logic chung, không cần biết provider cụ thể
export interface OAuthProfile {
  provider: 'google' | 'github';
  providerId: string; // Google profile.id hoặc GitHub profile.id
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    // JwtService: từ @nestjs/jwt, đã config trong AuthModule (JwtModule.registerAsync)
    private readonly jwtService: JwtService,

    // ConfigService: đọc .env variables, available globally từ ConfigModule
    private readonly configService: ConfigService,

    // PrismaService: database access, available globally từ PrismaModule (@Global)
    private readonly prisma: PrismaService,

    // MailService: gửi email OTP, từ MailModule
    private readonly mailService: MailService,
  ) {}

  // ─── Access Token ─────────────────────────────────────────────────────────

  /**
   * Tạo Access Token — ngắn hạn (15 phút)
   *
   * Đặc điểm:
   * - Stateless: KHÔNG lưu DB (nhanh, không cần query)
   * - Client giữ trong memory (Zustand store), KHÔNG localStorage
   *   → Tại sao? localStorage có thể bị đọc bởi XSS attack
   * - Dùng default secret + expiresIn từ JwtModule config
   *
   * @param user - Object chứa id, email, role
   * @returns JWT token string
   */
  generateAccessToken(user: TokenUser): string {
    const payload = {
      sub: user.id, // "sub" (subject) = JWT standard claim, chứa user ID
      email: user.email,
      role: user.role,
      type: 'access' as const, // Đánh dấu loại token để phân biệt
    };

    // jwtService.sign() dùng default config từ JwtModule.registerAsync:
    // - secret: JWT_ACCESS_SECRET
    // - expiresIn: JWT_ACCESS_EXPIRES_IN (15m)
    return this.jwtService.sign(payload);
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────

  // Helper: Hash token bằng SHA-256 để lưu DB
  // Tại sao SHA-256 thay vì bcrypt?
  //   - SHA-256 là deterministic (cùng input → cùng output) → có thể lookup trong DB
  //   - bcrypt có random salt → không thể lookup theo hash
  //   - Refresh token là JWT (~256 bits entropy) → không cần salt/bcrypt
  private hashToken(token: string): string {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createHash } = require('crypto') as typeof import('crypto');
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Tạo Refresh Token — dài hạn (7 ngày)
   *
   * Đặc điểm:
   * - Stateful: LƯU vào DB table "refresh_tokens" → có thể revoke bất cứ lúc nào
   * - Client giữ trong HttpOnly cookie (JS không thể đọc → chống XSS)
   * - Dùng JWT_REFRESH_SECRET riêng (KHÁC access secret!)
   * - LƯU HASH (SHA-256) thay vì raw token → DB bị leak không đọc được token thật
   *
   * Tại sao lưu DB?
   * → Nếu user logout hoặc phát hiện token bị steal, ta set revokedAt → token vô hiệu ngay
   * → Không cần chờ 7 ngày token tự hết hạn
   *
   * @param user - Object chứa id, email, role
   * @returns JWT refresh token string (raw, chưa hash — gửi về client)
   */
  async generateRefreshToken(user: TokenUser): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh' as const,
    };

    // Sign với refresh secret riêng biệt — override default JwtModule config
    const token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      // Cast: ConfigService trả về `string`, nhưng JWT cần branded `StringValue`
      // type từ package 'ms'. Giá trị '7d' là hợp lệ — chỉ TypeScript strict check.
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
        '7d', // fallback nếu env var không tồn tại
      ) as any,
    });

    // Decode token vừa tạo để lấy "exp" (expiry timestamp)
    // Mục đích: expiresAt trong DB luôn KHỚP CHÍNH XÁC với JWT exp
    // → Single source of truth (một nguồn sự thật duy nhất)
    // → Không bị lệch nếu ai đó hardcode "7 days" ở nơi khác
    const decoded = this.jwtService.decode<JwtPayload>(token);
    const expiresAt = new Date(decoded.exp * 1000); // JWT exp = giây, Date cần ms

    // Lưu HASH vào DB thay vì raw token
    // → Nếu DB bị leak, attacker chỉ có SHA-256 hash → không dùng được
    // → Client vẫn nhận raw token để gửi lại khi refresh
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token), // Hash trước khi lưu
        expiresAt, // Lấy từ JWT payload → luôn khớp
        // revokedAt: không set → mặc định null (token chưa bị revoke)
      },
    });

    return token; // Trả về raw token cho client
  }

  // ─── Token Pair ───────────────────────────────────────────────────────────

  /**
   * Tạo cả 2 token cùng lúc — method chính mà controller sẽ gọi
   *
   * Đây là method "entry point" (điểm vào) cho mọi login flow:
   *   OTP verify thành công → generateTokenPair(user)
   *   Google OAuth thành công → generateTokenPair(user)
   *   GitHub OAuth thành công → generateTokenPair(user)
   *
   * @param user - Object chứa id, email, role
   * @returns { accessToken, refreshToken }
   */
  async generateTokenPair(user: TokenUser): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return { accessToken, refreshToken };
  }

  // ─── Validate Refresh Token ───────────────────────────────────────────────

  /**
   * Kiểm tra refresh token có hợp lệ không
   *
   * 4 lớp kiểm tra (sắp xếp từ rẻ → đắt về performance):
   *   1. Tồn tại trong DB?          ← DB lookup
   *   2. Đã bị revoke chưa?         ← field check (free)
   *   3. Hết hạn chưa? (DB-side)    ← date comparison (free)
   *   4. Chữ ký JWT hợp lệ không?   ← crypto verify (expensive → để cuối)
   *
   * Tại sao cần CẢ 4 lớp?
   * → Chỉ JWT signature thôi KHÔNG đủ: kẻ tấn công có thể steal token hợp lệ
   * → Lưu DB cho phép revoke ngay, không cần chờ token tự hết hạn
   *
   * @param token - Refresh token string
   * @returns TokenUser nếu valid, throw UnauthorizedException nếu invalid
   */
  async validateRefreshToken(token: string): Promise<TokenUser> {
    // Hash token trước khi query DB
    // Lý do: DB lưu hash, không lưu raw token → phải hash để so sánh
    const tokenHash = this.hashToken(token);

    // Lớp 1: Tìm trong DB — token có tồn tại không?
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // Lớp 2: Kiểm tra revoke — revokedAt !== null → đã bị thu hồi
    if (stored.revokedAt !== null) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Lớp 3: Kiểm tra hết hạn từ DB (fast check trước crypto)
    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Lớp 4: Verify chữ ký JWT — nếu token bị tamper (giả mạo), bước này catch
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      // Double check: phải là refresh token, không phải access token
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      // jwtService.verify() throw nếu:
      // - Signature sai (token bị chỉnh sửa)
      // - Token hết hạn (double-check với lớp 3)
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw lỗi "Invalid token type" ở trên
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ─── Revoke Refresh Token ─────────────────────────────────────────────────

  /**
   * Revoke (thu hồi) refresh token khi user logout
   *
   * Set revokedAt = now() thay vì delete → giữ lại record để audit log
   * Nếu token không tồn tại trong DB, bỏ qua (idempotent — an toàn khi gọi nhiều lần)
   *
   * @param token - Raw refresh token từ cookie
   */
  async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    // updateMany thay vì update: không throw nếu không tìm thấy
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Xóa refresh token cũ khi rotation (dùng bởi POST /auth/refresh)
   *
   * Token rotation: mỗi lần refresh → xóa token cũ, tạo token mới
   * → Nếu attacker steal token, chỉ dùng được 1 lần → phát hiện được
   *
   * @param token - Raw refresh token từ cookie
   */
  async deleteRefreshToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });
  }

  // ─── Request OTP ──────────────────────────────────────────────────────────

  /**
   * Tạo và gửi OTP code qua email
   *
   * Flow:
   *   1. Rate limit: max 5 OTP/email/hour (database-level, khác với IP-based throttler)
   *   2. Lockout: nếu OTP trước đó có >= 5 failed attempts → lock 15 phút
   *   3. Generate 6 digits bằng crypto.randomInt (secure random)
   *   4. Hash bằng bcrypt trước khi lưu DB (nếu DB bị leak, attacker ko đọc được OTP)
   *   5. Invalidate old OTPs → chỉ OTP mới nhất hợp lệ
   *   6. Gửi email qua MailService
   *
   * @param email - Email address của user
   * @returns { message: string } — luôn trả cùng message (chống email enumeration)
   */
  async requestOtp(email: string): Promise<{ message: string }> {
    // ── Rate Limit: 5 OTP per email per hour ──
    // Tại sao check ở service thay vì dùng @Throttle()?
    // → @Throttle() rate-limit theo IP address
    // → Ta cần rate-limit theo EMAIL (1 email = max 5 OTP/hour)
    // → 2 cách tiếp cận khác nhau cho 2 mục đích khác nhau
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtpCount = await this.prisma.oTPCode.count({
      where: {
        email,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentOtpCount >= 5) {
      throw new HttpException(
        'Too many OTP requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // ── Lockout Check ──
    // Nếu OTP gần nhất có >= 5 failed attempts → account bị lock 15 phút
    // Mục đích: chống brute force (thử hết các tổ hợp 000000-999999)
    const lastOtp = await this.prisma.oTPCode.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOtp && lastOtp.attempts >= 5) {
      const lockUntil = new Date(
        lastOtp.createdAt.getTime() + 15 * 60 * 1000,
      );
      if (new Date() < lockUntil) {
        const minutesLeft = Math.ceil(
          (lockUntil.getTime() - Date.now()) / 60000,
        );
        throw new HttpException(
          `Account temporarily locked. Try again in ${minutesLeft} minutes.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // ── Generate 6-digit OTP ──
    // randomInt(100000, 1000000) → range [100000, 999999]
    // Tại sao không dùng Math.random()? → Không cryptographically secure
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomInt } = require('crypto') as typeof import('crypto');
    const otpCode = randomInt(100000, 1000000).toString();

    // ── Hash OTP ──
    // Salt rounds = 10 (balance giữa security và performance)
    // bcrypt tự động tạo salt → mỗi hash khác nhau dù cùng input
    const hashedCode = await bcrypt.hash(otpCode, 10);

    // ── Link to user if exists ──
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    // ── Invalidate old OTPs ──
    // Khi request OTP mới, mark tất cả OTP cũ của email này là verified
    // → Chỉ OTP mới nhất là hợp lệ
    // → Tránh trường hợp user nhận 2 email, nhập OTP cũ
    await this.prisma.oTPCode.updateMany({
      where: {
        email,
        verified: false,
      },
      data: { verified: true },
    });

    // ── Save new OTP ──
    await this.prisma.oTPCode.create({
      data: {
        email,
        code: hashedCode,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
        userId: existingUser?.id ?? null,
      },
    });

    // ── Send email ──
    await this.mailService.sendOtpEmail(email, otpCode);

    this.logger.log(`OTP requested for ${email}`);

    // Luôn trả về message giống nhau dù email tồn tại hay không
    // → Chống email enumeration attack
    return { message: 'If this email is valid, you will receive an OTP code.' };
  }

  // ─── Verify OTP ─────────────────────────────────────────────────────────

  /**
   * Verify OTP code và trả về tokens
   *
   * Flow:
   *   1. Tìm OTP mới nhất (chưa verified) cho email này
   *   2. Check hết hạn (2 phút)
   *   3. Check số lần thử (max 5)
   *   4. Tăng attempts TRƯỚC khi compare (chống race condition)
   *   5. So sánh hash bằng bcrypt.compare()
   *   6. Nếu sai: exponential delay → throw error
   *   7. Nếu đúng: mark verified, find/create user, generate tokens
   *
   * @param email - Email address
   * @param code - 6-digit OTP code
   * @returns OtpVerifyResult { accessToken, refreshToken, user }
   */
  async verifyOtp(email: string, code: string): Promise<OtpVerifyResult> {
    // ── Tìm latest unverified OTP ──
    const otp = await this.prisma.oTPCode.findFirst({
      where: {
        email,
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new UnauthorizedException(
        'No OTP found. Please request a new one.',
      );
    }

    // ── Check expiry ──
    if (otp.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'OTP has expired. Please request a new one.',
      );
    }

    // ── Check max attempts ──
    if (otp.attempts >= 5) {
      throw new HttpException(
        'Too many failed attempts. Please request a new OTP.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // ── Increment attempts TRƯỚC khi compare ──
    // Ghi nhận trước, compare sau → chống race condition:
    //   Nếu 2 request đến cùng lúc, cả 2 đều đọc attempts=0,
    //   nhưng increment đảm bảo mỗi request đều được đếm
    await this.prisma.oTPCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });

    // ── Compare hash ──
    const isValid = await bcrypt.compare(code, otp.code);

    if (!isValid) {
      // ── Exponential backoff ──
      // Mục đích: làm chậm brute force attack
      // Attempt 1 → 1s, Attempt 2 → 2s, Attempt 3 → 4s, Attempt 4 → 8s, Attempt 5 → 16s
      // Cap tại 16s để không block quá lâu
      const delayMs = Math.min(1000 * Math.pow(2, otp.attempts), 16000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      throw new UnauthorizedException('Invalid OTP code.');
    }

    // ── Mark as verified ──
    await this.prisma.oTPCode.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    // ── Find or create user ──
    let isNewUser = false;
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      isNewUser = true;
      user = await this.prisma.user.create({
        data: {
          email,
          authProvider: 'email',
          // role defaults to USER (from schema)
        },
      });
      this.logger.log(`New user created via OTP: ${email}`);
    }

    // ── Generate token pair ──
    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const { accessToken, refreshToken } =
      await this.generateTokenPair(tokenUser);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isNewUser,
      },
    };
  }

  // ─── OAuth: Find or Create User ─────────────────────────────────────────

  /**
   * Tìm hoặc tạo user từ OAuth profile (Google/GitHub)
   *
   * Logic tìm kiếm theo thứ tự ưu tiên:
   *   1. Tìm theo providerId (googleId/githubId) → user đã login OAuth trước đó
   *   2. Tìm theo email → user đã tồn tại (từ OTP login) → MERGE account
   *      → Gắn OAuth ID vào account cũ, update displayName/avatarUrl nếu chưa có
   *   3. Không tìm thấy → tạo user mới
   *
   * Tại sao merge thay vì tạo mới?
   * → User A login OTP bằng a@gmail.com, rồi login Google cùng email
   * → Nếu tạo 2 accounts → user bối rối, progress bị tách
   * → Merge = 1 account, nhiều cách login (OTP + Google + GitHub)
   *
   * @param profile - OAuth profile đã chuẩn hóa từ strategy
   * @returns TokenUser { id, email, role } + isNewUser flag
   */
  async findOrCreateOAuthUser(
    profile: OAuthProfile,
  ): Promise<TokenUser & { isNewUser: boolean }> {
    // ── Bước 1: Tìm theo OAuth provider ID (ngoài transaction — fast path) ──
    // Đây là case phổ biến nhất (user đã login trước đó) → check trước khi vào transaction
    // Dùng conditional thay vì computed key [providerField]
    // → Prisma cần type cụ thể { googleId: string } chứ không chấp nhận { [x: string]: string }
    const providerField =
      profile.provider === 'google' ? 'googleId' : 'githubId';

    const where =
      profile.provider === 'google'
        ? { googleId: profile.providerId }
        : { githubId: profile.providerId };

    const existingByProvider = await this.prisma.user.findUnique({ where });

    if (existingByProvider) {
      return {
        id: existingByProvider.id,
        email: existingByProvider.email,
        role: existingByProvider.role,
        isNewUser: false,
      };
    }

    // ── Bước 2 & 3: Tìm theo email / tạo mới — trong Transaction ──
    // Tại sao transaction ở đây?
    //   Race condition: 2 request đến cùng lúc với cùng email
    //   → Cả 2 đều thấy user chưa tồn tại (bước findUnique)
    //   → Cả 2 đều cố create → 1 request sẽ throw unique constraint error
    //   → Transaction đảm bảo chỉ 1 request thành công
    // Prisma interactive transaction: dùng `tx` thay vì `this.prisma`
    return this.prisma.$transaction(async (tx) => {
      // Tìm theo email — có thể user đã tạo bằng OTP
      let user = await tx.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        // Merge: gắn OAuth ID vào account cũ
        // Update displayName/avatarUrl nếu chưa có (không ghi đè nếu đã set)
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            [providerField]: profile.providerId,
            ...(user.displayName ? {} : { displayName: profile.displayName }),
            ...(user.avatarUrl ? {} : { avatarUrl: profile.avatarUrl }),
          },
        });

        this.logger.log(
          `OAuth ${profile.provider} merged into existing account: ${profile.email}`,
        );

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          isNewUser: false,
        };
      }

      // Tạo user mới
      user = await tx.user.create({
        data: {
          email: profile.email,
          authProvider: profile.provider,
          [providerField]: profile.providerId,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        },
      });

      this.logger.log(
        `New user created via OAuth ${profile.provider}: ${profile.email}`,
      );

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        isNewUser: true,
      };
    });
  }
}
