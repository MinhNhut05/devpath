import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../../prisma/index.js';
import { MailService } from '../mail/index.js';
import * as bcrypt from 'bcrypt';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock crypto module — cần mock cả createHash (cho hashToken) và randomInt (cho OTP)
jest.mock('crypto', () => ({
  randomInt: jest.fn().mockReturnValue(123456),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mock-token-hash'),
  }),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: any;
  let mailService: { sendOtpEmail: jest.Mock };
  let jwtService: { sign: jest.Mock; decode: jest.Mock; verify: jest.Mock };
  let configService: { get: jest.Mock; getOrThrow: jest.Mock };

  beforeEach(async () => {
    prisma = {
      oTPCode: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'otp-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'test@example.com',
          role: 'USER',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'test@example.com',
          role: 'USER',
          displayName: null,
          avatarUrl: null,
        }),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      // $transaction mock: thực thi callback ngay với cùng prisma object (tx = prisma)
      // Cho phép test findOrCreateOAuthUser() mà không cần real DB transaction
      $transaction: jest.fn().mockImplementation((cb: (tx: any) => any) => cb(prisma)),
    };

    mailService = {
      sendOtpEmail: jest.fn().mockResolvedValue(undefined),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      decode: jest.fn().mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 604800,
      }),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('test-secret'),
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
    };

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-code');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mailService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  // ─── requestOtp ─────────────────────────────────────────────────────────

  describe('requestOtp', () => {
    it('should send OTP email successfully', async () => {
      const result = await authService.requestOtp('test@example.com');

      expect(result).toEqual({
        message: 'If this email is valid, you will receive an OTP code.',
      });
      expect(mailService.sendOtpEmail).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
      );
    });

    it('should hash OTP before saving to database', async () => {
      await authService.requestOtp('test@example.com');

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(prisma.oTPCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'hashed-code', // bcrypt hash, not plaintext
          }),
        }),
      );
    });

    it('should throw TOO_MANY_REQUESTS when rate limit exceeded (5/hour)', async () => {
      prisma.oTPCode.count.mockResolvedValue(5);

      await expect(authService.requestOtp('test@example.com')).rejects.toThrow(
        HttpException,
      );
      await expect(
        authService.requestOtp('test@example.com'),
      ).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    });

    it('should throw TOO_MANY_REQUESTS when account is locked (5 failed attempts)', async () => {
      prisma.oTPCode.count.mockResolvedValue(0);
      prisma.oTPCode.findFirst.mockResolvedValue({
        attempts: 5,
        createdAt: new Date(), // recent → still locked
      });

      await expect(authService.requestOtp('test@example.com')).rejects.toThrow(
        HttpException,
      );
    });

    it('should invalidate previous OTPs before creating new one', async () => {
      await authService.requestOtp('test@example.com');

      // updateMany should be called BEFORE create
      const updateManyCallOrder =
        prisma.oTPCode.updateMany.mock.invocationCallOrder[0];
      const createCallOrder =
        prisma.oTPCode.create.mock.invocationCallOrder[0];
      expect(updateManyCallOrder).toBeLessThan(createCallOrder);

      expect(prisma.oTPCode.updateMany).toHaveBeenCalledWith({
        where: { email: 'test@example.com', verified: false },
        data: { verified: true },
      });
    });

    it('should link OTP to existing user if email already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user-id',
        email: 'test@example.com',
      });

      await authService.requestOtp('test@example.com');

      expect(prisma.oTPCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'existing-user-id',
          }),
        }),
      );
    });

    it('should set userId to null for unregistered email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await authService.requestOtp('new@example.com');

      expect(prisma.oTPCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: null,
          }),
        }),
      );
    });

    it('should NOT reveal if email exists (anti-enumeration)', async () => {
      // Test with existing user
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'existing@example.com',
      });
      const result1 = await authService.requestOtp('existing@example.com');

      // Test with new email
      prisma.user.findUnique.mockResolvedValue(null);
      const result2 = await authService.requestOtp('new@example.com');

      // Both should return the same message
      expect(result1.message).toBe(result2.message);
    });
  });

  // ─── verifyOtp ──────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    const validOtp = {
      id: 'otp-1',
      email: 'test@example.com',
      code: 'hashed-code',
      expiresAt: new Date(Date.now() + 120000), // 2 min from now
      attempts: 0,
      verified: false,
      createdAt: new Date(),
    };

    beforeEach(() => {
      prisma.oTPCode.findFirst.mockResolvedValue(validOtp);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    it('should verify OTP and return tokens for existing user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
      });

      const result = await authService.verifyOtp(
        'test@example.com',
        '123456',
      );

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-jwt-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'USER',
          isNewUser: false,
        },
      });
    });

    it('should auto-create user and return isNewUser=true for new email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user-1',
        email: 'new@example.com',
        role: 'USER',
      });

      const result = await authService.verifyOtp('new@example.com', '123456');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          authProvider: 'email',
        },
      });
      expect(result.user.isNewUser).toBe(true);
    });

    it('should throw UNAUTHORIZED when no OTP found', async () => {
      prisma.oTPCode.findFirst.mockResolvedValue(null);

      await expect(
        authService.verifyOtp('test@example.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UNAUTHORIZED for expired OTP', async () => {
      prisma.oTPCode.findFirst.mockResolvedValue({
        ...validOtp,
        expiresAt: new Date(Date.now() - 1000), // expired 1s ago
      });

      await expect(
        authService.verifyOtp('test@example.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw TOO_MANY_REQUESTS after 5 failed attempts', async () => {
      prisma.oTPCode.findFirst.mockResolvedValue({
        ...validOtp,
        attempts: 5,
      });

      await expect(
        authService.verifyOtp('test@example.com', '123456'),
      ).rejects.toThrow(HttpException);
    });

    it('should increment attempts before comparing', async () => {
      await authService.verifyOtp('test@example.com', '123456');

      // update (increment) should be called BEFORE compare
      expect(prisma.oTPCode.update).toHaveBeenCalledWith({
        where: { id: 'otp-1' },
        data: { attempts: { increment: 1 } },
      });
    });

    it('should throw UNAUTHORIZED for invalid OTP code', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.verifyOtp('test@example.com', '000000'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should mark OTP as verified after successful verification', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
      });

      await authService.verifyOtp('test@example.com', '123456');

      // Second update call should mark as verified
      expect(prisma.oTPCode.update).toHaveBeenCalledWith({
        where: { id: 'otp-1' },
        data: { verified: true },
      });
    });
  });

  // ─── findOrCreateOAuthUser ──────────────────────────────────────────────

  describe('findOrCreateOAuthUser', () => {
    const googleProfile = {
      provider: 'google' as const,
      providerId: 'google-123',
      email: 'oauth@example.com',
      displayName: 'OAuth User',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    it('should return existing user when found by providerId (googleId)', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'oauth@example.com',
        role: 'USER',
      });

      const result = await authService.findOrCreateOAuthUser(googleProfile);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { googleId: 'google-123' },
      });
      expect(result).toEqual({
        id: 'user-1',
        email: 'oauth@example.com',
        role: 'USER',
        isNewUser: false,
      });
      // Should NOT call update or create
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should use githubId field when provider is github', async () => {
      const githubProfile = { ...googleProfile, provider: 'github' as const, providerId: 'gh-456' };
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-2',
        email: 'oauth@example.com',
        role: 'USER',
      });

      await authService.findOrCreateOAuthUser(githubProfile);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { githubId: 'gh-456' },
      });
    });

    it('should merge OAuth ID into existing email account', async () => {
      // Step 1: findUnique by googleId → not found
      prisma.user.findUnique.mockResolvedValueOnce(null);
      // Step 2: findUnique by email → found (existing OTP user)
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'existing-user',
        email: 'oauth@example.com',
        role: 'USER',
        displayName: null,
        avatarUrl: null,
      });
      // Step 3: update returns merged user
      prisma.user.update.mockResolvedValueOnce({
        id: 'existing-user',
        email: 'oauth@example.com',
        role: 'USER',
        displayName: 'OAuth User',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      const result = await authService.findOrCreateOAuthUser(googleProfile);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'existing-user' },
        data: expect.objectContaining({
          googleId: 'google-123',
          displayName: 'OAuth User',
          avatarUrl: 'https://example.com/avatar.jpg',
        }),
      });
      expect(result.isNewUser).toBe(false);
    });

    it('should NOT overwrite existing displayName/avatarUrl on merge', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'existing-user',
        email: 'oauth@example.com',
        role: 'USER',
        displayName: 'Already Set',
        avatarUrl: 'https://existing.com/photo.jpg',
      });
      prisma.user.update.mockResolvedValueOnce({
        id: 'existing-user',
        email: 'oauth@example.com',
        role: 'USER',
        displayName: 'Already Set',
        avatarUrl: 'https://existing.com/photo.jpg',
      });

      await authService.findOrCreateOAuthUser(googleProfile);

      // update data should NOT contain displayName or avatarUrl
      const updateCall = prisma.user.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('displayName');
      expect(updateCall.data).not.toHaveProperty('avatarUrl');
      expect(updateCall.data).toHaveProperty('googleId', 'google-123');
    });

    it('should create new user when not found by providerId or email', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // by googleId
      prisma.user.findUnique.mockResolvedValueOnce(null); // by email
      prisma.user.create.mockResolvedValueOnce({
        id: 'new-user',
        email: 'oauth@example.com',
        role: 'USER',
      });

      const result = await authService.findOrCreateOAuthUser(googleProfile);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'oauth@example.com',
          authProvider: 'google',
          googleId: 'google-123',
          displayName: 'OAuth User',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      });
      expect(result).toEqual({
        id: 'new-user',
        email: 'oauth@example.com',
        role: 'USER',
        isNewUser: true,
      });
    });
  });
});
