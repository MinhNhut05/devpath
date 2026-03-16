import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

interface ExternalLink {
  title: string;
  url: string;
  type: 'documentation' | 'video' | 'tutorial' | 'course' | 'interactive';
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  summary: string;
  externalLinks: string; // JSON string, parse với try/catch
  estimatedMins: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const linkTypeConfig: Record<ExternalLink['type'], { label: string; className: string }> = {
  documentation: { label: 'Docs',        className: 'bg-blue-100 text-blue-700' },
  video:         { label: 'Video',        className: 'bg-red-100 text-red-700' },
  tutorial:      { label: 'Tutorial',     className: 'bg-green-100 text-green-700' },
  course:        { label: 'Course',       className: 'bg-purple-100 text-purple-700' },
  interactive:   { label: 'Interactive',  className: 'bg-yellow-100 text-yellow-700' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Lesson() {
  const navigate      = useNavigate();
  const { slug }      = useParams<{ slug: string }>();

  const [lesson, setLesson]               = useState<Lesson | null>(null);
  const [loading, setLoading]             = useState(true);
  const [errorType, setErrorType]         = useState<'403' | '404' | 'generic' | null>(null);
  const [completing, setCompleting]       = useState(false);
  const [completed, setCompleted]         = useState(false);
  const [completeError, setCompleteError] = useState('');

  // Fetch bài học + tự động đánh dấu "bắt đầu học" khi mount
  useEffect(() => {
    if (!slug) {
      setErrorType('404');
      setLoading(false);
      return;
    }

    Promise.all([
      api.get(`/lessons/${slug}`),
      api.post(`/lessons/${slug}/start`).catch(() => {}), // Lỗi start không block UI
    ])
      .then(([res]) => setLesson(res.data.data))
      .catch((err) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) setErrorType('403');
        else if (status === 404) setErrorType('404');
        else setErrorType('generic');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Đánh dấu hoàn thành bài học
  async function handleComplete() {
    setCompleting(true);
    setCompleteError('');
    try {
      await api.post(`/lessons/${slug}/complete`);
      setCompleted(true);
    } catch {
      setCompleteError('Hoàn thành thất bại. Vui lòng thử lại.');
    } finally {
      setCompleting(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Đang tải...</p>
      </div>
    );
  }

  // ── Error states ───────────────────────────────────────────────────────────
  if (errorType) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center space-y-4">
            {errorType === '403' && (
              <>
                <p className="text-gray-600">Bạn chưa đăng ký lộ trình chứa bài học này.</p>
                <button
                  onClick={() => navigate('/explore')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors"
                >
                  Khám phá lộ trình →
                </button>
              </>
            )}
            {errorType === '404' && (
              <p className="text-gray-600">Không tìm thấy bài học.</p>
            )}
            {errorType === 'generic' && (
              <p className="text-gray-600">Có lỗi xảy ra. Vui lòng thử lại.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Guard: lesson phải có dữ liệu sau khi load xong ───────────────────────
  if (!lesson) return null;

  // Parse external links từ JSON string
  const externalLinks: ExternalLink[] = (() => {
    try { return JSON.parse(lesson.externalLinks ?? '[]'); }
    catch { return []; }
  })();

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">

        {/* ── Back navigation ─────────────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
        >
          ← Quay lại
        </button>

        {/* ── Lesson content card ──────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">{lesson.title}</h1>

          {/* Estimated time badge */}
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            ⏱ {lesson.estimatedMins} phút
          </span>

          {/* Summary */}
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
            {lesson.summary}
          </p>
        </div>

        {/* ── External links section ───────────────────────────────────────── */}
        {externalLinks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Tài liệu tham khảo</h2>

            <div className="space-y-2">
              {externalLinks.map((link, index) => {
                const typeConf = linkTypeConfig[link.type] ?? {
                  label: link.type,
                  className: 'bg-gray-100 text-gray-600',
                };
                return (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-lg px-4 py-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Type badge */}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${typeConf.className}`}>
                        {typeConf.label}
                      </span>
                      {/* Link title */}
                      <span className="text-sm text-gray-700 truncate group-hover:text-blue-600 transition-colors">
                        {link.title}
                      </span>
                    </div>
                    {/* Open in new tab icon */}
                    <span className="text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-2 text-xs">
                      ↗
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Complete section ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          {!completed ? (
            <>
              {completeError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-600">{completeError}</p>
                </div>
              )}
              <button
                onClick={handleComplete}
                disabled={completing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {completing ? 'Đang xử lý...' : 'Hoàn thành bài học ✓'}
              </button>
            </>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-green-600 font-semibold">🎉 Hoàn thành!</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Quay về Dashboard
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
