import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { useLessonOutline } from '../hooks/useLessonOutline';
import { vi } from '../strings/vi';
import { Skeleton } from './feedback/Skeleton';

interface Props {
  pathSlug: string | null;
  currentLessonSlug: string;
}

export default function LessonSidebar({ pathSlug, currentLessonSlug }: Props) {
  const navigate = useNavigate();
  const { data: tracks, isLoading, error } = useLessonOutline(pathSlug);
  const [openTracks, setOpenTracks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!tracks) return;
    const initial: Record<string, boolean> = {};
    tracks.forEach((track) => {
      const hasCurrent = track.trackLessons.some(
        (tl) => tl.lesson.slug === currentLessonSlug,
      );
      initial[track.id] = hasCurrent;
    });
    setOpenTracks(initial);
  }, [tracks, currentLessonSlug]);

  function toggleTrack(trackId: string) {
    setOpenTracks((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  }

  if (!pathSlug) {
    return (
      <div className="p-5">
        <p className="text-sm text-white/50 text-center">
          {vi.lessonSidebar.noPathSelected}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-4 px-4 space-y-3 animate-pulse">
        <Skeleton className="h-3 w-28 mb-3" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5">
        <p className="text-sm text-white/70">{vi.lessonSidebar.loadError}</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="px-4 pb-3 border-b border-white/10">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">
          {vi.lessonSidebar.title}
        </p>
      </div>

      <nav className="mt-2">
        {(tracks ?? []).map((track) => {
          const isOpen = openTracks[track.id] ?? false;

          return (
            <div key={track.id} className="mb-1">
              <button
                onClick={() => toggleTrack(track.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-white/10 transition-colors"
              >
                {isOpen ? (
                  <ChevronDown size={14} className="text-white/50 shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-white/50 shrink-0" />
                )}
                <span className="text-sm font-semibold text-white truncate flex-1">
                  {track.name}
                </span>
                {track.isOptional && (
                  <span className="text-[10px] font-medium bg-white/20 text-white px-1.5 py-0.5 rounded-full shrink-0">
                    {vi.lessonSidebar.optional}
                  </span>
                )}
              </button>

              {isOpen && (
                <ul className="pb-1">
                  {track.trackLessons.map((tl) => {
                    const isCurrent = tl.lesson.slug === currentLessonSlug;

                    return (
                      <li key={tl.lesson.id}>
                        <button
                          onClick={() =>
                            navigate(`/lesson/${tl.lesson.slug}?path=${pathSlug}`)
                          }
                          className={`w-full text-left pl-9 pr-4 py-2 text-sm transition-colors ${
                            isCurrent
                              ? 'bg-white/20 border-l-4 border-white text-white font-medium pl-8'
                              : 'text-white/70 hover:bg-white/10 border-l-4 border-transparent'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="shrink-0">{isCurrent ? '🔵' : '⚪'}</span>
                            <span className="truncate">{tl.lesson.title}</span>
                            {tl.lesson.quiz && (
                              <span title={vi.lessonSidebar.hasQuiz}>
                                <HelpCircle size={13} className="shrink-0 text-cyan-300/70" />
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
