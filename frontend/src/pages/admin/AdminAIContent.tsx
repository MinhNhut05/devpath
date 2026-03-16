import { useEffect, useState } from 'react';
import {
  Bot,
  Loader2,
  Plus,
  X,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Sparkles,
  FileText,
  HelpCircle,
} from 'lucide-react';
import api from '../../services/api';

// ─── TypeScript Interfaces ─────────────────────────────────────────────────────

interface Track {
  id: string;
  title: string;
}

interface LearningPath {
  id: string;
  title: string;
  slug: string;
  tracks: Track[];
}

interface LessonInput {
  title: string;
  slug: string;
  trackId: string;
  order: number;
}

interface GeneratedLesson {
  id?: string;
  title: string;
  slug: string;
}

interface GeneratedQuiz {
  id?: string;
  title: string;
  lessonTitle?: string;
}

interface GenerateResult {
  generatedLessons: GeneratedLesson[];
  generatedQuizzes: GeneratedQuiz[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminAIContent() {
  // Data
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedPathSlug, setSelectedPathSlug] = useState<string>('');
  const [lessons, setLessons] = useState<LessonInput[]>([
    { title: '', slug: '', trackId: '', order: 1 },
  ]);
  const [generateQuiz, setGenerateQuiz] = useState(true);
  const [quizQuestionsCount, setQuizQuestionsCount] = useState(5);

  // Submit state
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  // ── Fetch learning paths ──────────────────────────────────────────────────
  useEffect(() => {
    api
      .get('/admin/learning-paths')
      .then((res) => {
        const data: LearningPath[] = res.data.data;
        setPaths(data);
        if (data.length > 0) setSelectedPathSlug(data[0].slug);
      })
      .catch(() => setError('Không thể tải danh sách learning paths.'))
      .finally(() => setLoading(false));
  }, []);

  const selectedPath = paths.find((p) => p.slug === selectedPathSlug);
  const tracks = selectedPath?.tracks ?? [];

  // ── Lesson input handlers ─────────────────────────────────────────────────
  function updateLesson(idx: number, patch: Partial<LessonInput>) {
    setLessons((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    );
  }

  function handleLessonTitleChange(idx: number, title: string) {
    setLessons((prev) =>
      prev.map((l, i) =>
        i === idx ? { ...l, title, slug: slugify(title) } : l,
      ),
    );
  }

  function addLesson() {
    setLessons((prev) => [
      ...prev,
      {
        title: '',
        slug: '',
        trackId: tracks[0]?.id ?? '',
        order: prev.length + 1,
      },
    ]);
  }

  function removeLesson(idx: number) {
    setLessons((prev) =>
      prev.filter((_, i) => i !== idx).map((l, i) => ({ ...l, order: i + 1 })),
    );
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedPathSlug) {
      setGenerateError('Vui lòng chọn Learning Path.');
      return;
    }
    if (lessons.length === 0) {
      setGenerateError('Vui lòng thêm ít nhất 1 bài học.');
      return;
    }
    if (lessons.some((l) => !l.title.trim() || !l.trackId)) {
      setGenerateError('Mỗi bài học cần có title và track.');
      return;
    }

    setGenerating(true);
    setGenerateError(null);
    setResult(null);

    try {
      const payload = {
        learningPathSlug: selectedPathSlug,
        lessons: lessons.map((l) => ({
          title: l.title.trim(),
          slug: l.slug || slugify(l.title),
          trackId: l.trackId,
          order: l.order,
        })),
        generateQuiz,
        ...(generateQuiz ? { quizQuestionsCount } : {}),
      };

      const res = await api.post('/admin/content/generate', payload);
      setResult(res.data.data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Tạo nội dung thất bại. Vui lòng thử lại.';
      setGenerateError(message);
    } finally {
      setGenerating(false);
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Sparkles size={22} className="text-purple-500" />
          AI Content Generate
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Tạo nội dung bài học và quiz tự động bằng AI
        </p>
      </div>

      {/* ── Form card ──────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 space-y-6"
      >
        {/* Learning Path selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Learning Path <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedPathSlug}
              onChange={(e) => {
                setSelectedPathSlug(e.target.value);
                // Reset lesson trackIds when changing path
                const newPath = paths.find((p) => p.slug === e.target.value);
                const defaultTrackId = newPath?.tracks[0]?.id ?? '';
                setLessons((prev) =>
                  prev.map((l) => ({ ...l, trackId: defaultTrackId })),
                );
              }}
              className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2.5 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
            >
              {paths.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* ── Lessons to generate ──────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bài học cần tạo <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addLesson}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              <Plus size={15} />
              Thêm bài học
            </button>
          </div>

          {lessons.map((lesson, idx) => (
            <div
              key={idx}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-gray-600"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Bài {idx + 1}
                </span>
                {lessons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLesson(idx)}
                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                  >
                    <X size={14} />
                    Xóa
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={lesson.title}
                    onChange={(e) =>
                      handleLessonTitleChange(idx, e.target.value)
                    }
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    placeholder="React Basics"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={lesson.slug}
                    onChange={(e) =>
                      updateLesson(idx, { slug: e.target.value })
                    }
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    placeholder="react-basics"
                  />
                </div>

                {/* Track */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Track
                  </label>
                  <select
                    value={lesson.trackId}
                    onChange={(e) =>
                      updateLesson(idx, { trackId: e.target.value })
                    }
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  >
                    <option value="">Chọn track</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Order */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lesson.order}
                    onChange={(e) =>
                      updateLesson(idx, {
                        order: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quiz settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="generateQuiz"
              checked={generateQuiz}
              onChange={(e) => setGenerateQuiz(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="generateQuiz"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tạo quiz cho mỗi bài học
            </label>
          </div>

          {generateQuiz && (
            <div className="max-w-xs">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Số câu hỏi mỗi quiz
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={quizQuestionsCount}
                onChange={(e) =>
                  setQuizQuestionsCount(parseInt(e.target.value) || 5)
                }
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
          )}
        </div>

        {/* Error */}
        {generateError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 flex items-start gap-3">
            <AlertCircle
              size={18}
              className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-red-600 dark:text-red-400">
              {generateError}
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              AI đang tạo nội dung...
            </>
          ) : (
            <>
              <Bot size={18} />
              Bắt đầu tạo nội dung
            </>
          )}
        </button>

        {/* Generating note */}
        {generating && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-4 py-3">
            <p className="text-sm text-purple-700 dark:text-purple-300 text-center">
              ⏳ AI đang tạo nội dung... Quá trình này có thể mất 30-60 giây.
              <br />
              <span className="text-xs text-purple-500 dark:text-purple-400">
                Vui lòng không đóng trang này.
              </span>
            </p>
          </div>
        )}
      </form>

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 space-y-5">
          {/* Success header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <CheckCircle
                size={20}
                className="text-green-600 dark:text-green-400"
              />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 dark:text-gray-100">
                Tạo nội dung thành công!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI đã tạo xong nội dung bên dưới.
              </p>
            </div>
          </div>

          {/* Generated Lessons */}
          {result.generatedLessons?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FileText size={16} className="text-teal-500" />
                Bài học đã tạo ({result.generatedLessons.length})
              </h3>
              <div className="space-y-1.5">
                {result.generatedLessons.map((lesson, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-2.5"
                  >
                    <CheckCircle
                      size={14}
                      className="text-green-500 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {lesson.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {lesson.slug}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Quizzes */}
          {result.generatedQuizzes?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <HelpCircle size={16} className="text-amber-500" />
                Quiz đã tạo ({result.generatedQuizzes.length})
              </h3>
              <div className="space-y-1.5">
                {result.generatedQuizzes.map((quiz, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-2.5"
                  >
                    <CheckCircle
                      size={14}
                      className="text-green-500 flex-shrink-0"
                    />
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {quiz.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate more button */}
          <button
            onClick={() => {
              setResult(null);
              setLessons([
                { title: '', slug: '', trackId: tracks[0]?.id ?? '', order: 1 },
              ]);
            }}
            className="w-full py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            ← Tạo thêm nội dung
          </button>
        </div>
      )}
    </div>
  );
}
