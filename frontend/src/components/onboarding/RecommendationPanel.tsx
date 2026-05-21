import { AlertCircle, ArrowRight } from 'lucide-react';

import type { OnboardingRecommendation } from '../../hooks/useOnboardingRecommendation';
import { vi } from '../../strings/vi';

interface RecommendationPanelProps {
  recommendation: OnboardingRecommendation;
  onConfirm: (learningPathId: string) => void;
  isConfirming: boolean;
  error: string | null;
}

const PATH_NAMES: Record<string, string> = {
  'frontend-reactjs': 'Lập trình viên Frontend ReactJS',
  'frontend-developer': 'Lập trình viên Frontend',
  'backend-developer': 'Lập trình viên Backend',
  'fullstack-developer': 'Lập trình viên Fullstack',
  'ai-python': 'AI / Khoa học dữ liệu (Python)',
};

export default function RecommendationPanel({
  recommendation,
  onConfirm,
  isConfirming,
  error,
}: RecommendationPanelProps) {
  const sourceLabel = recommendation.source === 'ai' ? vi.onboarding.aiSource : 'Dự phòng';
  const sourceClass = recommendation.source === 'ai' ? 'ai' : 'fb';
  const primaryPathName = PATH_NAMES[recommendation.primaryPath] ?? recommendation.primaryPath;

  return (
    <div className="rec-panel">
      <div className="rec-top">
        <span className="rec-eyebrow">Gợi ý lộ trình cho bạn</span>
        <span className={`source-badge ${sourceClass}`}>
          <span className="ic-dot" />
          {sourceLabel}
        </span>
      </div>

      <h2 className="rec-name">{primaryPathName}</h2>
      <p className="rec-reason">{recommendation.reason}</p>

      {recommendation.focusAreas.length > 0 ? (
        <div className="rec-section">
          <div className="rec-section-label">Chủ đề cần tập trung</div>
          <div className="rec-chips">
            {recommendation.focusAreas.map((focusArea) => (
              <span key={focusArea} className="rec-chip">{focusArea}</span>
            ))}
          </div>
        </div>
      ) : null}

      {recommendation.alternativePaths.length > 0 ? (
        <>
          <div className="rec-divider" />
          <div className="rec-section">
            <div className="rec-section-label">Lộ trình thay thế</div>
            <div className="rec-chips">
              {recommendation.alternativePaths.map((path) => (
                <span key={path} className="rec-chip-alt">{PATH_NAMES[path] ?? path}</span>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {error ? (
        <div className="onb-alert" role="alert">
          <span className="ic"><AlertCircle size={16} strokeWidth={2} /></span>
          <span>{error ?? vi.onboarding.confirmError}</span>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onConfirm(recommendation.learningPathId)}
        disabled={isConfirming}
        className="onb-btn"
      >
        {isConfirming ? (
          <>
            <span className="onb-spinner" />
            <span>{vi.onboarding.submitting}</span>
          </>
        ) : (
          <>
            <span>{vi.onboarding.confirmCta}</span>
            <ArrowRight size={16} strokeWidth={2.2} />
          </>
        )}
      </button>
    </div>
  );
}
