import { type ReactNode, useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, Check } from 'lucide-react';

import DepthRuler from '../components/onboarding/DepthRuler';
import RecommendationPanel from '../components/onboarding/RecommendationPanel';
import RoundOne from '../components/onboarding/RoundOne';
import RoundThree from '../components/onboarding/RoundThree';
import RoundTwo from '../components/onboarding/RoundTwo';
import WelcomeBackCard from '../components/onboarding/WelcomeBackCard';
import { useConfirmOnboardingPath } from '../hooks/useConfirmOnboardingPath';
import { useOnboardingQuestions, type OnboardingQuestion } from '../hooks/useOnboardingQuestions';
import { useOnboardingRecommendation } from '../hooks/useOnboardingRecommendation';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import {
  useSubmitOnboardingRound,
  type RoundOneData,
  type RoundTwoData,
  type RoundThreeData,
} from '../hooks/useSubmitOnboardingRound';
import { vi } from '../strings/vi';
import './Onboarding.css';

function getApiErrorMessage(error: unknown, fallback: string) {
  return (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message ?? fallback;
}

const ROUND_COPY: Record<number, { eyebrow: string; h1Top: string; h1Grad: string; mobileTop: string; mobileGrad: string }> = {
  1: {
    eyebrow: 'Bắt đầu hành trình',
    h1Top: 'Hé lộ',
    h1Grad: 'vị trí khởi đầu',
    mobileTop: 'Hé lộ',
    mobileGrad: 'vị trí khởi đầu',
  },
  2: {
    eyebrow: 'Lặn sâu hơn',
    h1Top: 'Đặt la bàn cho',
    h1Grad: 'đích đến',
    mobileTop: 'Đặt la bàn cho',
    mobileGrad: 'đích đến',
  },
  3: {
    eyebrow: 'Tự đo độ sâu',
    h1Top: 'Hiệu chuẩn lại',
    h1Grad: 'năng lực hiện tại',
    mobileTop: 'Hiệu chuẩn lại',
    mobileGrad: 'năng lực',
  },
};

function SubmarineSvg() {
  return (
    <svg className="sub-svg" viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="onb-sub-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5BFCFF" />
          <stop offset="55%" stopColor="#4FACFE" />
          <stop offset="100%" stopColor="#1E4D6B" />
        </linearGradient>
        <linearGradient id="onb-sub-light" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFE9A8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFE9A8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="onb-sub-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(0, 242, 254, 0.45)" />
          <stop offset="100%" stopColor="rgba(0, 242, 254, 0)" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="120" rx="160" ry="60" fill="url(#onb-sub-glow)" />
      <path d="M65 110 L130 110 L150 95 L260 95 L280 110 L335 110 Q345 120 335 130 L280 130 L260 145 L150 145 L130 130 L65 130 Q55 120 65 110 Z" fill="url(#onb-sub-body)" stroke="#7DDDF0" strokeWidth="1.5" />
      <rect x="180" y="60" width="38" height="36" rx="6" fill="url(#onb-sub-body)" stroke="#7DDDF0" strokeWidth="1.5" />
      <rect x="186" y="64" width="26" height="20" rx="3" fill="#0F2027" opacity="0.55" />
      <line x1="199" y1="58" x2="199" y2="40" stroke="#7DDDF0" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="199" cy="38" r="3" fill="#FFE9A8" />
      <circle cx="160" cy="115" r="9" fill="#0F2027" opacity="0.6" stroke="#7DDDF0" strokeWidth="1.2" />
      <circle cx="160" cy="115" r="4" fill="#FFE9A8" />
      <circle cx="200" cy="115" r="9" fill="#0F2027" opacity="0.6" stroke="#7DDDF0" strokeWidth="1.2" />
      <circle cx="200" cy="115" r="4" fill="#FFE9A8" />
      <circle cx="240" cy="115" r="9" fill="#0F2027" opacity="0.6" stroke="#7DDDF0" strokeWidth="1.2" />
      <circle cx="240" cy="115" r="4" fill="#FFE9A8" />
      <path d="M65 110 L60 105 L48 110 L48 130 L60 135 L65 130 Z" fill="#1E4D6B" stroke="#7DDDF0" strokeWidth="1.2" />
      <path d="M280 95 L300 80 L308 88 L290 105 Z" fill="#1E4D6B" stroke="#7DDDF0" strokeWidth="1.2" />
      <path d="M335 115 Q360 100 380 105 Q368 118 348 125 Z" fill="url(#onb-sub-light)" opacity="0.85" />
    </svg>
  );
}

function BubbleStream() {
  return (
    <svg className="bubble-stream" viewBox="0 0 180 280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="40"  cy="260" r="5"  style={{ animationDelay: '0s' }} />
      <circle cx="80"  cy="260" r="8"  style={{ animationDelay: '0.9s' }} />
      <circle cx="120" cy="260" r="4"  style={{ animationDelay: '1.6s' }} />
      <circle cx="55"  cy="260" r="6"  style={{ animationDelay: '2.4s' }} />
      <circle cx="100" cy="260" r="5"  style={{ animationDelay: '3.1s' }} />
      <circle cx="140" cy="260" r="7"  style={{ animationDelay: '3.9s' }} />
      <circle cx="30"  cy="260" r="4"  style={{ animationDelay: '4.7s' }} />
      <circle cx="90"  cy="260" r="6"  style={{ animationDelay: '5.4s' }} />
    </svg>
  );
}

function SplitIllusColumn({
  currentRound,
  completedRounds,
}: {
  currentRound: number | null;
  completedRounds: number[];
}) {
  const round = currentRound ?? 3;
  const copy = ROUND_COPY[round];
  return (
    <div className="split-illus">
      <div className="split-illus-content">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h1>
          {copy.h1Top}<br />
          <span className="grad">{copy.h1Grad}</span>
        </h1>
        <p>Mỗi vòng câu hỏi giúp DevPath hiểu bạn rõ hơn để cá nhân hóa lộ trình học sắp tới.</p>
      </div>
      <SubmarineSvg />
      <BubbleStream />
      <DepthRuler currentRound={currentRound} completedRounds={completedRounds} />
    </div>
  );
}

function SplitMobileBanner({ currentRound }: { currentRound: number | null }) {
  const round = currentRound ?? 3;
  const copy = ROUND_COPY[round];
  return (
    <div className="split-mobile-banner">
      <SubmarineSvg />
      <BubbleStream />
      <div className="banner-text">
        {copy.mobileTop} <span className="grad">{copy.mobileGrad}</span>
      </div>
    </div>
  );
}

function CompactStepper({
  currentRound,
  completedRounds,
}: {
  currentRound: number | null;
  completedRounds: number[];
}) {
  const stops = [1, 2, 3] as const;
  const completedCount = completedRounds.length;
  const fillPct =
    completedCount >= 3
      ? 100
      : completedCount === 0
        ? currentRound === 1
          ? 8
          : 0
        : (completedCount / 3) * 100;

  return (
    <div className="onb-stepper">
      <div className="onb-stepper-bar" role="progressbar" aria-valuenow={Math.round(fillPct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="fill" style={{ width: `${fillPct}%` }} />
      </div>
      <div className="onb-stepper-dots">
        {stops.map((n, i) => {
          const isDone = completedRounds.includes(n);
          const isCurrent = currentRound === n && !isDone;
          const stateClass = isDone ? 'done' : isCurrent ? 'current' : 'upcoming';
          const labelCls = isCurrent ? 'current' : isDone ? 'done' : '';
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
              <div className="onb-stepper-dot-wrap">
                <div className={`onb-stepper-dot ${stateClass}`} aria-current={isCurrent ? 'step' : undefined}>
                  {isDone ? <Check size={14} strokeWidth={2.4} /> : n}
                </div>
                <div className={`onb-stepper-label ${labelCls}`}>{vi.onboarding.stepperLabels[i]}</div>
              </div>
              {i < stops.length - 1 ? (
                <div
                  className={`onb-stepper-connector${completedCount > i ? ' done' : ''}`}
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

function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div className="dp-onboarding">
      <div className="onb-frame">
        <div className="onb-glow tr" />
        <div className="onb-glow bl" />
        <div className="onb-glow ml" />
        {children}
      </div>
    </div>
  );
}

function FullPageSpinner({ message }: { message: string }) {
  return (
    <OnboardingShell>
      <div className="onb-fullpage">
        <div className="onb-loading" style={{ background: 'transparent', border: 0, padding: 0, minHeight: 0 }}>
          <div className="big-spinner" />
          <div className="label">{message}</div>
        </div>
      </div>
    </OnboardingShell>
  );
}

function InlineLoadingCard({ message }: { message: string }) {
  return (
    <div className="onb-loading">
      <div className="big-spinner" />
      <div className="label">{message}</div>
    </div>
  );
}

function RecommendationLoadingCard({ message }: { message: string }) {
  return (
    <div className="onb-loading">
      <div className="calm-spinner" />
      <div className="label calm">{message}</div>
    </div>
  );
}

function EmptyStateCard() {
  return (
    <div className="onb-empty">
      <div className="empty-ico"><BookOpen size={22} strokeWidth={2} /></div>
      <h2>{vi.onboarding.emptyStateHeading}</h2>
      <p>{vi.onboarding.emptyStateBody}</p>
    </div>
  );
}

function StatusErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="onb-empty" style={{ borderColor: 'rgba(248,113,113,0.25)' }}>
      <div className="empty-ico" style={{ background: 'rgba(248,113,113,0.10)', borderColor: 'rgba(248,113,113,0.30)', color: 'var(--onb-error)' }}>
        <AlertCircle size={22} strokeWidth={2} />
      </div>
      <h2>Đã xảy ra lỗi</h2>
      <p>{message}</p>
      <button type="button" onClick={onRetry} className="onb-btn onb-btn-auto" style={{ marginTop: 8, width: 'auto' }}>
        <span>Thử lại</span>
      </button>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [resumeDismissed, setResumeDismissed] = useState(false);

  const {
    data: status,
    isLoading: statusLoading,
    isError: statusError,
    error: statusQueryError,
    refetch: refetchStatus,
  } = useOnboardingStatus();

  const submitMutation = useSubmitOnboardingRound();
  const confirmMutation = useConfirmOnboardingPath();

  const completedRounds = status?.completedRounds ?? [];
  const currentRound = status?.nextRound ?? null;
  const canRequestRecommendation = status?.canRequestRecommendation ?? false;
  const hasConfirmedPath = status?.hasConfirmedPath ?? false;
  const resumeAvailable = status?.resumeAvailable ?? false;

  const questionsQuery = useOnboardingQuestions(currentRound);
  const recommendationQuery = useOnboardingRecommendation(
    currentRound === null && canRequestRecommendation && !hasConfirmedPath,
  );

  const roundError = submitMutation.error
    ? getApiErrorMessage(submitMutation.error, vi.onboarding.saveError)
    : null;

  const confirmError = confirmMutation.error
    ? getApiErrorMessage(confirmMutation.error, vi.onboarding.confirmError)
    : null;

  const questionLoadError = questionsQuery.error
    ? getApiErrorMessage(questionsQuery.error, vi.onboarding.loadError)
    : null;

  const recommendationLoadError = recommendationQuery.error
    ? getApiErrorMessage(recommendationQuery.error, vi.onboarding.noRecommendation)
    : null;

  const showResumeCard = resumeAvailable && currentRound !== null && !resumeDismissed;

  useEffect(() => {
    setResumeDismissed(false);
  }, [resumeAvailable, currentRound]);

  useEffect(() => {
    if (hasConfirmedPath) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasConfirmedPath, navigate]);

  const motionTransition = useMemo(
    () => ({
      duration: prefersReducedMotion ? 0.01 : 0.3,
      ease: [0.16, 1, 0.3, 1] as const,
    }),
    [prefersReducedMotion],
  );

  function handleSubmitRoundOne(data: RoundOneData) {
    submitMutation.mutate({ round: 1, data });
  }

  function handleSubmitRoundTwo(data: RoundTwoData) {
    submitMutation.mutate({ round: 2, data });
  }

  function handleSubmitRoundThree(data: RoundThreeData) {
    submitMutation.mutate({ round: 3, data });
  }

  function renderActiveRound(questions: OnboardingQuestion[]) {
    switch (currentRound) {
      case 1:
        return (
          <RoundOne
            questions={questions}
            onSubmit={handleSubmitRoundOne}
            isSubmitting={submitMutation.isPending}
            error={roundError}
          />
        );
      case 2:
        return (
          <RoundTwo
            questions={questions}
            onSubmit={handleSubmitRoundTwo}
            isSubmitting={submitMutation.isPending}
            error={roundError}
          />
        );
      case 3:
        return (
          <RoundThree
            questions={questions}
            onSubmit={handleSubmitRoundThree}
            isSubmitting={submitMutation.isPending}
            error={roundError}
          />
        );
      default:
        return null;
    }
  }

  const content = useMemo(() => {
    if (currentRound !== null) {
      if (questionsQuery.isLoading) {
        return {
          key: `round-${currentRound}-loading`,
          node: <InlineLoadingCard message={vi.onboarding.loading} />,
        };
      }

      if (questionLoadError) {
        return {
          key: `round-${currentRound}-error`,
          node: (
            <div className="onb-alert" role="alert">
              <span className="ic"><AlertCircle size={16} strokeWidth={2} /></span>
              <span>{questionLoadError}</span>
            </div>
          ),
        };
      }

      const questions = questionsQuery.data ?? [];

      if (questions.length === 0) {
        return { key: `round-${currentRound}-empty`, node: <EmptyStateCard /> };
      }

      return { key: `round-${currentRound}`, node: renderActiveRound(questions) };
    }

    if (canRequestRecommendation) {
      if (recommendationQuery.isLoading) {
        return {
          key: 'recommendation-loading',
          node: <RecommendationLoadingCard message={vi.onboarding.recommendationLoading} />,
        };
      }

      if (recommendationLoadError || !recommendationQuery.data) {
        return {
          key: 'recommendation-error',
          node: (
            <div className="onb-alert" role="alert">
              <span className="ic"><AlertCircle size={16} strokeWidth={2} /></span>
              <span>{recommendationLoadError ?? vi.onboarding.noRecommendation}</span>
            </div>
          ),
        };
      }

      return {
        key: 'recommendation',
        node: (
          <RecommendationPanel
            recommendation={recommendationQuery.data}
            onConfirm={(learningPathId) => confirmMutation.mutate(learningPathId)}
            isConfirming={confirmMutation.isPending}
            error={confirmError}
          />
        ),
      };
    }

    return { key: 'idle', node: <InlineLoadingCard message={vi.onboarding.loading} /> };
  }, [
    canRequestRecommendation,
    confirmError,
    confirmMutation,
    currentRound,
    questionLoadError,
    questionsQuery.data,
    questionsQuery.isLoading,
    recommendationLoadError,
    recommendationQuery.data,
    recommendationQuery.isLoading,
    roundError,
  ]);

  if (statusLoading) {
    return <FullPageSpinner message={vi.onboarding.loading} />;
  }

  if (statusError) {
    return (
      <OnboardingShell>
        <div className="split-grid">
          <SplitIllusColumn currentRound={null} completedRounds={[]} />
          <div className="split-form">
            <div className="split-form-inner">
              <StatusErrorCard
                message={getApiErrorMessage(statusQueryError, vi.onboarding.loadError)}
                onRetry={() => {
                  void refetchStatus();
                }}
              />
            </div>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell>
      <SplitMobileBanner currentRound={currentRound} />
      <div className="split-grid">
        <SplitIllusColumn currentRound={currentRound} completedRounds={completedRounds} />

        <div className="split-form">
          <div className="split-form-inner">
            <CompactStepper currentRound={currentRound} completedRounds={completedRounds} />

            {showResumeCard ? (
              <WelcomeBackCard
                completedRounds={completedRounds}
                onContinue={() => setResumeDismissed(true)}
              />
            ) : null}

            <AnimatePresence mode="wait">
              <motion.div
                key={content.key}
                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -16 }}
                transition={motionTransition}
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                {content.node}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
