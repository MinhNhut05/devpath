import {
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '@prisma/client';

export class CreateQuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText!: string;

  @IsEnum(QuestionType)
  questionType!: QuestionType;

  @IsNotEmpty()
  options!: any;

  @IsNotEmpty()
  correctAnswer!: any;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsInt()
  @Type(() => Number)
  order!: number;
}

export class CreateQuizDto {
  @IsUUID()
  lessonId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  passThreshold?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  retryLimit?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  retryCooldown?: number;

  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  @ArrayMinSize(1)
  questions!: CreateQuizQuestionDto[];
}
