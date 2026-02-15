# Infrastructure

---

## Architecture Overview

```
                        CLOUDFLARE
                   (DNS + DDoS Protection)
                          |
            +-------------+-------------+
            |                           |
            v                           v
    +---------------+         +-------------------+
    |    VERCEL      |         | DigitalOcean VPS  |
    | React Frontend |         |                   |
    | (Static SPA)   |         |  Nginx Proxy Mgr  |
    |                |         |  (separate VPS)    |
    | devpathos.tech |         |        |           |
    +---------------+         |        v           |
                               |  Docker Compose   |
                               |  +-------------+  |
                               |  | NestJS API  |  |
                               |  | PostgreSQL  |  |
                               |  | Redis       |  |
                               |  +-------------+  |
                               |                   |
                               | api.devpathos.tech|
                               +-------------------+
                                        |
                    +-------------------+-------------------+
                    |                   |                   |
                    v                   v                   v
            +-------------+   +-----------------+   +----------+
            |   Mailgun   |   |  AI Provider    |   |  MoMo /  |
            | (Email OTP) |   | manager.        |   |  VNPay   |
            +-------------+   | devteamos.me    |   +----------+
                               +-----------------+
```

---

## VPS Configuration

| Item | Value |
|------|-------|
| Provider | DigitalOcean |
| Credits | $200 (expires Jan 2027) |
| OS | Ubuntu 22.04 LTS |
| Region | Singapore (SGP1) - closest to Vietnam |
| Size | TBD (recommend: 2 vCPU, 4GB RAM, $24/mo) |
| Status | Account created, Droplet not yet created |

---

## Docker Setup (Production)

All services run in Docker containers on the VPS:

```yaml
# Services in docker-compose.prod.yml
services:
  backend:        # NestJS API (port 3001)
  postgres:       # PostgreSQL 16 (port 5432, internal only)
  redis:          # Redis 7 (port 6379, internal only)
```

> **Nginx Proxy Manager** chay tren VPS rieng (npm.devteamos.me), proxy requests den VPS DevPath.

---

## Docker Setup (Development)

```yaml
# Services in docker-compose.yml
services:
  postgres:       # PostgreSQL 16 (port 5434 - avoid conflict)
  redis:          # Redis 7 (port 6380 - avoid conflict)
  backend:        # NestJS (port 3001)
  frontend:       # React dev server (port 5173)

# Optional tools (--profile tools)
  pgadmin:        # Database GUI (port 5050)
  redis-commander: # Redis GUI (port 8081)
  mailhog:        # Email testing (port 8025)
```

---

## Domain & DNS

| Domain | Usage | Provider | Status |
|--------|-------|----------|--------|
| devpathos.tech | Frontend (main domain) | .TECH Domains | Registered, DNS not configured |
| api.devpathos.tech | Backend API | .TECH Domains | Subdomain, needs DNS setup |
| devteamos.me | Other projects | Namecheap | Registered |

### Cloudflare Setup (TODO)
1. Add `devpathos.tech` to Cloudflare
2. Update nameservers at .TECH Domains control panel
3. Add DNS records:
   - `devpathos.tech` → Vercel (CNAME)
   - `api.devpathos.tech` → VPS IP (A record, proxied)

---

## Nginx Proxy Manager

- URL: https://npm.devteamos.me/
- Running on: Separate VPS (already set up)
- Purpose: SSL termination + reverse proxy for `api.devpathos.tech`
- Will proxy: `api.devpathos.tech` → `VPS_IP:3001`

---

## Access URLs

### Development
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api/v1 |
| pgAdmin | http://localhost:5050 |
| Redis Commander | http://localhost:8081 |
| Mailhog | http://localhost:8025 |

### Production
| Service | URL |
|---------|-----|
| Frontend | https://devpathos.tech |
| Backend API | https://api.devpathos.tech/api/v1 |
| Nginx Proxy Manager | https://npm.devteamos.me |
