import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/index.js';
import { CreateLessonDto, UpdateLessonDto } from './dto/index.js';

@Injectable()
export class AdminLessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLesson(dto: CreateLessonDto) {
    // Check slug uniqueness
    const existingSlug = await this.prisma.lesson.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException('Slug already exists');
    }

    // Check trackId exists
    const track = await this.prisma.track.findUnique({
      where: { id: dto.trackId },
    });

    if (!track) {
      throw new NotFoundException(
        `Track with id "${dto.trackId}" not found`,
      );
    }

    const { trackId, order, ...lessonData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.create({ data: lessonData });

      await tx.trackLesson.create({
        data: { trackId, lessonId: lesson.id, order },
      });

      return lesson;
    });
  }

  async updateLesson(id: string, dto: UpdateLessonDto) {
    const existing = await this.prisma.lesson.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Lesson with id "${id}" not found`);
    }

    // If slug is changing, check uniqueness
    if (dto.slug && dto.slug !== existing.slug) {
      const slugConflict = await this.prisma.lesson.findUnique({
        where: { slug: dto.slug },
      });

      if (slugConflict) {
        throw new ConflictException('Slug already exists');
      }
    }

    // Separate trackId and order (they belong to TrackLesson, not Lesson)
    const { trackId, order, ...lessonData } = dto;

    const lesson = await this.prisma.lesson.update({
      where: { id },
      data: lessonData,
    });

    // Update TrackLesson if trackId or order provided
    if (trackId !== undefined || order !== undefined) {
      const trackLessonUpdate: Record<string, unknown> = {};
      if (trackId !== undefined) trackLessonUpdate.trackId = trackId;
      if (order !== undefined) trackLessonUpdate.order = order;

      // Find the existing TrackLesson for this lesson
      const existingTrackLesson = await this.prisma.trackLesson.findFirst({
        where: { lessonId: id },
      });

      if (existingTrackLesson) {
        await this.prisma.trackLesson.update({
          where: { id: existingTrackLesson.id },
          data: trackLessonUpdate,
        });
      }
    }

    return lesson;
  }

  async deleteLesson(id: string) {
    const existing = await this.prisma.lesson.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Lesson with id "${id}" not found`);
    }

    // Check if any user has progress on this lesson
    const progressCount = await this.prisma.userProgress.count({
      where: { lessonId: id },
    });

    if (progressCount > 0) {
      throw new ConflictException(
        `Cannot delete lesson with user progress (${progressCount} progress records found)`,
      );
    }

    // Soft delete: unpublish instead of hard delete
    return this.prisma.lesson.update({
      where: { id },
      data: { isPublished: false },
    });
  }
}
