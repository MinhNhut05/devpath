import { useNavigate, useParams } from 'react-router-dom';
import MarkdownContent from '../components/MarkdownContent';
import { useLesson, type ExternalLink } from '../hooks/useLesson';
import { useLessonComplete } from '../hooks/useLessonComplete';
import { vi } from '../strings/vi';
import { Skeleton } from '../components/feedback/Skeleton';

const linkTypeConfig: Record<ExternalLink['type'], { label: string; className: string }> = {
  documentation: { label: vi.lesson.resourceDocs, className: 'bg-white/20 text-white' },
  video: { label: vi.lesson.resourceVideo, className: 'bg-white/20 text-white' },
  tutorial: { label: vi.lesson.resourceTutorial, className: 'bg-white/20 text-white' },
  course: { label: vi.lesson.resourceCourse, className: 'bg-white/20 text-white' },
  interactive: { label: vi.lesson.resourceInteractive, className: 'bg-white/20 text-white' },
};

export default function Lesson() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { data: lesson, isLoading, error, refetch } = useLesson(slug);
  const completeMutation = useLessonComplete(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 py-10 px-4">
        <div className="max-w-xl mx-auto space-y-6 animate-pulse">
          <Skeleton className="h-4 w-24 bg-white/20" />
          <div className="bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl p-5 space-y-4">
            <Skeleton className="h-8 w-3/4 bg-white/20" />
            <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
            <Skeleton className="h-24 w-full bg-white/20" />
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-5 space-y-3">
            <Skeleton className="h-5 w-32 bg-white/20" />
            <Skeleton className="h-12 w-full bg-white/20" />
            <Skeleton className="h-12 w-full bg-white/20" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl bg-white/20" />
        </div>
      </div>
    );
  }

  const status = (error as { response?: { status?: number } } | null)?.response?.status;

  if (status === 403) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 py-10 px-4">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center space-y-4">
            <p className="text-white/80">{vi.lesson.notEnrolled}</p>
            <button
              onClick={() => navigate('/explore')}
              className="bg-white text-purple-700 font-semibold text-sm py-2.5 px-5 rounded-xl transition-colors hover:bg-white/90"
            >
              {vi.lesson.explorePathsCta}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 404) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 py-10 px-4">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center space-y-4">
            <p className="text-white/80">{vi.lesson.notFound}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 py-10 px-4">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center space-y-4">
            <p className="text-white/80">{vi.lesson.genericError}</p>
            <button
              onClick={() => refetch()}
              className="bg-white text-purple-700 font-semibold text-sm py-2.5 px-5 rounded-xl transition-colors hover:bg-white/90"
            >
              {vi.common.retry}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  const externalLinks: ExternalLink[] = (() => {
    try {
      return JSON.parse(lesson.externalLinks ?? '[]');
    } catch {
      return [];
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1"
        >
          ← {vi.lesson.goBack}
        </button>

        <div className="bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl p-5 space-y-4">
          <h1 className="text-2xl font-bold text-white">{lesson.title}</h1>

          <span className="inline-flex items-center gap-1 text-xs text-white/70 bg-white/20 px-2.5 py-1 rounded-full">
            ⏱ {lesson.estimatedMins} {vi.lesson.minutes}
          </span>

          <MarkdownContent content={lesson.summary} className="prose-invert" />
        </div>

        {externalLinks.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">{vi.lesson.references}</h2>

            <div className="space-y-2">
              {externalLinks.map((link, index) => {
                const typeConf = linkTypeConfig[link.type] ?? {
                  label: link.type,
                  className: 'bg-white/10 text-white/70',
                };

                return (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${typeConf.className}`}>
                        {typeConf.label}
                      </span>
                      <span className="text-sm text-white/80 truncate group-hover:text-white transition-colors">
                        {link.title}
                      </span>
                    </div>
                    <span className="text-white/50 group-hover:text-white flex-shrink-0 ml-2 text-xs">
                      ↗
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 space-y-3">
          {!completeMutation.isSuccess ? (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="w-full bg-white text-purple-700 font-semibold text-sm py-2.5 rounded-xl transition-colors hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {completeMutation.isPending ? vi.lesson.completing : `${vi.lesson.completeButton} ✓`}
            </button>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-white font-semibold">🎉 {vi.lesson.completed}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-white text-purple-700 font-semibold text-sm py-2.5 rounded-xl transition-colors hover:bg-white/90"
              >
                {vi.lesson.backToDashboard}
              </button>
            </div>
          )}
        </div>

        {lesson.quiz && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
            <button
              onClick={() => navigate(`/lesson/${slug}/quiz`)}
              className="w-full bg-white text-purple-700 font-semibold text-sm py-2.5 rounded-xl transition-colors hover:bg-white/90 flex items-center justify-center gap-2"
            >
              📝 {vi.lesson.takeQuiz}: {lesson.quiz.title}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
