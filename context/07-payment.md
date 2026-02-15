# Payment & Monetization

---

## Subscription Tiers

| Tier | Models | Tokens/day | Price/month |
|------|--------|-----------|-------------|
| **Free** | gemini-2.5-flash, gemini-2.5-flash-thinking | TBD | 0 VND |
| **Pro** | + claude-sonnet-4-5, gemini-3-pro-low, gemini-3-pro-high | TBD | TBD |
| **Ultra** | + claude-opus-4-6-thinking (thoai mai hon) | TBD | TBD |

> Con so tokens/day va gia cu the se duoc xac dinh khi implement.

---

## Payment Providers

### MoMo

| Item | Value |
|------|-------|
| Type | Mobile payment QR + wallet |
| Integration | MoMo Payment Gateway API |
| Webhook | POST `/subscriptions/webhook/momo` |
| Verification | HMAC-SHA256 signature |
| Status | Chua dang ky merchant - can tim hieu |

### VNPay

| Item | Value |
|------|-------|
| Type | Bank transfer + QR code (nhieu ngan hang) |
| Integration | VNPay Payment Gateway API |
| Webhook | POST `/subscriptions/webhook/vnpay` |
| Verification | Checksum (vnp_SecureHash) |
| Status | Chua dang ky merchant - can tim hieu |

---

## Payment Flow

```
1. User chon plan (Pro/Ultra) tren frontend
2. Frontend goi POST /subscriptions/create {tier, provider}
3. Backend tao payment order, tra ve payment URL
4. User redirect den MoMo/VNPay de thanh toan
5. User thanh toan thanh cong
6. MoMo/VNPay gui webhook den backend
7. Backend verify signature/checksum
8. Backend cap nhat: PaymentLog.status = COMPLETED
9. Backend tao Subscription record
10. Backend cap nhat User.tier = PRO/ULTRA
11. User quay lai app, da duoc kich hoat tier moi
```

```
+--------+     +---------+     +----------+     +--------+
| Client |     | Backend |     | MoMo/    |     |  User  |
|        |     |         |     | VNPay    |     | (Bank) |
+---+----+     +----+----+     +----+-----+     +---+----+
    |               |               |               |
    | POST /create  |               |               |
    | {tier, momo}  |               |               |
    |-------------->|               |               |
    |               | Create order  |               |
    |               |-------------->|               |
    |               |               |               |
    |<--------------|               |               |
    | {paymentUrl}  |               |               |
    |               |               |               |
    | Redirect user |               |               |
    |------------------------------>|               |
    |               |               | User pays     |
    |               |               |<--------------|
    |               |               |               |
    |               | Webhook       |               |
    |               |<--------------|               |
    |               |               |               |
    |               | Verify +      |               |
    |               | Activate tier |               |
    |               |               |               |
    | Redirect back |               |               |
    |<------------------------------|               |
    |               |               |               |
    | GET /current  |               |               |
    |-------------->|               |               |
    |<--------------|               |               |
    | {tier: PRO}   |               |               |
```

---

## Subscription Logic

### Activation
- Khi webhook thanh toan thanh cong → tao `Subscription` record
- Cap nhat `User.tier` = tier da mua
- `Subscription.startsAt` = now
- `Subscription.expiresAt` = now + 30 days

### Expiration
- Cron job chay hang ngay kiem tra subscriptions het han
- Neu het han va khong gia han → `User.tier` = FREE
- `Subscription.isActive` = false

### Renewal
- User thanh toan lai truoc khi het han
- Tao `Subscription` moi, `expiresAt` = old.expiresAt + 30 days

---

## Database Models

```prisma
model Subscription {
  id              String          @id @default(uuid())
  userId          String          @map("user_id")
  tier            UserTier
  startsAt        DateTime        @map("starts_at")
  expiresAt       DateTime        @map("expires_at")
  isActive        Boolean         @default(true) @map("is_active")
  paymentProvider PaymentProvider @map("payment_provider")
  createdAt       DateTime        @default(now()) @map("created_at")

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  paymentLogs PaymentLog[]
}

model PaymentLog {
  id             String          @id @default(uuid())
  userId         String          @map("user_id")
  subscriptionId String?         @map("subscription_id")
  provider       PaymentProvider
  amount         Int             // VND
  status         PaymentStatus   @default(PENDING)
  transactionId  String?         @unique @map("transaction_id")
  rawResponse    Json?           @map("raw_response")
  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscription Subscription? @relation(fields: [subscriptionId], references: [id])
}
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/subscriptions/plans` | Get available plans & pricing | No |
| GET | `/subscriptions/current` | Get user's current subscription | Yes |
| POST | `/subscriptions/create` | Create payment order | Yes |
| POST | `/subscriptions/webhook/momo` | MoMo callback | No (signature verified) |
| POST | `/subscriptions/webhook/vnpay` | VNPay callback | No (checksum verified) |
| GET | `/subscriptions/history` | Get payment history | Yes |

---

## TODO (vua lam vua tim hieu)

- [ ] Dang ky MoMo merchant account (ca nhan hay doanh nghiep?)
- [ ] Dang ky VNPay merchant account
- [ ] Tim hieu MoMo Payment Gateway API docs
- [ ] Tim hieu VNPay API docs
- [ ] Xac dinh gia Pro va Ultra
- [ ] Xac dinh token quota cho moi tier
