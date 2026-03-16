import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2, ArrowUpDown } from 'lucide-react';
import api from '../../services/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Role = 'USER' | 'ADMIN';
type Tier = 'FREE' | 'PRO' | 'ULTRA';
type SortField = 'createdAt' | 'email' | 'displayName';
type SortOrder = 'asc' | 'desc';

interface UserItem {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  tier: Tier;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

// ─── Badge Components ──────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    USER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[role]}`}>
      {role}
    </span>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const styles: Record<Tier, string> = {
    FREE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    PRO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    ULTRA: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[tier]}`}>
      {tier}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
      Inactive
    </span>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [tierFilter, setTierFilter] = useState<Tier | ''>('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: LIMIT,
        sort: sortField,
        order: sortOrder,
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (tierFilter) params.tier = tierFilter;

      const res = await api.get('/admin/users', { params });
      const d = res.data.data;
      setItems(d.items ?? []);
      setTotal(d.total ?? 0);
    } catch {
      setError('Không thể tải danh sách users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [page, search, roleFilter, tierFilter, sortField, sortOrder]);

  // Reset page khi filters thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, tierFilter, sortField, sortOrder]);

  // ── Sort toggle ────────────────────────────────────────────────────────────

  function handleSort(field: SortField) {
    if (sortField === field) {
      // Toggle order
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  // ── Sortable header helper ─────────────────────────────────────────────────

  function SortHeader({ field, label, className }: { field: SortField; label: string; className?: string }) {
    const isActive = sortField === field;
    return (
      <th className={`text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 ${className ?? ''}`}>
        <button
          onClick={() => handleSort(field)}
          className="inline-flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          {label}
          <ArrowUpDown size={13} className={isActive ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'} />
          {isActive && (
            <span className="text-xs text-blue-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
          )}
        </button>
      </th>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Quản lý danh sách người dùng
        </p>
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
            placeholder="Tìm theo email hoặc tên..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | '')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="">Tất cả Role</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        {/* Tier filter */}
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as Tier | '')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="">Tất cả Tier</option>
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
          <option value="ULTRA">ULTRA</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <SortHeader field="email" label="Email" />
                <SortHeader field="displayName" label="Display Name" className="hidden sm:table-cell" />
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">Tier</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">Status</th>
                <SortHeader field="createdAt" label="Created At" className="hidden lg:table-cell" />
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden xl:table-cell">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang tải...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
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
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Không tìm thấy user nào.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{user.email}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-700 dark:text-gray-300">
                      {user.displayName || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <TierBadge tier={user.tier} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <StatusBadge active={user.isActive} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-gray-600 dark:text-gray-400">
                      {formatDate(user.lastLoginAt)}
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
              Tổng: <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span> users
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
    </div>
  );
}
