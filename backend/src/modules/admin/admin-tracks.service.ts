import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/index.js';
import { CreateTrackDto, UpdateTrackDto } from './dto/index.js';

@Injectable()
export class AdminTracksService {
  constructor(private readonly prisma: PrismaService) {}

  async createTrack(dto: CreateTrackDto) {
    const learningPath = await this.prisma.learningPath.findUnique({
      where: { id: dto.learningPathId },
    });

    if (!learningPath) {
      throw new NotFoundException(
        `Learning path with id "${dto.learningPathId}" not found`,
      );
    }

    return this.prisma.track.create({ data: dto });
  }

  async updateTrack(id: string, dto: UpdateTrackDto) {
    const existing = await this.prisma.track.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Track with id "${id}" not found`);
    }

    return this.prisma.track.update({
      where: { id },
      data: dto,
    });
  }

  async deleteTrack(id: string) {
    const existing = await this.prisma.track.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Track with id "${id}" not found`);
    }

    // Check if any lessons in this track have user progress
    const trackLessons = await this.prisma.trackLesson.findMany({
      where: { trackId: id },
    });

    const lessonIds = trackLessons.map((tl) => tl.lessonId);

    if (lessonIds.length > 0) {
      const progressCount = await this.prisma.userProgress.count({
        where: { lessonId: { in: lessonIds } },
      });

      if (progressCount > 0) {
        throw new ConflictException(
          `Cannot delete track with user progress (${progressCount} progress records found)`,
        );
      }
    }

    return this.prisma.track.delete({ where: { id } });
  }
}
