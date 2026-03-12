# API Design

---

## Base URL

- **Production:** `https://api.devpathos.tech/api/v1`
- **Development:** `http://localhost:3001/api/v1`

---

## Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-15T10:00:00Z",
    "requestId": "uuid"
  }
}

// Success Response with Pagination
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "timestamp": "2026-02-15T10:00:00Z",
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2026-02-15T10:00:00Z",
    "requestId": "uuid"
  }
}
```

---

## API Endpoints

### Authentication

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
| GET | `/auth/me` | Get current user | Yes |

### Onboarding

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/onboarding/questions` | Get onboarding questions | Yes |
| POST | `/onboarding/submit` | Submit onboarding answers | Yes |
| GET | `/onboarding/recommendation` | Get AI path recommendation | Yes |
| POST | `/onboarding/confirm` | Confirm selected path | Yes |

### Learning Paths

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/learning-paths` | List all published paths | No |
| GET | `/learning-paths/:slug` | Get path details with tracks | No |
| GET | `/learning-paths/:slug/lessons` | Get all lessons in path | No |
| POST | `/learning-paths/:slug/enroll` | Enroll in learning path | Yes |

### Lessons

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/lessons/:slug` | Get lesson details | Yes |
| POST | `/lessons/:slug/start` | Mark lesson as started | Yes |
| POST | `/lessons/:slug/complete` | Mark lesson as completed | Yes |
| GET | `/lessons/:slug/quiz` | Get lesson quiz | Yes |

### Quiz

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/quizzes/:id` | Get quiz with questions | Yes |
| POST | `/quizzes/:id/submit` | Submit quiz answers | Yes |
| GET | `/quizzes/:id/results` | Get user's quiz history | Yes |
| POST | `/quizzes/:id/evaluate-essay` | AI evaluate essay answer | Yes |
| POST | `/quizzes/:id/run-code` | Run code challenge | Yes |

### Progress

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/progress` | Get overall progress | Yes |
| GET | `/progress/path/:pathId` | Get path-specific progress | Yes |
| GET | `/progress/activity` | Get activity data (for graph) | Yes |
| POST | `/progress/session/start` | Start learning session | Yes |
| POST | `/progress/session/end` | End learning session | Yes |

### AI Chatbot

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/ai/chat` | Send message to AI | Yes |
| GET | `/ai/chat/history` | Get chat history | Yes |
| GET | `/ai/quota` | Get remaining daily quota | Yes |
| GET | `/ai/models` | Get available models for user tier | Yes |

### Payment & Subscription

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/subscriptions/plans` | Get available plans & pricing | No |
| GET | `/subscriptions/current` | Get user's current subscription | Yes |
| POST | `/subscriptions/create` | Create payment order | Yes |
| POST | `/subscriptions/webhook/momo` | MoMo payment callback | No (verified by signature) |
| POST | `/subscriptions/webhook/vnpay` | VNPay payment callback | No (verified by checksum) |
| GET | `/subscriptions/history` | Get payment history | Yes |

### Admin (Role: ADMIN)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/learning-paths` | List all paths | Admin |
| POST | `/admin/learning-paths` | Create learning path | Admin |
| PUT | `/admin/learning-paths/:id` | Update learning path | Admin |
| DELETE | `/admin/learning-paths/:id` | Delete learning path | Admin |
| POST | `/admin/tracks` | Create track | Admin |
| PUT | `/admin/tracks/:id` | Update track | Admin |
| DELETE | `/admin/tracks/:id` | Delete track | Admin |
| POST | `/admin/lessons` | Create lesson | Admin |
| PUT | `/admin/lessons/:id` | Update lesson | Admin |
| DELETE | `/admin/lessons/:id` | Delete lesson | Admin |
| POST | `/admin/quizzes` | Create quiz | Admin |
| PUT | `/admin/quizzes/:id` | Update quiz | Admin |
| DELETE | `/admin/quizzes/:id` | Delete quiz | Admin |
| GET | `/admin/users` | List all users | Admin |
| GET | `/admin/analytics` | Get system analytics | Admin |
| POST | `/admin/content/generate` | AI bulk generate content | Admin |

---

## Rate Limiting

| Endpoint Group | Limit |
|---------------|-------|
| Auth (OTP) | 5 requests/email/hour |
| General API | 100 requests/minute/IP |
| AI Chat | Based on tier quota |
| Payment webhooks | No limit (verified by signature) |
