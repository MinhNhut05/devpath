import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GithubStrategy } from './github.strategy.js';

describe('GithubStrategy', () => {
  let strategy: GithubStrategy;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          GITHUB_CLIENT_ID: 'test-client-id',
          GITHUB_CLIENT_SECRET: 'test-client-secret',
          GITHUB_CALLBACK_URL: 'http://localhost:3001/api/v1/auth/github/callback',
        };
        return config[key];
      }),
    } as any;

    strategy = new GithubStrategy(configService);
  });

  describe('validate', () => {
    it('should return OAuthProfile from GitHub profile', (done) => {
      const githubProfile = {
        id: 'github-789',
        displayName: 'GitHub User',
        username: 'ghuser',
        emails: [{ value: 'test@github.com' }],
        photos: [{ value: 'https://avatars.githubusercontent.com/u/123' }],
      };

      strategy.validate('access-token', 'refresh-token', githubProfile, (err, user) => {
        expect(err).toBeNull();
        expect(user).toEqual({
          provider: 'github',
          providerId: 'github-789',
          email: 'test@github.com',
          displayName: 'GitHub User',
          avatarUrl: 'https://avatars.githubusercontent.com/u/123',
        });
        done();
      });
    });

    it('should fallback to username when displayName is null', (done) => {
      const githubProfile = {
        id: 'github-101',
        displayName: null,
        username: 'fallback-user',
        emails: [{ value: 'fallback@github.com' }],
        photos: [],
      };

      strategy.validate('access-token', 'refresh-token', githubProfile, (err, user) => {
        expect(err).toBeNull();
        expect(user).toMatchObject({
          displayName: 'fallback-user',
        });
        done();
      });
    });

    it('should throw UnauthorizedException when email is missing', (done) => {
      const githubProfile = {
        id: 'github-999',
        displayName: 'No Email',
        username: 'noemail',
        emails: undefined,
        photos: [],
      };

      strategy.validate('access-token', 'refresh-token', githubProfile, (err, user) => {
        expect(err).toBeInstanceOf(UnauthorizedException);
        expect(user).toBeUndefined();
        done();
      });
    });

    it('should throw when emails array is empty', (done) => {
      const githubProfile = {
        id: 'github-888',
        displayName: 'Empty Emails',
        username: 'emptyemails',
        emails: [],
        photos: [],
      };

      strategy.validate('access-token', 'refresh-token', githubProfile, (err, user) => {
        expect(err).toBeInstanceOf(UnauthorizedException);
        done();
      });
    });
  });
});
