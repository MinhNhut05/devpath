import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Search,
  FileText,
  ChevronDown,
} from 'lucide-react';
import api from '../../services/api';

// ─── TypeScript Interfaces ─────────────────────────────────────────────────────

interface Track {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface LearningPath {
  id: string;
  title: string;
  slug: string;
  tracks: Track[];
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  externalLinks?: string;
  estimatedMins: number;
  isPublished: boolean;
  trackId: string;
  order: number;
}

interface LessonFormData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  externalLinks: string;
  estimatedMins: number;
  isPublished: boolean;
  trackId: string;
  order: number;
}

const EMPTY_FORM: LessonFormData = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  externalLinks: '',
  estimatedMins: 10,
  isPublished: false,
  trackId: '',
  order: 1,
};

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

export default function AdminLessons() {
  // Data state
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedPathId, setSelectedPathId] = useState<string>('');
  const [filterTrackId, setFilterTrackId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState<LessonFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [autoSlug, setAutoSlug] = useState(true);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<Lesson | null>(null);

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
      setError('Không thể tải danh sách learning paths.');
    } finally {
      setLoading(false);
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const selectedPath = paths.find((p) => p.id === selectedPathId);
  const tracks = selectedPath?.tracks ?? [];

  const allLessons: (Lesson & { trackTitle: string })[] = tracks.flatMap((t) =>
    t.lessons.map((l) => ({ ...l, trackTitle: t.title })),
  );

  const filteredLessons = allLessons
    .filter((l) => (filterTrackId ? l.trackId === filterTrackId : true))
    .filter((l) =>
      searchQuery
        ? l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.slug.toLowerCase().includes(searchQuery.toLowerCase())
        : true,
    )
    .sort((a, b) => a.order - b.order);

  // ── Modal handlers ────────────────────────────────────────────────────────
  function openCreateModal() {
    setEditingLesson(null);
    setForm({
      ...EMPTY_FORM,
      trackId: filterTrackId || tracks[0]?.id || '',
    });
    setAutoSlug(true);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(lesson: Lesson) {
    setEditingLesson(lesson);
    setForm({
      title: lesson.title,
      slug: lesson.slug,
      summary: lesson.summary,
      content: lesson.content ?? '',
      externalLinks: lesson.externalLinks ?? '',
      estimatedMins: lesson.estimatedMins,
      isPublished: lesson.isPublished,
      trackId: lesson.trackId,
      order: lesson.order,
    });
    setAutoSlug(false);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingLesson(null);
    setFormError(null);
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      ...(autoSlug ? { slug: slugify(title) } : {}),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim() || !form.trackId) {
      setFormError('Vui lòng điền đầy đủ Title, Slug và chọn Track.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        summary: form.summary.trim(),
        content: form.content.trim() || undefined,
        externalLinks: form.externalLinks.trim() || undefined,
        estimatedMins: form.estimatedMins,
        isPublished: form.isPublished,
        trackId: form.trackId,
        order: form.order,
      };

      if (editingLesson) {
        await api.put(`/admin/lessons/${editingLesson.id}`, payload);
      } else {
        await api.post('/admin/lessons', payload);
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
  async function handleDelete(lesson: Lesson) {
    setDeleting(lesson.id);
    try {
      await api.delete(`/admin/lessons/${lesson.id}`);
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
            Lessons
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý bài học trong các learning path
          </p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={tracks.length === 0}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          Thêm bài học
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Path selector */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Learning Path
            </label>
            <div className="relative">
              <select
                value={selectedPathId}
                onChange={(e) => {
                  setSelectedPathId(e.target.value);
                  setFilterTrackId('');
                }}
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

          {/* Track filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Filter by Track
            </label>
            <div className="relative">
              <select
                value={filterTrackId}
                onChange={(e) => setFilterTrackId(e.target.value)}
                className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              >
                <option value="">Tất cả tracks</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Tìm theo title hoặc slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lessons table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 overflow-hidden">
        {filteredLessons.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <FileText size={32} className="text-gray-300 dark:text-gray-600 mx-auto" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {allLessons.length === 0
                ? 'Chưa có bài học nào trong path này.'
                : 'Không tìm thấy bài học phù hợp.'}
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
                    Slug
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden lg:table-cell">
                    Track
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                    Mins
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                    Published
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLessons.map((lesson) => (
                  <tr
                    key={lesson.id}
                    className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {lesson.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 md:hidden mt-0.5">
                        {lesson.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                        {lesson.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                        {lesson.trackTitle}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                      {lesson.estimatedMins}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          lesson.isPublished
                            ? 'bg-green-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        title={lesson.isPublished ? 'Published' : 'Draft'}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(lesson)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(lesson)}
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

        {/* Summary */}
        {filteredLessons.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Hiển thị {filteredLessons.length} / {allLessons.length} bài học
            </p>
          </div>
        )}
      </div>

      {/* ── Create/Edit Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!saving ? closeModal : undefined}
          />

          {/* Modal card */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/40 w-full max-w-2xl p-6 space-y-5 my-4">
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
              {editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  placeholder="React Basics"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setForm((prev) => ({ ...prev, slug: e.target.value }));
                  }}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  placeholder="react-basics"
                />
                {autoSlug && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Tự động tạo từ title
                  </p>
                )}
              </div>

              {/* Track + Order row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Track <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.trackId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, trackId: e.target.value }))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  >
                    <option value="">Chọn track</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.order}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Summary
                </label>
                <textarea
                  rows={2}
                  value={form.summary}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, summary: e.target.value }))
                  }
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none"
                  placeholder="Mô tả ngắn về bài học..."
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content (Markdown)
                </label>
                <textarea
                  rows={8}
                  value={form.content}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-y font-mono"
                  placeholder="Nội dung bài học dạng Markdown..."
                />
              </div>

              {/* Est. Mins + isPublished row */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Mins
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.estimatedMins}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        estimatedMins: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={form.isPublished}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isPublished: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isPublished"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Published
                  </label>
                </div>
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
                  {saving && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {editingLesson ? 'Cập nhật' : 'Tạo bài học'}
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
              Bạn có chắc muốn xóa bài học{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                "{deleteConfirm.title}"
              </span>
              ? Hành động này không thể hoàn tác.
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
