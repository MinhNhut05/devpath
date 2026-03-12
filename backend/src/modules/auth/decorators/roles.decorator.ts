// roles.decorator.ts - Custom @Roles() decorator
//
// Decorator này đánh dấu endpoint yêu cầu role cụ thể.
// Hoạt động cùng với RolesGuard (trong guards/roles.guard.ts).
//
// Cách dùng:
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles('ADMIN')
//   @Get('admin/users')
//   getUsers() { ... }
//
// Tại sao dùng SetMetadata?
//   NestJS dùng Reflector API để đọc metadata từ route handler/class
//   SetMetadata('key', value) → lưu value vào metadata với key
//   RolesGuard đọc lại bằng reflector.getAllAndOverride('roles', [...])

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

// Key dùng để lưu/đọc metadata — export để RolesGuard dùng
export const ROLES_KEY = 'roles';

// @Roles('ADMIN') → SetMetadata('roles', ['ADMIN'])
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
