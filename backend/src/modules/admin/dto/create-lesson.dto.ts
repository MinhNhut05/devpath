import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug must be lowercase letters and numbers separated by hyphens (e.g. my-lesson)',
  })
  slug!: string;

  @IsString()
  @IsNotEmpty()
  summary!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  externalLinks?: any[];

  @IsInt()
  @Min(1)
  @Type(() => Number)
  estimatedMins!: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsUUID()
  trackId!: string;

  @IsInt()
  @Type(() => Number)
  order!: number;
}
