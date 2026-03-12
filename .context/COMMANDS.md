# COMMANDS

> Development, build, and test commands.

---

## Docker (Primary Dev Method)

```bash
docker-compose up -d                    # Start core services (postgres, redis, backend, frontend)
docker-compose --profile tools up -d    # Include pgAdmin, Redis Commander, Mailhog
docker-compose down                     # Stop all services
docker-compose logs -f backend          # View backend logs
```

## Backend (NestJS - port 3001)

```bash
cd backend
pnpm run start:dev     # Development server with hot reload
pnpm run build         # Production build
pnpm run test          # Run tests
pnpm run lint          # Lint code
```

### Prisma

```bash
cd backend
npx prisma studio         # Database GUI
npx prisma migrate dev     # Run migrations (dev)
npx prisma migrate deploy  # Run migrations (prod)
npx prisma db seed         # Seed database
npx prisma generate        # Regenerate client
```

## Frontend (React + Vite - port 5173)

```bash
cd frontend
pnpm run dev           # Development server
pnpm run build         # Production build
pnpm run preview       # Preview production build
pnpm run lint          # Lint code
```

## Monorepo

```bash
pnpm install           # Install all workspace dependencies
```

## Docker Production

```bash
docker compose -f docker-compose.prod.yml up -d              # Start production
docker compose -f docker-compose.prod.yml build backend       # Rebuild backend
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy  # Run prod migrations
```

## Access URLs (Development)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api/v1 |
| pgAdmin | http://localhost:5050 |
| Redis Commander | http://localhost:8081 |
| Mailhog | http://localhost:8025 |

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Key vars:

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection | postgresql://user:pass@localhost:5434/devpath |
| REDIS_URL | Redis connection | redis://localhost:6380 |
| JWT_ACCESS_SECRET | Access token secret | (random string) |
| JWT_REFRESH_SECRET | Refresh token secret | (random string) |
| MAILGUN_API_KEY | Mailgun API key | key-xxx |
| AI_API_URL | AI provider URL | https://manager.devteamos.me |
| AI_API_KEY | AI provider key | sk-xxx |

> Full env vars list: see `.env.example`
