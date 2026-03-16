import {
  ArrayMinSize,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateContentLessonDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug must be lowercase letters and numbers separated by hyphens (e.g. my-lesson)',
  })
  slug!: string;

  @IsUUID()
  trackId!: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  order!: number;
}

export class GenerateContentDto {
  @IsString()
  @IsNotEmpty()
  learningPathSlug!: string;

  @ValidateNested({ each: true })
  @Type(() => GenerateContentLessonDto)
  @ArrayMinSize(1)
  lessons!: GenerateContentLessonDto[];

  @IsOptional()
  @IsBoolean()
  generateQuiz?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quizQuestionsCount?: number = 5;
}
