import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/index.js';
import { AiService } from '../ai/index.js';
import { GenerateContentDto } from './dto/index.js';

// Shape trả về từ AI cho mỗi quiz question
interface AiQuizQuestion {
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  options: Array<{ id: string; text: string }>;
  correctAnswer: string[];
  explanation: string;
}

// Kết quả cho mỗi lesson đã tạo
interface GeneratedLesson {
  slug: string;
  title: string;
  hasQuiz: boolean;
}

// Kết quả trả về cho client
interface GenerateContentResult {
  created: number;
  lessons: GeneratedLesson[];
  errors: string[];
}

@Injectable()
export class AdminContentService {
  private readonly logger = new Logger(AdminContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async generateContent(dto: GenerateContentDto): Promise<GenerateContentResult> {
    const {
      learningPathSlug,
      lessons,
      generateQuiz = false,
      quizQuestionsCount = 5,
    } = dto;

    // 1. Validate learningPath exists
    const learningPath = await this.prisma.learningPath.findUnique({
      where: { slug: learningPathSlug },
      include: { tracks: true },
    });

    if (!learningPath) {
      throw new NotFoundException(
        `Learning path with slug "${learningPathSlug}" not found`,
      );
    }

    // Validate all trackIds belong to this learningPath
    const pathTrackIds = new Set(learningPath.tracks.map((t) => t.id));
    for (const lesson of lessons) {
      if (!pathTrackIds.has(lesson.trackId)) {
        throw new BadRequestException(
          `Track "${lesson.trackId}" does not belong to learning path "${learningPathSlug}"`,
        );
      }
    }

    const result: GenerateContentResult = {
      created: 0,
      lessons: [],
      errors: [],
    };

    // 2. Loop through each lesson
    for (const lessonInput of lessons) {
      try {
        // a. Generate summary via AI
        const summarySystemPrompt =
          'You are a learning content creator for Vietnamese IT learners. Write clear, structured Markdown content in Vietnamese.';

        const summaryPrompt = `Generate a learning summary in Vietnamese for lesson titled '${lessonInput.title}' in the context of ${learningPath.name}. Include sections: ## Ban se hoc duoc gi?, ## Noi dung chinh, ## Best Practices. Write 10-15 lines of Markdown.`;

        const aiSummary = await this.aiService.chat(
          summarySystemPrompt,
          summaryPrompt,
          { maxTokens: 1024 },
        );

        // b. Create lesson in DB
        const createdLesson = await this.prisma.lesson.create({
          data: {
            title: lessonInput.title,
            slug: lessonInput.slug,
            summary: aiSummary,
            estimatedMins: 60,
            isPublished: false,
          },
        });

        // c. Create TrackLesson junction
        await this.prisma.trackLesson.create({
          data: {
            trackId: lessonInput.trackId,
            lessonId: createdLesson.id,
            order: lessonInput.order,
          },
        });

        let hasQuiz = false;

        // d. Generate quiz if requested
        if (generateQuiz) {
          try {
            const quizSystemPrompt =
              'You are a quiz generator for IT learning. Return ONLY valid JSON array, no markdown code blocks, no explanation text.';

            const quizPrompt = `Generate ${quizQuestionsCount} quiz questions for lesson '${lessonInput.title}'. Return JSON array: [{"questionText":"...","questionType":"SINGLE_CHOICE","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],"correctAnswer":["a"],"explanation":"..."}]`;

            const quizResponse = await this.aiService.chat(
              quizSystemPrompt,
              quizPrompt,
              { maxTokens: 2048 },
            );

            // Parse JSON — AI might wrap in ```json ... ``` so strip that
            const cleanedJson = quizResponse
              .replace(/```json\s*/g, '')
              .replace(/```\s*/g, '')
              .trim();

            const questions: AiQuizQuestion[] = JSON.parse(cleanedJson);

            if (!Array.isArray(questions) || questions.length === 0) {
              throw new Error('AI returned empty or non-array quiz data');
            }

            // Create Quiz + QuizQuestions
            const quiz = await this.prisma.quiz.create({
              data: {
                lessonId: createdLesson.id,
                title: `Quiz: ${lessonInput.title}`,
                passThreshold: 70,
                retryLimit: 3,
                retryCooldown: 60,
              },
            });

            await this.prisma.quizQuestion.createMany({
              data: questions.map((q, index) => ({
                quizId: quiz.id,
                questionText: q.questionText,
                questionType: q.questionType === 'MULTIPLE_CHOICE'
                  ? 'MULTIPLE_CHOICE'
                  : 'SINGLE_CHOICE',
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation ?? '',
                order: index + 1,
              })),
            });

            hasQuiz = true;
          } catch (quizError) {
            // Skip quiz, add error, lesson is still created
            const errorMsg =
              quizError instanceof Error ? quizError.message : String(quizError);
            result.errors.push(
              `Quiz generation failed for "${lessonInput.slug}": ${errorMsg}`,
            );
            this.logger.warn(
              `Quiz generation failed for "${lessonInput.slug}": ${errorMsg}`,
            );
          }
        }

        result.created++;
        result.lessons.push({
          slug: lessonInput.slug,
          title: lessonInput.title,
          hasQuiz,
        });
      } catch (lessonError) {
        const errorMsg =
          lessonError instanceof Error
            ? lessonError.message
            : String(lessonError);
        result.errors.push(
          `Lesson "${lessonInput.slug}" failed: ${errorMsg}`,
        );
        this.logger.error(
          `Lesson "${lessonInput.slug}" creation failed: ${errorMsg}`,
        );
      }
    }

    return result;
  }
}
