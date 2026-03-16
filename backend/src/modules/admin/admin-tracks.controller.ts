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
import { AdminTracksService } from './admin-tracks.service.js';
import { CreateTrackDto, UpdateTrackDto } from './dto/index.js';

@Controller('admin/tracks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminTracksController {
  constructor(private readonly adminTracksService: AdminTracksService) {}

  @Post()
  async createTrack(@Body() dto: CreateTrackDto) {
    const result = await this.adminTracksService.createTrack(dto);
    return { success: true, data: result };
  }

  @Put(':id')
  async updateTrack(@Param('id') id: string, @Body() dto: UpdateTrackDto) {
    const result = await this.adminTracksService.updateTrack(id, dto);
    return { success: true, data: result };
  }

  @Delete(':id')
  async deleteTrack(@Param('id') id: string) {
    const result = await this.adminTracksService.deleteTrack(id);
    return { success: true, data: result };
  }
}
