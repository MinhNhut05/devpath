// roles.guard.ts - Role-based Authorization Guard
//
// Guard này chạy SAU JwtAuthGuard:
//   JwtAuthGuard → verify token hợp lệ, gắn user vào req.user
//   RolesGuard → check req.user.role có trong @Roles() không
//
// Cách dùng:
//   @UseGuards(JwtAuthGuard, RolesGuard)  // Thứ tự quan trọng!
//   @Roles(UserRole.ADMIN)
//   @Get('admin/dashboard')
//   getDashboard() { ... }
//
// Nếu route KHÔNG có @Roles() decorator → cho phép tất cả authenticated users
// → RolesGuard chỉ block khi có @Roles() VÀ role không khớp

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/index.js';

@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector: NestJS utility để đọc metadata từ route handlers
  // Được inject bởi DI system
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Đọc required roles từ metadata (set bởi @Roles() decorator)
    // getAllAndOverride: ưu tiên method-level metadata, fallback sang class-level
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [
        context.getHandler(), // Method-level metadata (ưu tiên hơn)
        context.getClass(),   // Class-level metadata (fallback)
      ],
    );

    // Nếu không có @Roles() decorator → không yêu cầu role cụ thể → pass
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Lấy user từ request (đã được gắn bởi JwtAuthGuard/JwtStrategy)
    const request = context.switchToHttp().getRequest();
    const user = request.user as { id: string; email: string; role: UserRole } | undefined;

    // Nếu không có user → JwtAuthGuard chưa chạy hoặc không authenticate được
    if (!user) {
      return false;
    }

    // Check role: user.role có trong danh sách requiredRoles không?
    // Array.includes dùng được vì UserRole là enum với finite values
    return requiredRoles.includes(user.role);
  }
}
