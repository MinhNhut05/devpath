// current-user.decorator.ts - Custom param decorator để extract JWT user
//
// Tại sao tạo custom decorator thay vì dùng @Req() req: Request?
//
// Vấn đề với @Req():
//   → Type assertion: `req.user as JwtUser` — TypeScript không check được
//   → Expose toàn bộ Request object dù chỉ cần user.id
//   → Hard to test: mock cả Request object khi viết unit test
//   → Duplicate: 3 controllers đều define `type JwtUser` giống nhau
//
// Giải pháp @CurrentUser():
//   → Type-safe: trả về JwtPayload, không cần cast
//   → Focused: chỉ extract user, không expose request
//   → Reusable: dùng ở mọi controller, không cần define type lại
//   → Testable: dễ mock 1 user object hơn mock Request
//
// Usage:
//   @CurrentUser() user: JwtPayload          → lấy toàn bộ user object
//   @CurrentUser('id') userId: string        → chỉ lấy user.id
//   @CurrentUser('email') email: string      → chỉ lấy user.email

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Shape của JWT payload từ JwtStrategy.validate()
// Phải khớp với return value của jwt.strategy.ts
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    // Nếu truyền key (vd: 'id') → trả về user[key]
    // Nếu không truyền key → trả về toàn bộ user object
    return data ? user?.[data] : user;
  },
);
