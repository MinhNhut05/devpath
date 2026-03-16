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
import { AdminQuizzesService } from './admin-quizzes.service.js';
import { CreateQuizDto, UpdateQuizDto } from './dto/index.js';

@Controller('admin/quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminQuizzesController {
  constructor(
    private readonly adminQuizzesService: AdminQuizzesService,
  ) {}

  @Post()
  async createQuiz(@Body() dto: CreateQuizDto) {
    const result = await this.adminQuizzesService.createQuiz(dto);
    return { success: true, data: result };
  }

  @Put(':id')
  async updateQuiz(
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
  ) {
    const result = await this.adminQuizzesService.updateQuiz(id, dto);
    return { success: true, data: result };
  }

  @Delete(':id')
  async deleteQuiz(@Param('id') id: string) {
    const result = await this.adminQuizzesService.deleteQuiz(id);
    return { success: true, data: result };
  }
}
