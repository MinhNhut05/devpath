import { type ReactNode, useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import RecommendationPanel from '../components/onboarding/RecommendationPanel';
import RoundOne from '../components/onboarding/RoundOne';
import RoundThree from '../components/onboarding/RoundThree';
import RoundTwo from '../components/onboarding/RoundTwo';
import Stepper from '../components/onboarding/Stepper';
import WelcomeBackCard from '../components/onboarding/WelcomeBackCard';
import { PageError } from '../components/feedback/PageError';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardContent } from '../components/ui/card';
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

const PAGE_BACKGROUND = 'linear-gradient(135deg, #0d0a1a 0%, #1a0e2e 30%, #12101f 60%, #0a0a18 100%)';

function getApiErrorMessage(error: unknown, fallback: string) {
  return (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message ?? fallback;
}

function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen px-4 py-8 relative overflow-hidden"
      style={{ background: PAGE_BACKGROUND }}
    >
      <div
        className="absolute top-[-10%] right-[-5%] h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
        style={{ background: 'radial-gradient(circle, #8E37D7, transparent)' }}
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] h-[400px] w-[400px] rounded-full opacity-10 blur-[100px]"
        style={{ background: 'radial-gradient(circle, #4facfe, transparent)' }}
      />
      <div
        className="absolute left-[35%] top-[12%] h-[260px] w-[260px] rounded-full opacity-10 blur-[90px]"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.8), transparent)' }}
      />

      <div className="relative z-10 mx-auto max-w-[720px] pb-12 pt-8">{children}</div>
    </div>
  );
}

function FullPageSpinner({ message }: { message: string }) {
  return (
    <OnboardingShell>
      <div className="flex min-h-[70vh] items-center justify-center text-center">
        <div>
          <div className="mx-auto mb-4 inline-block h-8 w-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
          <p className="text-white/50">{message}</p>
        </div>
      </div>
    </OnboardingShell>
  );
}

function InlineLoadingCard({ message }: { message: string }) {
  return (
    <Card className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
      <CardContent className="flex min-h-[280px] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 inline-block h-8 w-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
        <p className="text-sm text-white/50">{message}</p>
      </CardContent>
    </Card>
  );
}

function EmptyStateCard() {
  return (
    <Card className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
      <CardContent className="p-6 text-center">
        <h2 className="text-lg font-semibold text-white/90">Chưa có câu hỏi cho vòng này</h2>
        <p className="mt-2 text-sm text-white/50">
          Hiện chưa tải được bộ câu hỏi phù hợp. Hãy thử lại hoặc quay lại sau ít phút.
        </p>
      </CardContent>
    </Card>
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
    ? getApiErrorMessage(submitMutation.error, vi.onboarding.genericError)
    : null;

  const confirmError = confirmMutation.error
    ? getApiErrorMessage(confirmMutation.error, vi.onboarding.genericError)
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
            <Alert className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              <AlertDescription className="text-red-300">{questionLoadError}</AlertDescription>
            </Alert>
          ),
        };
      }

      const questions = questionsQuery.data ?? [];

      if (questions.length === 0) {
        return {
          key: `round-${currentRound}-empty`,
          node: <EmptyStateCard />,
        };
      }

      return {
        key: `round-${currentRound}`,
        node: renderActiveRound(questions),
      };
    }

    if (canRequestRecommendation) {
      if (recommendationQuery.isLoading) {
        return {
          key: 'recommendation-loading',
          node: <InlineLoadingCard message={vi.onboarding.loading} />,
        };
      }

      if (recommendationLoadError || !recommendationQuery.data) {
        return {
          key: 'recommendation-error',
          node: (
            <Alert className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              <AlertDescription className="text-red-300">
                {recommendationLoadError ?? vi.onboarding.noRecommendation}
              </AlertDescription>
            </Alert>
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

    return {
      key: 'idle',
      node: <InlineLoadingCard message={vi.onboarding.loading} />,
    };
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
        <PageError
          message={getApiErrorMessage(statusQueryError, vi.onboarding.loadError)}
          onRetry={() => {
            void refetchStatus();
          }}
        />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell>
      <Stepper currentRound={currentRound ?? 3} completedRounds={completedRounds} />

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
        >
          {content.node}
        </motion.div>
      </AnimatePresence>
    </OnboardingShell>
  );
}
