import { IsObject } from 'class-validator';

export class SubmitRoundThreeDto {
  @IsObject()
  skillRatings!: Record<string, number>;
}
