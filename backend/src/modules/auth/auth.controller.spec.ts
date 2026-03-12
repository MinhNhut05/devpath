import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller.js';
import { AuthService, OtpVerifyResult, TokenUser } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    requestOtp: jest.Mock;
    verifyOtp: jest.Mock;
    findOrCreateOAuthUser: jest.Mock;
    generateTokenPair: jest.Mock;
    validateRefreshToken: jest.Mock;
    revokeRefreshToken: jest.Mock;
    deleteRefreshToken: jest.Mock;
  };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    authService = {
      requestOtp: jest.fn().mockResolvedValue({
        message: 'If this email is valid, you will receive an OTP code.',
      }),
      verifyOtp: jest.fn().mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'USER',
          isNewUser: false,
        },
      } satisfies OtpVerifyResult),
      findOrCreateOAuthUser: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'oauth@example.com',
        role: 'USER',
        isNewUser: false,
      }),
      generateTokenPair: jest.fn().mockResolvedValue({
        accessToken: 'oauth-access-token',
        refreshToken: 'oauth-refresh-token',
      }),
      validateRefreshToken: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
      } satisfies TokenUser),
      revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
      deleteRefreshToken: jest.fn().mockResolvedValue(undefined),
    };

    configService = {
      get: jest.fn().mockReturnValue('development'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/otp/request', () => {
    it('should call authService.requestOtp with email from DTO', async () => {
      const dto = { email: 'test@example.com' };
      await controller.requestOtp(dto);

      expect(authService.requestOtp).toHaveBeenCalledWith('test@example.com');
    });

    it('should return message from authService', async () => {
      const result = await controller.requestOtp({
        email: 'test@example.com',
      });

      expect(result).toEqual({
        message: 'If this email is valid, you will receive an OTP code.',
      });
    });
  });

  describe('POST /auth/otp/verify', () => {
    let mockRes: {
      cookie: jest.Mock;
    };

    beforeEach(() => {
      mockRes = {
        cookie: jest.fn(),
      };
    });

    it('should set refreshToken as HttpOnly cookie', async () => {
      await controller.verifyOtp(
        { email: 'test@example.com', code: '123456' },
        mockRes as any,
      );

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/api/v1/auth',
        }),
      );
    });

    it('should NOT include refreshToken in response body', async () => {
      const result = await controller.verifyOtp(
        { email: 'test@example.com', code: '123456' },
        mockRes as any,
      );

      expect(result).not.toHaveProperty('refreshToken');
    });

    it('should return accessToken and user in response body', async () => {
      const result = await controller.verifyOtp(
        { email: 'test@example.com', code: '123456' },
        mockRes as any,
      );

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'USER',
          isNewUser: false,
        },
      });
    });

    it('should set cookie maxAge to 7 days', async () => {
      await controller.verifyOtp(
        { email: 'test@example.com', code: '123456' },
        mockRes as any,
      );

      const cookieOptions = mockRes.cookie.mock.calls[0][2];
      expect(cookieOptions.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should set secure=false in development', async () => {
      configService.get.mockReturnValue('development');

      await controller.verifyOtp(
        { email: 'test@example.com', code: '123456' },
        mockRes as any,
      );

      const cookieOptions = mockRes.cookie.mock.calls[0][2];
      expect(cookieOptions.secure).toBe(false);
    });

    it('should set secure=true in production', async () => {
      configService.get.mockReturnValue('production');

      await controller.verifyOtp(
        { email: 'test@example.com', code: '123456' },
        mockRes as any,
      );

      const cookieOptions = mockRes.cookie.mock.calls[0][2];
      expect(cookieOptions.secure).toBe(true);
    });
  });

  // ─── Google OAuth Callback ──────────────────────────────────────────────

  describe('GET /auth/google/callback', () => {
    let mockReq: { user: any };
    let mockRes: { cookie: jest.Mock; redirect: jest.Mock };

    beforeEach(() => {
      mockReq = {
        user: {
          provider: 'google',
          providerId: 'google-123',
          email: 'oauth@example.com',
          displayName: 'OAuth User',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      };
      mockRes = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      };
    });

    it('should call findOrCreateOAuthUser with req.user profile', async () => {
      await controller.googleCallback(mockReq as any, mockRes as any);

      expect(authService.findOrCreateOAuthUser).toHaveBeenCalledWith(
        mockReq.user,
      );
    });

    it('should call generateTokenPair with the returned user', async () => {
      await controller.googleCallback(mockReq as any, mockRes as any);

      expect(authService.generateTokenPair).toHaveBeenCalledWith({
        id: 'user-1',
        email: 'oauth@example.com',
        role: 'USER',
        isNewUser: false,
      });
    });

    it('should set refreshToken as HttpOnly cookie', async () => {
      await controller.googleCallback(mockReq as any, mockRes as any);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'oauth-refresh-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/api/v1/auth',
        }),
      );
    });

    it('should redirect to frontend with accessToken and isNewUser', async () => {
      configService.get.mockReturnValue('http://localhost:5173');

      await controller.googleCallback(mockReq as any, mockRes as any);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://localhost:5173/auth/callback?token=oauth-access-token&isNewUser=false',
      );
    });

    it('should set isNewUser=true in redirect URL for new users', async () => {
      authService.findOrCreateOAuthUser.mockResolvedValueOnce({
        id: 'new-user',
        email: 'new@example.com',
        role: 'USER',
        isNewUser: true,
      });
      configService.get.mockReturnValue('http://localhost:5173');

      await controller.googleCallback(mockReq as any, mockRes as any);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('isNewUser=true'),
      );
    });
  });

  // ─── GitHub OAuth Callback ──────────────────────────────────────────────

  describe('GET /auth/github/callback', () => {
    let mockReq: { user: any };
    let mockRes: { cookie: jest.Mock; redirect: jest.Mock };

    beforeEach(() => {
      mockReq = {
        user: {
          provider: 'github',
          providerId: 'github-789',
          email: 'ghuser@example.com',
          displayName: 'GitHub User',
          avatarUrl: 'https://avatars.githubusercontent.com/u/123',
        },
      };
      mockRes = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      };
    });

    it('should call findOrCreateOAuthUser with GitHub profile', async () => {
      await controller.githubCallback(mockReq as any, mockRes as any);

      expect(authService.findOrCreateOAuthUser).toHaveBeenCalledWith(
        mockReq.user,
      );
    });

    it('should set refreshToken cookie and redirect', async () => {
      configService.get.mockReturnValue('http://localhost:5173');

      await controller.githubCallback(mockReq as any, mockRes as any);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'oauth-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://localhost:5173/auth/callback?token=oauth-access-token&isNewUser=false',
      );
    });
  });

  // ─── POST /auth/refresh ────────────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    let mockReq: { cookies: Record<string, string> };
    let mockRes: { cookie: jest.Mock };

    beforeEach(() => {
      mockReq = { cookies: { refreshToken: 'valid-refresh-token' } };
      mockRes = { cookie: jest.fn() };
    });

    it('should return new accessToken when refresh token is valid', async () => {
      authService.generateTokenPair.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const result = await controller.refresh(mockReq as any, mockRes as any);

      expect(authService.validateRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(authService.deleteRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(authService.generateTokenPair).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: 'new-access-token' });
    });

    it('should set new refreshToken cookie', async () => {
      authService.generateTokenPair.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      await controller.refresh(mockReq as any, mockRes as any);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('should throw UnauthorizedException when no refresh token in cookie', async () => {
      mockReq.cookies = {};

      await expect(
        controller.refresh(mockReq as any, mockRes as any),
      ).rejects.toThrow(UnauthorizedException);

      expect(authService.validateRefreshToken).not.toHaveBeenCalled();
    });

    it('should throw when validateRefreshToken rejects', async () => {
      authService.validateRefreshToken.mockRejectedValue(
        new UnauthorizedException('Refresh token has been revoked'),
      );

      await expect(
        controller.refresh(mockReq as any, mockRes as any),
      ).rejects.toThrow('Refresh token has been revoked');
    });
  });

  // ─── POST /auth/logout ─────────────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    let mockReq: { cookies: Record<string, string> };
    let mockRes: { cookie: jest.Mock };

    beforeEach(() => {
      mockReq = { cookies: { refreshToken: 'valid-refresh-token' } };
      mockRes = { cookie: jest.fn() };
    });

    it('should revoke refresh token and clear cookie', async () => {
      const result = await controller.logout(mockReq as any, mockRes as any);

      expect(authService.revokeRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refreshToken',
        '',
        expect.objectContaining({ maxAge: 0 }),
      );
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should still clear cookie even if no refresh token in cookie', async () => {
      mockReq.cookies = {};

      const result = await controller.logout(mockReq as any, mockRes as any);

      expect(authService.revokeRefreshToken).not.toHaveBeenCalled();
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', '', expect.anything());
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  // ─── GET /auth/me ──────────────────────────────────────────────────────────

  describe('GET /auth/me', () => {
    it('should return req.user from JWT payload', () => {
      const mockUser = { id: 'user-1', email: 'me@example.com', role: 'USER' };
      const mockReq = { user: mockUser };

      const result = controller.getMe(mockReq as any);

      expect(result).toEqual(mockUser);
    });
  });
});
