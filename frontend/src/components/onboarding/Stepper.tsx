import { Progress } from '../ui/progress';
import { vi } from '../../strings/vi';

interface StepperProps {
  currentRound: number;
  completedRounds: number[];
}

const STEPS = vi.onboarding.stepperLabels.map((label, index) => ({
  round: index + 1,
  label,
})) as Array<{ round: number; label: string }>;

function getProgressValue(currentRound: number, completedRounds: number[]) {
  if (completedRounds.length >= 3) {
    return 100;
  }

  if (completedRounds.length === 2 || currentRound === 3) {
    return 66;
  }

  if (completedRounds.length === 1 || currentRound === 2) {
    return 33;
  }

  return 0;
}

export default function Stepper({ currentRound, completedRounds }: StepperProps) {
  const progressValue = getProgressValue(currentRound, completedRounds);

  return (
    <div className="mb-8">
      <Progress value={progressValue} className="mx-auto mb-4 max-w-xs bg-white/10" />

      <div className="flex items-center justify-center gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = completedRounds.includes(step.round);
          const isCurrent = currentRound === step.round && !isCompleted;
          const isUpcoming = !isCompleted && !isCurrent;
          const connectorCompleted = completedRounds.includes(step.round);

          return (
            <div key={step.round} className="flex items-start">
              <div className="flex min-w-[4.5rem] flex-col items-center text-center">
                <div
                  className={[
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all duration-slow ease-smooth',
                    isCompleted && 'bg-dp-secondary text-white',
                    isCurrent && 'bg-dp-secondary text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]',
                    isUpcoming && 'border border-white/10 bg-dp-surface text-white/40',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? '✓' : step.round}
                </div>

                <span
                  className={[
                    'mt-1 text-xs',
                    isUpcoming ? 'text-white/30' : 'text-white/70',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 ? (
                <div
                  className={[
                    'mt-3 h-0.5 w-10 sm:w-16 transition-colors duration-slow ease-smooth',
                    connectorCompleted ? 'bg-violet-500' : 'bg-white/10',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
