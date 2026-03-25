import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { vi } from '../../strings/vi';

interface WelcomeBackCardProps {
  completedRounds: number[];
  onContinue: () => void;
}

export default function WelcomeBackCard({ completedRounds, onContinue }: WelcomeBackCardProps) {
  const completedCount = completedRounds.length;

  return (
    <Card className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-white/90">{vi.onboarding.resumeHeading}</h2>
        <p className="mt-2 text-sm text-white/50">{vi.onboarding.resumeBody}</p>
        <p className="mt-3 text-xs text-white/30">Đã hoàn thành: {completedCount}/3 vòng</p>

        <Button
          type="button"
          onClick={onContinue}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-8 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:opacity-90 sm:w-auto"
        >
          {vi.onboarding.resumeCta}
        </Button>
      </CardContent>
    </Card>
  );
}
