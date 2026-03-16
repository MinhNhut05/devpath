import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  HelpCircle,
  ChevronDown,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import api from '../../services/api';

// ─── TypeScript Interfaces ─────────────────────────────────────────────────────

interface Track {
  id: string;
  title: string;
  lessons: LessonBrief[];
}

interface LessonBrief {
  id: string;
  title: string;
  slug: string;
  quiz?: QuizBrief | null;
}

interface QuizBrief {
  id: string;
  title: string;
  description?: string;
  passThreshold: number;
  retryLimit: number;
  retryCooldown: number;
  questions: Question[];
}

interface LearningPath {
  id: string;
  title: string;
  slug: string;
  tracks: Track[];
}

interface Question {
  id?: string;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  options: QuestionOption[];
  correctAnswer: string[];
  explanation: string;
  order: number;
}

interface QuestionOption {
  id: string;
  text: string;
}

interface QuizRow {
  quizId: string;
  title: string;
  lessonTitle: string;
  lessonId: string;
  passThreshold: number;
  questionsCount: number;
  description?: string;
  retryLimit: number;
  retryCooldown: number;
  questions: Question[];
}

interface QuizFormData {
  lessonId: string;
  title: string;
  description: string;
  passThreshold: number;
  retryLimit: number;
  retryCooldown: number;
  questions: Question[];
}

const EMPTY_OPTION: () => QuestionOption = () => ({
  id: crypto.randomUUID().slice(0, 8),
  text: '',
});

const EMPTY_QUESTION: () => Question = () => ({
  questionText: '',
  questionType: 'SINGLE_CHOICE',
  options: [EMPTY_OPTION(), EMPTY_OPTION()],
  correctAnswer: [],
  explanation: '',
  order: 1,
});

const EMPTY_FORM: QuizFormData = {
  lessonId: '',
  title: '',
  description: '',
  passThreshold: 70,
  retryLimit: 3,
  retryCooldown: 60,
  questions: [EMPTY_QUESTION()],
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminQuizzes() {
  // Data state
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedPathId, setSelectedPathId] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [form, setForm] = useState<QuizFormData>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<QuizRow | null>(null);

  // ── Fetch learning paths ──────────────────────────────────────────────────
  useEffect(() => {
    fetchPaths();
  }, []);

  async function fetchPaths() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/learning-paths');
      const data: LearningPath[] = res.data.data;
      setPaths(data);
      if (data.length > 0 && !selectedPathId) {
        setSelectedPathId(data[0].id);
      }
    } catch {
      setError('Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const selectedPath = paths.find((p) => p.id === selectedPathId);
  const tracks = selectedPath?.tracks ?? [];

  // Build flat quiz rows
  const quizRows: QuizRow[] = tracks.flatMap((t) =>
    t.lessons
      .filter((l) => l.quiz)
      .map((l) => ({
        quizId: l.quiz!.id,
        title: l.quiz!.title,
        lessonTitle: l.title,
        lessonId: l.id,
        passThreshold: l.quiz!.passThreshold,
        questionsCount: l.quiz!.questions?.length ?? 0,
        description: l.quiz!.description,
        retryLimit: l.quiz!.retryLimit,
        retryCooldown: l.quiz!.retryCooldown,
        questions: l.quiz!.questions ?? [],
      })),
  );

  // All lessons (for selector in form)
  const allLessons: { id: string; title: string; trackTitle: string }[] =
    tracks.flatMap((t) =>
      t.lessons.map((l) => ({ id: l.id, title: l.title, trackTitle: t.title })),
    );

  // ── Modal handlers ────────────────────────────────────────────────────────
  function openCreateModal() {
    setEditingQuizId(null);
    setForm({
      ...EMPTY_FORM,
      questions: [EMPTY_QUESTION()],
    });
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(row: QuizRow) {
    setEditingQuizId(row.quizId);
    setForm({
      lessonId: row.lessonId,
      title: row.title,
      description: row.description ?? '',
      passThreshold: row.passThreshold,
      retryLimit: row.retryLimit,
      retryCooldown: row.retryCooldown,
      questions:
        row.questions.length > 0 ? row.questions : [EMPTY_QUESTION()],
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingQuizId(null);
    setFormError(null);
  }

  // ── Question handlers ─────────────────────────────────────────────────────
  function updateQuestion(idx: number, patch: Partial<Question>) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === idx ? { ...q, ...patch } : q,
      ),
    }));
  }

  function addQuestion() {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { ...EMPTY_QUESTION(), order: prev.questions.length + 1 },
      ],
    }));
  }

  function removeQuestion(idx: number) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((_, i) => i !== idx)
        .map((q, i) => ({ ...q, order: i + 1 })),
    }));
  }

  // ── Option handlers ───────────────────────────────────────────────────────
  function updateOption(qIdx: number, oIdx: number, text: string) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, qi) =>
        qi === qIdx
          ? {
              ...q,
              options: q.options.map((o, oi) =>
                oi === oIdx ? { ...o, text } : o,
              ),
            }
          : q,
      ),
    }));
  }

  function addOption(qIdx: number) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, qi) =>
        qi === qIdx ? { ...q, options: [...q.options, EMPTY_OPTION()] } : q,
      ),
    }));
  }

  function removeOption(qIdx: number, oIdx: number) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, qi) => {
        if (qi !== qIdx) return q;
        const newOpts = q.options.filter((_, oi) => oi !== oIdx);
        const removedId = q.options[oIdx].id;
        return {
          ...q,
          options: newOpts,
          correctAnswer: q.correctAnswer.filter((a) => a !== removedId),
        };
      }),
    }));
  }

  function toggleCorrectAnswer(qIdx: number, optionId: string) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, qi) => {
        if (qi !== qIdx) return q;
        if (q.questionType === 'SINGLE_CHOICE') {
          return { ...q, correctAnswer: [optionId] };
        }
        // MULTIPLE_CHOICE — toggle
        const has = q.correctAnswer.includes(optionId);
        return {
          ...q,
          correctAnswer: has
            ? q.correctAnswer.filter((a) => a !== optionId)
            : [...q.correctAnswer, optionId],
        };
      }),
    }));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.lessonId || !form.title.trim()) {
      setFormError('Vui lòng chọn bài học và nhập tiêu đề quiz.');
      return;
    }
    if (form.questions.some((q) => !q.questionText.trim())) {
      setFormError('Mỗi câu hỏi phải có nội dung.');
      return;
    }
    if (form.questions.some((q) => q.options.length < 2)) {
      setFormError('Mỗi câu hỏi cần ít nhất 2 lựa chọn.');
      return;
    }
    if (form.questions.some((q) => q.correctAnswer.length === 0)) {
      setFormError('Mỗi câu hỏi cần chọn đáp án đúng.');
      return;
    }
    if (
      form.questions.some((q) =>
        q.options.some((o) => !o.text.trim()),
      )
    ) {
      setFormError('Không được để trống nội dung lựa chọn.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const payload = {
        lessonId: form.lessonId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        passThreshold: form.passThreshold,
        retryLimit: form.retryLimit,
        retryCooldown: form.retryCooldown,
        questions: form.questions.map((q) => ({
          questionText: q.questionText.trim(),
          questionType: q.questionType,
          options: q.options.map((o) => ({ id: o.id, text: o.text.trim() })),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation.trim() || undefined,
          order: q.order,
        })),
      };

      if (editingQuizId) {
        await api.put(`/admin/quizzes/${editingQuizId}`, payload);
      } else {
        await api.post('/admin/quizzes', payload);
      }
      closeModal();
      await fetchPaths();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Lưu thất bại. Vui lòng thử lại.';
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete handler ────────────────────────────────────────────────────────
  async function handleDelete(row: QuizRow) {
    setDeleting(row.quizId);
    try {
      await api.delete(`/admin/quizzes/${row.quizId}`);
      setDeleteConfirm(null);
      await fetchPaths();
    } catch {
      alert('Xóa thất bại. Vui lòng thử lại.');
    } finally {
      setDeleting(null);
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
            onClick={fetchPaths}
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Quizzes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý quiz cho các bài học
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Thêm quiz
        </button>
      </div>

      {/* Path selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-4">
        <div className="max-w-xs">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Learning Path
          </label>
          <div className="relative">
            <select
              value={selectedPathId}
              onChange={(e) => setSelectedPathId(e.target.value)}
              className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
            >
              {paths.map((p) => (
                <option key={p.id} value={p.id}>
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
      </div>

      {/* Quizzes table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 overflow-hidden">
        {quizRows.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <HelpCircle
              size={32}
              className="text-gray-300 dark:text-gray-600 mx-auto"
            />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Chưa có quiz nào trong path này.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden md:table-cell">
                    Lesson
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                    Threshold
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                    Questions
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {quizRows.map((row) => (
                  <tr
                    key={row.quizId}
                    className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {row.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 md:hidden mt-0.5">
                        {row.lessonTitle}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {row.lessonTitle}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        {row.passThreshold}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                      {row.questionsCount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(row)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(row)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {quizRows.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Tổng cộng {quizRows.length} quiz
            </p>
          </div>
        )}
      </div>

      {/* ── Create/Edit Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[3vh] overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!saving ? closeModal : undefined}
          />

          {/* Modal card */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/40 w-full max-w-3xl p-6 space-y-5 my-4">
            {/* Close button */}
            <button
              onClick={closeModal}
              disabled={saving}
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 pr-8">
              {editingQuizId ? 'Chỉnh sửa quiz' : 'Tạo quiz mới'}
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Top fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Lesson selector */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bài học <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.lessonId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        lessonId: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  >
                    <option value="">Chọn bài học</option>
                    {allLessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        [{l.trackTitle}] {l.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Quiz: React Basics"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Mô tả quiz (tùy chọn)"
                  />
                </div>

                {/* Pass Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pass Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.passThreshold}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        passThreshold: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {/* Retry Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Retry Limit
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.retryLimit}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        retryLimit: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {/* Retry Cooldown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Retry Cooldown (giây)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.retryCooldown}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        retryCooldown: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>
              </div>

              {/* ── Questions section ────────────────────────────────────────── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Câu hỏi ({form.questions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    <PlusCircle size={16} />
                    Thêm câu hỏi
                  </button>
                </div>

                {form.questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-gray-600"
                  >
                    {/* Question header */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Câu {qIdx + 1}
                      </span>
                      {form.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                        >
                          <MinusCircle size={14} />
                          Xóa
                        </button>
                      )}
                    </div>

                    {/* Question text */}
                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) =>
                        updateQuestion(qIdx, {
                          questionText: e.target.value,
                        })
                      }
                      className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none"
                      placeholder="Nội dung câu hỏi..."
                    />

                    {/* Type + Order row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Type
                        </label>
                        <select
                          value={q.questionType}
                          onChange={(e) =>
                            updateQuestion(qIdx, {
                              questionType: e.target.value as
                                | 'SINGLE_CHOICE'
                                | 'MULTIPLE_CHOICE',
                              correctAnswer: [],
                            })
                          }
                          className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                        >
                          <option value="SINGLE_CHOICE">Single Choice</option>
                          <option value="MULTIPLE_CHOICE">
                            Multiple Choice
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={q.order}
                          onChange={(e) =>
                            updateQuestion(qIdx, {
                              order: parseInt(e.target.value) || 1,
                            })
                          }
                          className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Lựa chọn
                        </label>
                        <button
                          type="button"
                          onClick={() => addOption(qIdx)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium transition-colors"
                        >
                          + Thêm
                        </button>
                      </div>

                      {q.options.map((opt, oIdx) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          {/* Correct answer toggle */}
                          <button
                            type="button"
                            onClick={() =>
                              toggleCorrectAnswer(qIdx, opt.id)
                            }
                            className={`w-5 h-5 flex-shrink-0 rounded-${
                              q.questionType === 'SINGLE_CHOICE'
                                ? 'full'
                                : 'md'
                            } border-2 flex items-center justify-center transition-colors ${
                              q.correctAnswer.includes(opt.id)
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 dark:border-gray-500 hover:border-green-400'
                            }`}
                            title="Đánh dấu đáp án đúng"
                          >
                            {q.correctAnswer.includes(opt.id) && (
                              <span className="text-xs font-bold">✓</span>
                            )}
                          </button>

                          {/* Option ID label */}
                          <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-8 flex-shrink-0">
                            {opt.id}
                          </span>

                          {/* Option text */}
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) =>
                              updateOption(qIdx, oIdx, e.target.value)
                            }
                            className="flex-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                            placeholder={`Lựa chọn ${oIdx + 1}`}
                          />

                          {/* Remove option */}
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIdx, oIdx)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Explanation (tùy chọn)
                      </label>
                      <textarea
                        rows={1}
                        value={q.explanation}
                        onChange={(e) =>
                          updateQuestion(qIdx, {
                            explanation: e.target.value,
                          })
                        }
                        className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none"
                        placeholder="Giải thích đáp án..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Error */}
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {formError}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingQuizId ? 'Cập nhật' : 'Tạo quiz'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteConfirm(null)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/40 w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Xác nhận xóa
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Bạn có chắc muốn xóa quiz{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                "{deleteConfirm.title}"
              </span>
              ? Tất cả câu hỏi sẽ bị xóa theo.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={!!deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                Xóa
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={!!deleting}
                className="flex-1 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
