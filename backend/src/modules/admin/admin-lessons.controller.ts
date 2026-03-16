import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/index.js';
import { AdminLessonsService } from './admin-lessons.service.js';
import { CreateLessonDto, UpdateLessonDto } from './dto/index.js';

@Controller('admin/lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminLessonsController {
  constructor(
    private readonly adminLessonsService: AdminLessonsService,
  ) {}

  @Post()
  async createLesson(@Body() dto: CreateLessonDto) {
    const result = await this.adminLessonsService.createLesson(dto);
    return { success: true, data: result };
  }

  @Put(':id')
  async updateLesson(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
  ) {
    const result = await this.adminLessonsService.updateLesson(id, dto);
    return { success: true, data: result };
  }

  @Delete(':id')
  async deleteLesson(@Param('id') id: string) {
    const result = await this.adminLessonsService.deleteLesson(id);
    return { success: true, data: result };
  }
}
