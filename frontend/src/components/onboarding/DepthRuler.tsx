import { Check } from 'lucide-react';

import { vi } from '../../strings/vi';

interface DepthRulerProps {
  currentRound: number | null;
  completedRounds: number[];
}

const STOPS = [1, 2, 3] as const;

export default function DepthRuler({ currentRound, completedRounds }: DepthRulerProps) {
  const completedCount = completedRounds.length;
  const fillPct =
    completedCount >= 3
      ? 100
      : completedCount === 0
        ? currentRound === 1
          ? 6
          : 0
        : (completedCount / 3) * 100;

  return (
    <div className="depth-ruler" aria-hidden="true">
      <div className="depth-track" />
      <div className="depth-fill" style={{ height: `${fillPct}%` }} />
      {STOPS.map((n) => {
        const isDone = completedRounds.includes(n);
        const isCurrent = currentRound === n && !isDone;
        const stateClass = isDone ? 'done' : isCurrent ? 'current' : 'upcoming';
        return (
          <div key={n} className={`depth-stop ${stateClass}`}>
            {isDone ? <Check size={14} strokeWidth={2.4} /> : n}
            <div className={`depth-label${isCurrent ? ' current' : isDone ? ' done' : ''}`}>
              {vi.onboarding.stepperLabels[n - 1]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
