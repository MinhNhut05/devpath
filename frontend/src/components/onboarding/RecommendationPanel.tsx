import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import type { OnboardingRecommendation } from '../../hooks/useOnboardingRecommendation';
import { vi } from '../../strings/vi';

interface RecommendationPanelProps {
  recommendation: OnboardingRecommendation;
  onConfirm: (learningPathId: string) => void;
  isConfirming: boolean;
  error: string | null;
}

const PATH_NAMES: Record<string, string> = {
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
  const sourceClassName = recommendation.source === 'ai'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300';
  const sourceLabel = recommendation.source === 'ai' ? 'AI' : 'Dự phòng';
  const primaryPathName = PATH_NAMES[recommendation.primaryPath] ?? recommendation.primaryPath;

  return (
    <Card className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-lg font-semibold text-transparent">
            Gợi ý lộ trình cho bạn
          </span>
          <Badge className={sourceClassName}>{sourceLabel}</Badge>
        </div>

        <h2 className="mt-4 text-2xl font-semibold text-white/90">{primaryPathName}</h2>
        <p className="mt-3 text-sm text-white/40">{recommendation.reason}</p>

        {recommendation.focusAreas.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-white/60">Chủ đề cần tập trung</p>
            <div className="flex flex-wrap gap-2">
              {recommendation.focusAreas.map((focusArea) => (
                <span
                  key={focusArea}
                  className="rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 py-1 text-xs text-purple-300"
                >
                  {focusArea}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {recommendation.alternativePaths.length > 0 ? (
          <>
            <Separator className="my-5 bg-white/[0.08]" />
            <div>
              <p className="mb-2 text-sm font-medium text-white/60">Lộ trình thay thế</p>
              <div className="flex flex-wrap gap-2">
                {recommendation.alternativePaths.map((path) => (
                  <span
                    key={path}
                    className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-white/50"
                  >
                    {PATH_NAMES[path] ?? path}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {error ? (
          <Alert className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertDescription className="text-red-300">
              {error ?? vi.onboarding.confirmError}
            </AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          onClick={() => onConfirm(recommendation.learningPathId)}
          disabled={isConfirming}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:opacity-90 disabled:opacity-40"
        >
          {isConfirming ? vi.onboarding.submitting : `${vi.onboarding.confirmCta} →`}
        </Button>
      </CardContent>
    </Card>
  );
}
