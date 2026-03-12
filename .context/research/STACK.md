# STACK - Tech Choices & Rationale

> Why each technology was chosen.

---

## Backend: NestJS (not Express)

- **Why**: Opinionated structure, built-in DI, modules, guards, interceptors
- **Alternative**: Express.js (too flexible, no structure for large projects)
- **Decision**: NestJS gives structure that helps learning and scaling

## ORM: Prisma (not TypeORM, Sequelize)

- **Why**: Type-safe, auto-generated client, great migration system, schema-first
- **Alternative**: TypeORM (more mature but less type-safe), Sequelize (callback-style)
- **Decision**: Prisma's DX is best for TypeScript projects

## State: Zustand (not Redux, Context)

- **Why**: Minimal boilerplate, no providers, simple API
- **Alternative**: Redux Toolkit (overkill for this scale), Context API (re-render issues)
- **Decision**: Zustand = simplicity + performance

## Server State: React Query (not SWR, manual)

- **Why**: Caching, refetching, pagination, mutations built-in
- **Alternative**: SWR (simpler but fewer features), manual fetch (no caching)
- **Decision**: React Query handles all data fetching patterns we need

## UI: Shadcn/ui (not MUI, Ant Design)

- **Why**: Copy-paste components (own the code), Radix UI accessibility, Tailwind-based
- **Alternative**: MUI (heavy, opinionated), Ant Design (Chinese ecosystem)
- **Decision**: Shadcn/ui = lightweight + customizable + accessible

## Auth: Passwordless OTP (not password-based)

- **Why**: Better UX, no password management, no password reset flow
- **Alternative**: Email + password (more common but worse UX)
- **Decision**: OTP + OAuth covers all cases without passwords

## AI: Direct API (not LangChain)

- **Why**: Simpler, less abstraction, API is already Anthropic-compatible
- **Alternative**: LangChain.js (too much abstraction for our use case)
- **Decision**: Direct Anthropic SDK calls are cleaner

## Payment: MoMo + VNPay (not Stripe)

- **Why**: Most popular in Vietnam, target audience uses these
- **Alternative**: Stripe (not popular in VN, fewer local payment methods)
- **Decision**: Local payment methods for Vietnamese users
