# Security

---

## Security Checklist

- [ ] HTTPS everywhere (Nginx Proxy Manager + Let's Encrypt)
- [ ] CORS configured properly (only allow devpathos.tech)
- [ ] Rate limiting on all endpoints
- [ ] Input validation (Zod / class-validator)
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (React escaping + CSP headers)
- [ ] CSRF protection (SameSite cookies)
- [ ] Secrets in environment variables (never in code)
- [ ] Secure headers (Helmet middleware)
- [ ] Dependency vulnerability scanning (npm audit)
- [ ] OTP brute force protection (max attempts + lockout)
- [ ] JWT refresh token rotation
- [ ] Payment webhook signature verification
- [ ] Code challenge sandboxing (prevent malicious code execution)

---

## Authentication Security

| Measure | Implementation |
|---------|---------------|
| OTP expiry | 2 minutes |
| Max OTP attempts | 5 → lock 15 minutes |
| Max OTP requests | 5 per email per hour |
| Brute force backoff | Exponential: 1s, 2s, 4s, 8s... |
| Password | None (passwordless OTP) |
| Access token | 15 min, stored in memory |
| Refresh token | 7 days, HttpOnly cookie, SameSite=Strict |
| Token rotation | New refresh token on each refresh |

---

## CORS Configuration

```typescript
// NestJS main.ts
app.enableCors({
  origin: [
    'https://devpathos.tech',
    'http://localhost:5173',  // dev only
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

## Rate Limiting

```typescript
// NestJS throttler
import { ThrottlerModule } from '@nestjs/throttler';

ThrottlerModule.forRoot({
  ttl: 60000,     // 1 minute window
  limit: 100,     // max 100 requests per minute
});

// Custom limits per endpoint group
// Auth OTP: 5 requests/email/hour
// AI Chat: based on tier quota
// Payment webhooks: no limit (verified by signature)
```

---

## Input Validation

```typescript
// class-validator + class-transformer (NestJS)
// Zod (Frontend)

// Example: Validate OTP request
class RequestOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

// Example: Validate quiz submission
class SubmitQuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  answers: QuizAnswerDto[];
}
```

---

## Helmet (Secure Headers)

```typescript
// NestJS main.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

---

## Payment Webhook Security

### MoMo
- Verify HMAC-SHA256 signature
- Compare `signature` field with computed hash
- Use `secretKey` from MoMo merchant config

### VNPay
- Verify `vnp_SecureHash` checksum
- Use `hashSecret` from VNPay config
- Check `vnp_ResponseCode === '00'` for success

---

## Code Challenge Sandboxing

> Quan trong: User viet code va chay tren server → can sandbox de tranh malicious code.

Options (can nghien cuu them):
1. **Judge0 API** - hosted code execution service
2. **Docker sandbox** - chay code trong container isolated
3. **WebAssembly** - chay code client-side (han che server risk)
4. **iFrame sandbox** - cho JavaScript only

Recommendation: Bat dau voi **Judge0 API** (co free tier), chuyen sang self-host sau neu can.

---

## Environment Variables

- NEVER commit `.env` files
- Use `.env.example` as template
- Production secrets managed via VPS environment
- Rotate secrets periodically
- Different secrets for dev vs production
