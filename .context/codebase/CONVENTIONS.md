# CONVENTIONS - Code Patterns In Use

> Patterns currently used in the codebase. Updated as code evolves.

---

## Backend Patterns

### Module Registration
- All modules registered in `app.module.ts`
- Each module is self-contained (controller + service + DTOs)

### Prisma Usage
- `PrismaService` extends `PrismaClient` with `onModuleInit`
- Injected via NestJS DI into services
- Schema uses `@@map()` for snake_case table names

### Response Format
```typescript
{
  success: boolean;
  data?: any;
  error?: { code: string; message: string; details?: any };
  meta: { timestamp: string; requestId: string };
}
```

### Auth Pattern
- JWT strategy with Passport
- Access token: 15min, in memory (client)
- Refresh token: 7 days, HttpOnly cookie

## Frontend Patterns

(To be documented when frontend development starts)

---

> Reference: `.context/research/CONVENTIONS.md` for naming and import conventions
