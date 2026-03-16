import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/index.js';
import { AdminAnalyticsService } from './admin-analytics.service.js';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get()
  async getAnalytics() {
    const result = await this.adminAnalyticsService.getAnalytics();
    return { success: true, data: result };
  }
}
