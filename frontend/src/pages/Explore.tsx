import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearningPaths } from '../hooks/useLearningPaths';
import { useEnroll } from '../hooks/useEnroll';
import { vi } from '../strings/vi';
import { Skeleton } from '../components/feedback/Skeleton';
import { PageError } from '../components/feedback/PageError';

const difficultyConfig = {
  beginner: {
    get label() {
      return vi.explore.difficultyBeginner;
    },
    className: 'badge badge-success',
  },
  intermediate: {
    get label() {
      return vi.explore.difficultyIntermediate;
    },
    className: 'badge badge-warning',
  },
  advanced: {
    get label() {
      return vi.explore.difficultyAdvanced;
    },
    className: 'badge badge-error',
  },
} as const;

const CODE_SYMBOLS = ['{', '}', '<', '>', '/', '*', '=', '+', ';', ':', '@', 'M', 'W', 'K'];
const SYMBOL_COLORS = [
  'text-purple-400/25',
  'text-cyan-400/25',
  'text-pink-400/25',
  'text-yellow-400/25',
  'text-blue-400/25',
];

function FloatingSymbols() {
  const symbols = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        char: CODE_SYMBOLS[Math.floor(Math.random() * CODE_SYMBOLS.length)],
        color: SYMBOL_COLORS[Math.floor(Math.random() * SYMBOL_COLORS.length)],
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${0.6 + Math.random() * 0.8}rem`,
        delay: `${Math.random() * 8}s`,
        duration: `${6 + Math.random() * 10}s`,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {symbols.map((s) => (
        <span
          key={s.id}
          className={`absolute font-mono font-bold ${s.color} animate-pulse select-none`}
          style={{
            left: s.left,
            top: s.top,
            fontSize: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        >
          {s.char}
        </span>
      ))}
    </div>
  );
}

export default function Explore() {
  const navigate = useNavigate();
  const { data: paths = [], isLoading, error, refetch } = useLearningPaths();
  const enrollMutation = useEnroll();
  const [enrolled, setEnrolled] = useState<Record<string, boolean>>({});

  function handleEnroll(slug: string) {
    enrollMutation.mutate(slug, {
      onSuccess: () => {
        setEnrolled((prev) => ({ ...prev, [slug]: true }));
        navigate('/dashboard');
      },
      onError: (err) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 409) {
          setEnrolled((prev) => ({ ...prev, [slug]: true }));
        }
      },
    });
  }

  if (isLoading) {
    return (
      <div className="py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bento-card space-y-3">
              <div className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-lg-dp" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <PageError message={vi.explore.loadError} onRetry={() => refetch()} />;
  }

  return (
    <div className="relative py-6">
      <FloatingSymbols />
      <div className="glow-blob glow-blob-purple w-80 h-80 top-32 right-1/4" />
      <div className="glow-blob glow-blob-accent w-72 h-72 bottom-20 left-1/3" />

      <div className="space-y-6 relative z-10">
        <h1 className="text-2xl font-bold text-dp-text-primary">{vi.explore.title}</h1>

        {paths.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-dp-text-muted">{vi.explore.emptyState}</p>
          </div>
        )}

        {paths.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
            {paths.map((path) => {
              const diff = difficultyConfig[path.difficulty];
              const isEnrolling =
                enrollMutation.isPending && enrollMutation.variables === path.slug;
              const isEnrolled = enrolled[path.slug] ?? false;

              return (
                <div key={path.id} className="glass rounded-2xl p-5 flex flex-col gap-3 glass-hover">
                  <div className="flex items-start gap-3">
                    {path.icon && (
                      <span className="text-2xl leading-none mt-0.5">{path.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dp-text-primary leading-snug">{path.name}</p>
                      {path.description && (
                        <p className="text-xs text-dp-text-muted mt-1 line-clamp-2">
                          {path.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={diff.className}>{diff.label}</span>
                    <span className="text-dp-text-muted font-mono">~{path.estimatedHours}h</span>
                    <span className="text-dp-text-muted font-mono">
                      {path._count.tracks} {vi.explore.tracks}
                    </span>
                  </div>

                  <button
                    onClick={() => !isEnrolled && handleEnroll(path.slug)}
                    disabled={isEnrolling || isEnrolled}
                    className={`w-full text-sm font-semibold py-2.5 rounded-xl transition-all mt-auto
                      ${
                        isEnrolled
                          ? 'bg-dp-success/15 text-dp-success border border-dp-success/20 cursor-default'
                          : 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30'
                      }`}
                  >
                    {isEnrolling
                      ? vi.explore.enrolling
                      : isEnrolled
                        ? `✅ ${vi.explore.enrolled}`
                        : vi.explore.enrollButton}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
