import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import api from '../../services/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

interface LearningPath {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  difficulty: Difficulty;
  estimatedHours: number;
  isPublished: boolean;
  order?: number;
  createdAt: string;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  difficulty: Difficulty;
  estimatedHours: number;
  isPublished: boolean;
  order: number;
}

const DEFAULT_FORM: FormData = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  difficulty: 'beginner',
  estimatedHours: 0,
  isPublished: false,
  order: 0,
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ─── Badge Components ──────────────────────────────────────────────────────────

function PublishedBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400">
      Published
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
      Draft
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const styles: Record<Difficulty, string> = {
    beginner: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[difficulty]}`}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
}

// ─── Modal Form ─────────────────────────────────────────────────────────────────

interface ModalProps {
  mode: 'create' | 'edit';
  initialData?: LearningPath;
  onClose: () => void;
  onSuccess: () => void;
}

function LearningPathModal({ mode, initialData, onClose, onSuccess }: ModalProps) {
  const [form, setForm] = useState<FormData>(() => {
    if (mode === 'edit' && initialData) {
      return {
        name: initialData.name,
        slug: initialData.slug,
        description: initialData.description,
        icon: initialData.icon ?? '',
        difficulty: initialData.difficulty,
        estimatedHours: initialData.estimatedHours,
        isPublished: initialData.isPublished,
        order: initialData.order ?? 0,
      };
    }
    return DEFAULT_FORM;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      // Auto-generate slug khi tạo mới
      slug: mode === 'create' ? toSlug(value) : prev.slug,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...form,
        estimatedHours: Number(form.estimatedHours),
        order: Number(form.order),
      };

      if (mode === 'create') {
        await api.post('/admin/learning-paths', payload);
      } else {
        await api.put(`/admin/learning-paths/${initialData!.id}`, payload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            {mode === 'create' ? 'Tạo Learning Path' : 'Chỉnh sửa Learning Path'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form id="lp-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Ví dụ: JavaScript Cơ Bản"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-mono"
              placeholder="javascript-co-ban"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mô tả
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
              placeholder="Mô tả ngắn về learning path này..."
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Icon <span className="text-gray-400 text-xs">(tuỳ chọn, emoji hoặc URL)</span>
            </label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="🚀 hoặc /icons/js.png"
            />
          </div>

          {/* Difficulty + Estimated Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Độ khó <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.difficulty}
                onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value as Difficulty }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Số giờ ước tính <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                value={form.estimatedHours}
                onChange={(e) => setForm((prev) => ({ ...prev, estimatedHours: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="20"
              />
            </div>
          </div>

          {/* Order + isPublished */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Thứ tự <span className="text-gray-400 text-xs">(tuỳ chọn)</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => setForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="0"
              />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={form.isPublished}
                onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPublished" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Publish ngay
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Huỷ
          </button>
          <button
            type="submit"
            form="lp-form"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Dialog ──────────────────────────────────────────────────────

interface DeleteDialogProps {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function DeleteDialog({ name, onCancel, onConfirm, loading }: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Xác nhận xoá
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Bạn có chắc muốn xoá <span className="font-medium text-gray-800 dark:text-gray-200">"{name}"</span>? Hành động này sẽ ẩn learning path khỏi người dùng.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminLearningPaths() {
  const [items, setItems] = useState<LearningPath[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [includeUnpublished, setIncludeUnpublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<LearningPath | undefined>();

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<LearningPath | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/learning-paths', {
        params: { page, limit: LIMIT, search, includeUnpublished },
      });
      const d = res.data.data;
      setItems(d.items ?? []);
      setTotal(d.total ?? 0);
    } catch {
      setError('Không thể tải danh sách learning paths.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [page, search, includeUnpublished]);

  // Reset page khi search thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, includeUnpublished]);

  // ── Delete ───────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/learning-paths/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchData();
    } catch {
      // silent — keep dialog open, user can retry
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Learning Paths</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Quản lý danh sách learning paths
          </p>
        </div>
        <button
          onClick={() => {
            setEditTarget(undefined);
            setModalMode('create');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors self-start sm:self-auto"
        >
          <Plus size={16} />
          Tạo Learning Path
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        {/* Toggle unpublished */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeUnpublished}
            onChange={(e) => setIncludeUnpublished(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">Hiện cả unpublished</span>
        </label>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Tên</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">Độ khó</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">Số giờ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Trạng thái</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang tải...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                    <button
                      onClick={fetchData}
                      className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Chưa có learning path nào.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.icon && (
                          <span className="text-lg">{item.icon}</span>
                        )}
                        <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <code className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                        {item.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <DifficultyBadge difficulty={item.difficulty} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600 dark:text-gray-400">
                      {item.estimatedHours}h
                    </td>
                    <td className="px-4 py-3">
                      <PublishedBadge published={item.isPublished} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditTarget(item);
                            setModalMode('edit');
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Xoá"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tổng: <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span> items
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalMode && (
        <LearningPathModal
          mode={modalMode}
          initialData={editTarget}
          onClose={() => {
            setModalMode(null);
            setEditTarget(undefined);
          }}
          onSuccess={fetchData}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          name={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
