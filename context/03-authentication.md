# Authentication

---

## Login Methods

DevPath supports 3 login methods. All return the same JWT tokens.

| Method | Provider | Status |
|--------|----------|--------|
| Email OTP (passwordless) | Mailgun | Primary |
| Google OAuth | Google Cloud Console | Secondary |
| GitHub OAuth | GitHub OAuth Apps | Secondary |

---

## OTP Flow

```
+----------+     +----------+     +----------+     +----------+
|  Client  |     |   API    |     |  Mailgun |     |  Email   |
+----+-----+     +----+-----+     +----+-----+     +----+-----+
     |                |                |                |
     | POST /auth/otp/request         |                |
     | {email}        |                |                |
     |--------------->|                |                |
     |                |                |                |
     |                | Generate OTP   |                |
     |                | (6 digits)     |                |
     |                | Expire: 2 min  |                |
     |                |                |                |
     |                | Send Email     |                |
     |                |--------------->|                |
     |                |                |   Deliver      |
     |                |                |--------------->|
     |                |                |                |
     |<---------------|                |                |
     | {message: "OTP sent"}          |                |
     |                |                |                |
     | POST /auth/otp/verify          |                |
     | {email, code}  |                |                |
     |--------------->|                |                |
     |                |                |                |
     |                | Verify OTP     |                |
     |                | Create User    |                |
     |                | (if not exist) |                |
     |                |                |                |
     |<---------------|                |                |
     | {accessToken,  |                |                |
     |  refreshToken, |                |                |
     |  user,         |                |                |
     |  isNewUser}    |                |                |
```

- First-time email → auto-create user account
- `isNewUser: true` → redirect to onboarding

---

## OAuth Flow (Google & GitHub)

```
Client → Redirect to Google/GitHub → User authorizes → Callback with code
→ API exchanges code for user info → Create/find user → Return JWT tokens
```

### Google OAuth Setup
1. Create project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 Client ID
4. Set redirect URI: `https://api.devpathos.tech/api/v1/auth/google/callback`

### GitHub OAuth Setup
1. Go to GitHub Settings → Developer Settings → OAuth Apps
2. Create new OAuth App
3. Set callback URL: `https://api.devpathos.tech/api/v1/auth/github/callback`

---

## JWT Token Structure

```typescript
// Access Token (15 minutes)
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "USER",
  "tier": "FREE",        // FREE | PRO | ULTRA
  "type": "access",
  "iat": 1705654800,
  "exp": 1705655700
}

// Refresh Token (7 days)
{
  "sub": "user-uuid",
  "type": "refresh",
  "jti": "unique-token-id",  // For revocation
  "iat": 1705654800,
  "exp": 1706259600
}
```

---

## Token Storage

| Token | Storage | Reason |
|-------|---------|--------|
| Access Token | Memory (Zustand store) | Short-lived, no XSS risk |
| Refresh Token | HttpOnly Cookie | Protected from JS access |

---

## Security Settings

| Setting | Value |
|---------|-------|
| OTP length | 6 digits |
| OTP expiry | 2 minutes |
| Max failed OTP attempts | 5 → lock 15 minutes |
| Max OTP requests per email | 5 per hour |
| Brute force backoff | Exponential: 1s, 2s, 4s, 8s... |
| Access token expiry | 15 minutes |
| Refresh token expiry | 7 days |

---

## Email Service (Mailgun)

| Item | Value |
|------|-------|
| Provider | Mailgun |
| Free tier | 100 emails/day |
| From address | noreply@devpathos.tech |
| Requires | Domain verification (DNS records in Cloudflare) |

### Mailgun DNS Records (TODO)
- TXT record for domain verification
- MX records for receiving (optional)
- CNAME for tracking (optional)

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/otp/request` | Request OTP code | No |
| POST | `/auth/otp/verify` | Verify OTP & get tokens | No |
| GET | `/auth/google` | Redirect to Google OAuth | No |
| GET | `/auth/google/callback` | Google OAuth callback | No |
| GET | `/auth/github` | Redirect to GitHub OAuth | No |
| GET | `/auth/github/callback` | GitHub OAuth callback | No |
| POST | `/auth/refresh` | Refresh access token | Refresh Token |
| POST | `/auth/logout` | Invalidate refresh token | Yes |
| GET | `/auth/me` | Get current user info | Yes |
