import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/index.js';
import { AdminContentService } from './admin-content.service.js';
import { GenerateContentDto } from './dto/index.js';

@Controller('admin/content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminContentController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Post('generate')
  async generateContent(@Body() dto: GenerateContentDto) {
    const result = await this.adminContentService.generateContent(dto);
    return { success: true, data: result };
  }
}
