# PITFALLS - Common Mistakes & Lessons Learned

> Things to watch out for. Updated as new pitfalls are discovered.

---

## Environment

- **Port conflicts**: PostgreSQL uses 5434 (not default 5432), Redis uses 6380 (not 6379) to avoid conflicts with other local projects
- **Docker**: Always check `docker-compose.yml` for correct port mappings before connecting

## GitHub Student Pack

- Need `.edu` email or school-issued email
- Need valid student ID card (clear photo)
- Approval is fast if documents are complete

## DigitalOcean

- Need payment method verification (card/PayPal)
- Pre-authorization ~$5 (refunded in 3-7 days)
- Credits auto-add after verification
- $200 credits = ~16-33 months of free VPS (depending on config)

## Domains

- Both `devteamos.me` and `devpathos.tech` have free DNS management
- SSL certificate (PositiveSSL) needs manual activation when deploying
- Cloudflare nameservers need to be set at domain registrar

## Prisma

- Always run `npx prisma generate` after schema changes
- `npx prisma migrate dev` creates migration AND applies it (dev only)
- `npx prisma migrate deploy` for production (applies only, no generate)

## NestJS

- (To be filled as development progresses)

## React

- (To be filled as development progresses)
