import { IsIn, IsString } from 'class-validator';

export class SubmitRoundTwoDto {
  @IsString()
  @IsIn(['intern_junior', 'freelance', 'career_change', 'exploring'])
  targetRole!: string;

  @IsString()
  @IsIn(['startup', 'corporate', 'remote', 'no_preference'])
  workEnvironment!: string;

  @IsString()
  @IsIn(['3_months', '6_months', '1_year', 'no_rush'])
  timeline!: string;

  @IsString()
  @IsIn(['video', 'text', 'hands_on', 'mixed'])
  learningStyle!: string;
}
