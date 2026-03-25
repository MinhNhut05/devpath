export class OnboardingStatusDto {
  completedRounds!: number[];
  nextRound!: number | null;
  resumeAvailable!: boolean;
  canRequestRecommendation!: boolean;
  careerGoal!: string | null;
  hasConfirmedPath!: boolean;
}
