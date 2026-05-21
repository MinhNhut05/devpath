import { ArrowRight, Sparkles } from 'lucide-react';

import { vi } from '../../strings/vi';

interface WelcomeBackCardProps {
  completedRounds: number[];
  onContinue: () => void;
}

export default function WelcomeBackCard({ completedRounds, onContinue }: WelcomeBackCardProps) {
  const completedCount = completedRounds.length;

  return (
    <div className="welcome-back">
      <h2>
        <Sparkles size={18} strokeWidth={2} color="var(--onb-primary)" />
        {vi.onboarding.resumeHeading}
      </h2>
      <p>{vi.onboarding.resumeBody}</p>
      <div className="welcome-back-row">
        <span className="meta">Đã hoàn thành: {completedCount}/3 vòng</span>
        <button type="button" onClick={onContinue} className="onb-btn">
          <span>{vi.onboarding.resumeCta}</span>
          <ArrowRight size={14} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
