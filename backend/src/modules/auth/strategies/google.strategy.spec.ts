import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy.js';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          GOOGLE_CLIENT_ID: 'test-client-id',
          GOOGLE_CLIENT_SECRET: 'test-client-secret',
          GOOGLE_CALLBACK_URL: 'http://localhost:3001/api/v1/auth/google/callback',
        };
        return config[key];
      }),
    } as any;

    strategy = new GoogleStrategy(configService);
  });

  describe('validate', () => {
    it('should return OAuthProfile from Google profile', (done) => {
      const googleProfile = {
        id: 'google-123',
        displayName: 'Test User',
        emails: [{ value: 'test@gmail.com', verified: true }],
        photos: [{ value: 'https://lh3.google.com/avatar.jpg' }],
      };

      strategy.validate('access-token', 'refresh-token', googleProfile, (err, user) => {
        expect(err).toBeNull();
        expect(user).toEqual({
          provider: 'google',
          providerId: 'google-123',
          email: 'test@gmail.com',
          displayName: 'Test User',
          avatarUrl: 'https://lh3.google.com/avatar.jpg',
        });
        done();
      });
    });

    it('should handle profile without photos', (done) => {
      const googleProfile = {
        id: 'google-456',
        displayName: 'No Photo User',
        emails: [{ value: 'nophoto@gmail.com' }],
        photos: undefined,
      };

      strategy.validate('access-token', 'refresh-token', googleProfile, (err, user) => {
        expect(err).toBeNull();
        expect(user).toMatchObject({
          provider: 'google',
          email: 'nophoto@gmail.com',
          avatarUrl: undefined,
        });
        done();
      });
    });

    it('should throw UnauthorizedException when emails is missing', (done) => {
      const googleProfile = {
        id: 'google-999',
        displayName: 'No Email',
        emails: undefined,
        photos: [],
      };

      strategy.validate('access-token', 'refresh-token', googleProfile, (err, user) => {
        expect(err).toBeInstanceOf(UnauthorizedException);
        expect(user).toBeUndefined();
        done();
      });
    });
  });
});
