import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/index.js';
import { CreateQuizDto, UpdateQuizDto } from './dto/index.js';

@Injectable()
export class AdminQuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuiz(dto: CreateQuizDto) {
    // Check lessonId exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(
        `Lesson with id "${dto.lessonId}" not found`,
      );
    }

    // Check lesson doesn't already have a quiz (lessonId is unique on Quiz)
    const existingQuiz = await this.prisma.quiz.findUnique({
      where: { lessonId: dto.lessonId },
    });

    if (existingQuiz) {
      throw new ConflictException(
        `Lesson "${dto.lessonId}" already has a quiz`,
      );
    }

    const { questions, ...quizData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({ data: quizData });

      await tx.quizQuestion.createMany({
        data: questions.map((q) => ({ ...q, quizId: quiz.id })),
      });

      // Return quiz with questions
      return tx.quiz.findUnique({
        where: { id: quiz.id },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async updateQuiz(id: string, dto: UpdateQuizDto) {
    const existing = await this.prisma.quiz.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Quiz with id "${id}" not found`);
    }

    const { questions, ...quizData } = dto;

    return this.prisma.$transaction(async (tx) => {
      await tx.quiz.update({
        where: { id },
        data: quizData,
      });

      // If questions provided, replace all existing questions
      if (questions) {
        await tx.quizQuestion.deleteMany({ where: { quizId: id } });
        await tx.quizQuestion.createMany({
          data: questions.map((q) => ({ ...q, quizId: id })),
        });
      }

      return tx.quiz.findUnique({
        where: { id },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async deleteQuiz(id: string) {
    const existing = await this.prisma.quiz.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Quiz with id "${id}" not found`);
    }

    // Hard delete — cascade deletes questions
    return this.prisma.quiz.delete({ where: { id } });
  }
}
