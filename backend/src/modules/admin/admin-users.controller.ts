import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/index.js';
import { AdminUsersService } from './admin-users.service.js';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto.js';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async listUsers(@Query() query: AdminUsersQueryDto) {
    const result = await this.adminUsersService.listUsers(query);
    return { success: true, data: result };
  }
}
