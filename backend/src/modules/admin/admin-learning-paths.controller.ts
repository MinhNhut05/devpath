import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/index.js';
import { AdminLearningPathsService } from './admin-learning-paths.service.js';
import {
  AdminListQueryDto,
  CreateLearningPathDto,
  UpdateLearningPathDto,
} from './dto/index.js';

@Controller('admin/learning-paths')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminLearningPathsController {
  constructor(
    private readonly adminLearningPathsService: AdminLearningPathsService,
  ) {}

  @Get()
  async listLearningPaths(@Query() query: AdminListQueryDto) {
    const result =
      await this.adminLearningPathsService.listLearningPaths(query);
    return { success: true, data: result };
  }

  @Post()
  async createLearningPath(@Body() dto: CreateLearningPathDto) {
    const result =
      await this.adminLearningPathsService.createLearningPath(dto);
    return { success: true, data: result };
  }

  @Put(':id')
  async updateLearningPath(
    @Param('id') id: string,
    @Body() dto: UpdateLearningPathDto,
  ) {
    const result = await this.adminLearningPathsService.updateLearningPath(
      id,
      dto,
    );
    return { success: true, data: result };
  }

  @Delete(':id')
  async deleteLearningPath(@Param('id') id: string) {
    const result =
      await this.adminLearningPathsService.deleteLearningPath(id);
    return { success: true, data: result };
  }
}
