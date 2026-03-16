import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import api from '../../services/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LearningPath {
  id: string;
  name: string;
}

interface Track {
  id: string;
  name: string;
  description?: string;
  order: number;
  isOptional: boolean;
  learningPathId: string;
  learningPath?: LearningPath;
}

interface FormData {
  learningPathId: string;
  name: string;
  description: string;
  order: number;
  isOptional: boolean;
}

const DEFAULT_FORM: FormData = {
  learningPathId: '',
  name: '',
  description: '',
  order: 0,
  isOptional: false,
};

// ─── Badge ─────────────────────────────────────────────────────────────────────

function OptionalBadge({ optional }: { optional: boolean }) {
  return optional ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
      Optional
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
      Required
    </span>
  );
}

// ─── Modal Form ─────────────────────────────────────────────────────────────────

interface ModalProps {
  mode: 'create' | 'edit';
  initialData?: Track;
  learningPaths: LearningPath[];
  defaultLearningPathId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

function TrackModal({ mode, initialData, learningPaths, defaultLearningPathId, onClose, onSuccess }: ModalProps) {
  const [form, setForm] = useState<FormData>(() => {
    if (mode === 'edit' && initialData) {
      return {
        learningPathId: initialData.learningPathId,
        name: initialData.name,
        description: initialData.description ?? '',
        order: initialData.order,
        isOptional: initialData.isOptional,
      };
    }
    return {
      ...DEFAULT_FORM,
      learningPathId: defaultLearningPathId ?? (learningPaths[0]?.id ?? ''),
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...form,
        order: Number(form.order),
      };

      if (mode === 'create') {
        await api.post('/admin/tracks', payload);
      } else {
        await api.put(`/admin/tracks/${initialData!.id}`, payload);
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
            {mode === 'create' ? 'Tạo Track mới' : 'Chỉnh sửa Track'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form id="track-modal-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Learning Path */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Learning Path <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.learningPathId}
              onChange={(e) => setForm((prev) => ({ ...prev, learningPathId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="">-- Chọn learning path --</option>
              {learningPaths.map((lp) => (
                <option key={lp.id} value={lp.id}>
                  {lp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên Track <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Ví dụ: Biến và Kiểu dữ liệu"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mô tả <span className="text-gray-400 text-xs">(tuỳ chọn)</span>
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
              placeholder="Mô tả track này..."
            />
          </div>

          {/* Order + isOptional */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Thứ tự <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
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
                id="isOptional"
                checked={form.isOptional}
                onChange={(e) => setForm((prev) => ({ ...prev, isOptional: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isOptional" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Track tuỳ chọn
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
            form="track-modal-form"
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
          Bạn có chắc muốn xoá track{' '}
          <span className="font-medium text-gray-800 dark:text-gray-200">"{name}"</span>?
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

export default function AdminTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [filterLpId, setFilterLpId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lpLoading, setLpLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Track | undefined>();

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Track | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Fetch Learning Paths (for filter dropdown + modal) ──────────────────────

  async function fetchLearningPaths() {
    setLpLoading(true);
    try {
      const res = await api.get('/admin/learning-paths', {
        params: { limit: 100, includeUnpublished: true },
      });
      const items: LearningPath[] = (res.data.data?.items ?? []).map(
        (lp: { id: string; name: string }) => ({ id: lp.id, name: lp.name }),
      );
      setLearningPaths(items);
    } catch {
      // silent — not critical, tracks will still load
    } finally {
      setLpLoading(false);
    }
  }

  // ── Fetch Tracks ────────────────────────────────────────────────────────────

  async function fetchTracks() {
    setLoading(true);
    setError(null);
    try {
      // Backend: GET /admin/tracks hoặc filter by learningPathId
      const params: Record<string, string | number | boolean> = { limit: 100 };
      if (filterLpId) params.learningPathId = filterLpId;

      const res = await api.get('/admin/tracks', { params });
      const data = res.data.data;
      // Support cả array và paginated { items: [...] }
      setTracks(Array.isArray(data) ? data : (data?.items ?? []));
    } catch {
      setError('Không thể tải danh sách tracks.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLearningPaths();
  }, []);

  useEffect(() => {
    fetchTracks();
  }, [filterLpId]);

  // ── Delete ───────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/tracks/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchTracks();
    } catch {
      // silent — keep dialog open
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Helper: get LP name ──────────────────────────────────────────────────────

  function getLpName(track: Track): string {
    if (track.learningPath?.name) return track.learningPath.name;
    const lp = learningPaths.find((l) => l.id === track.learningPathId);
    return lp?.name ?? track.learningPathId;
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tracks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Quản lý các track trong learning paths
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
          Tạo Track
        </button>
      </div>

      {/* Filter by Learning Path */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
          Lọc theo:
        </label>
        <select
          value={filterLpId}
          onChange={(e) => setFilterLpId(e.target.value)}
          disabled={lpLoading}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-60"
        >
          <option value="">Tất cả Learning Paths</option>
          {learningPaths.map((lp) => (
            <option key={lp.id} value={lp.id}>
              {lp.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Tên Track</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">Learning Path</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">Thứ tự</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Loại</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang tải...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                    <button
                      onClick={fetchTracks}
                      className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : tracks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Chưa có track nào
                      {filterLpId ? ' cho learning path này' : ''}.
                    </p>
                  </td>
                </tr>
              ) : (
                tracks.map((track) => (
                  <tr
                    key={track.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{track.name}</span>
                      {track.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                          {track.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-gray-600 dark:text-gray-400">{getLpName(track)}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600 dark:text-gray-400">
                      #{track.order}
                    </td>
                    <td className="px-4 py-3">
                      <OptionalBadge optional={track.isOptional} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditTarget(track);
                            setModalMode('edit');
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(track)}
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
      </div>

      {/* Modals */}
      {modalMode && (
        <TrackModal
          mode={modalMode}
          initialData={editTarget}
          learningPaths={learningPaths}
          defaultLearningPathId={filterLpId || undefined}
          onClose={() => {
            setModalMode(null);
            setEditTarget(undefined);
          }}
          onSuccess={fetchTracks}
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
