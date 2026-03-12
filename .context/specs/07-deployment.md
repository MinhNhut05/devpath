# Deployment

---

## Production Architecture

```
                     Cloudflare (DNS + DDoS)
                            |
              +-------------+-------------+
              |                           |
              v                           v
      +---------------+         +-------------------+
      |    Vercel      |         | DigitalOcean VPS  |
      | devpathos.tech |         | (Docker Compose)  |
      | (React SPA)    |         |                   |
      +---------------+         | +---------------+ |
                                 | | NestJS API    | |
                                 | | (port 3001)   | |
                                 | +---------------+ |
                                 | | PostgreSQL 16 | |
                                 | | (port 5432)   | |
                                 | +---------------+ |
                                 | | Redis 7       | |
                                 | | (port 6379)   | |
                                 | +---------------+ |
                                 |                   |
                                 +-------------------+
                                         |
                                         v
                                 +-------------------+
                                 | Nginx Proxy Mgr   |
                                 | (separate VPS)     |
                                 | npm.devteamos.me   |
                                 |                   |
                                 | api.devpathos.tech |
                                 | → VPS_IP:3001     |
                                 +-------------------+
```

---

## VPS Setup (TODO)

### 1. Create Droplet
- Provider: DigitalOcean ($200 credits)
- OS: Ubuntu 22.04 LTS
- Region: Singapore (SGP1)
- Size: 2 vCPU, 4GB RAM ($24/mo)

### 2. Install Docker
```bash
# Install Docker Engine + Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 3. Clone & Deploy
```bash
git clone <repo-url> /var/www/devpath
cd /var/www/devpath
cp .env.example .env
# Edit .env with production values
docker compose -f docker-compose.prod.yml up -d
```

---

## Docker Production Compose

```yaml
# docker-compose.prod.yml
services:
  backend:
    build: ./backend
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: devpath
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/var/lib/redis/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

---

## Nginx Proxy Manager Configuration

Tren npm.devteamos.me:
1. Add Proxy Host
2. Domain: `api.devpathos.tech`
3. Forward to: `VPS_IP:3001`
4. Enable SSL (Let's Encrypt)
5. Force HTTPS

---

## CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/devpath
            git pull origin main
            docker compose -f docker-compose.prod.yml build backend
            docker compose -f docker-compose.prod.yml up -d backend
            docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

---

## Monitoring

### Sentry (Error Tracking)
- Track unhandled exceptions
- API response times > 3s
- AI service failures
- Authentication failures

### Datadog (Server Monitoring)
- Datadog Pro (free 2 years, student pack)
- Region: US5 (us5.datadoghq.com)
- Monitor: CPU, RAM, disk, network
- Alert khi resource cao

---

## Logging

```typescript
// Winston configuration
{
  level: 'info',
  format: combine(timestamp(), json()),
  defaultMeta: { service: 'devpath-api' },
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
}
```

---

## Environment Variables (Production)

```bash
# App
NODE_ENV=production
PORT=3001
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/devpath

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_ACCESS_SECRET=<strong-random-secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<strong-random-secret>
JWT_REFRESH_EXPIRES_IN=7d

# Email (Mailgun)
MAILGUN_API_KEY=<key>
MAILGUN_DOMAIN=devpathos.tech
EMAIL_FROM=noreply@devpathos.tech

# OAuth
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>
GITHUB_CLIENT_ID=<id>
GITHUB_CLIENT_SECRET=<secret>

# AI
AI_API_URL=https://manager.devteamos.me
AI_API_KEY=<key>

# Payment
MOMO_PARTNER_CODE=<code>
MOMO_ACCESS_KEY=<key>
MOMO_SECRET_KEY=<secret>
VNPAY_TMN_CODE=<code>
VNPAY_HASH_SECRET=<secret>

# Monitoring
SENTRY_DSN=<dsn>
```
