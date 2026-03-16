import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Crown,
  CreditCard,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';

// ─── TypeScript Interfaces ─────────────────────────────────────────────────────

interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  role: string;
  tier: string;
}

interface SubscriptionInfo {
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface CurrentSubscription {
  tier: string;
  subscription: SubscriptionInfo | null;
}

interface PaymentHistoryItem {
  id: string;
  amount: number;
  provider: string; // "MOMO" | "VNPAY"
  status: string;   // "SUCCESS" | "PENDING" | "FAILED"
  tier: string;
  createdAt: string;
}

interface PaymentHistoryResponse {
  items: PaymentHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Format ngày theo locale Việt Nam
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

// Format số tiền → "99.000đ"
function formatAmount(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

// Tính số ngày còn lại đến endDate
function getDaysLeft(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

// ─── Tier Badge component ──────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  const tierUpper = tier.toUpperCase();

  const styles: Record<string, string> = {
    FREE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PRO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    ULTRA: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  const style = styles[tierUpper] ?? styles.FREE;

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${style}`}>
      {(tierUpper === 'PRO' || tierUpper === 'ULTRA') && (
        <Crown size={11} />
      )}
      {tierUpper === 'FREE' ? 'Miễn phí' : tierUpper === 'PRO' ? 'Pro' : 'Ultra'}
    </span>
  );
}

// ─── Status Badge component ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const statusUpper = status.toUpperCase();

  const styles: Record<string, string> = {
    SUCCESS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const labels: Record<string, string> = {
    SUCCESS: 'Thành công',
    PENDING: 'Đang xử lý',
    FAILED: 'Thất bại',
  };

  const style = styles[statusUpper] ?? styles.PENDING;
  const label = labels[statusUpper] ?? statusUpper;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style}`}>
      {label}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Settings() {
  const navigate = useNavigate();

  // State
  const [user, setUser] = useState<UserInfo | null>(null);
  const [currentSub, setCurrentSub] = useState<CurrentSubscription | null>(null);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyOffset, setHistoryOffset] = useState(0);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 5; // số item mỗi trang

  // Fetch user info + subscription khi mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, subRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/subscriptions/current'),
        ]);
        setUser(userRes.data.data);
        setCurrentSub(subRes.data.data);
      } catch {
        setError('Không thể tải thông tin. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch payment history (tách riêng để có thể load more)
  useEffect(() => {
    fetchHistory(0);
  }, []);

  async function fetchHistory(offset: number) {
    setHistoryLoading(true);
    try {
      const res = await api.get('/subscriptions/history', {
        params: { limit: LIMIT, offset },
      });
      const data: PaymentHistoryResponse = res.data.data;

      if (offset === 0) {
        // Load lần đầu → reset list
        setHistory(data.items);
      } else {
        // Load more → append vào list cũ
        setHistory((prev) => [...prev, ...data.items]);
      }
      setHistoryTotal(data.total);
      setHistoryOffset(offset);
    } catch {
      // Không set error toàn trang nếu chỉ history lỗi
    } finally {
      setHistoryLoading(false);
    }
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-400 dark:text-gray-500">Đang tải...</p>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
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

  // Dữ liệu subscription
  const tier = currentSub?.tier ?? 'FREE';
  const sub = currentSub?.subscription;
  const isFree = tier.toUpperCase() === 'FREE';
  const avatarLetter = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();

  // Có thêm history để load không?
  const hasMore = history.length < historyTotal;

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">

        {/* ── Back button ──────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft size={16} />
          Về Dashboard
        </button>

        {/* ── Section 1: Thông tin tài khoản ────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Thông tin tài khoản
          </h2>

          <div className="flex items-center gap-4">
            {/* Avatar letter */}
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl shrink-0">
              {avatarLetter}
            </div>

            {/* Info */}
            <div className="space-y-1 min-w-0">
              <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                {user?.displayName ?? 'Người dùng'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
              <TierBadge tier={tier} />
            </div>
          </div>
        </div>

        {/* ── Section 2: Subscription ────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Gói đăng ký
          </h2>

          {isFree ? (
            /* FREE tier */
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Crown size={20} className="text-gray-400 dark:text-gray-500" />
                <p className="text-gray-600 dark:text-gray-300">
                  Bạn đang dùng gói <span className="font-semibold">miễn phí</span>
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nâng cấp lên Pro hoặc Ultra để trải nghiệm đầy đủ tính năng.
              </p>
              <button
                onClick={() => navigate('/plans')}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                <Crown size={14} />
                Nâng cấp ngay
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            /* PRO / ULTRA tier với subscription active */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Gói hiện tại</span>
                <TierBadge tier={tier} />
              </div>

              {sub && (
                <>
                  {/* Ngày bắt đầu */}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
                    <span className="text-gray-500 dark:text-gray-400">Ngày bắt đầu:</span>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">
                      {formatDate(sub.startDate)}
                    </span>
                  </div>

                  {/* Ngày hết hạn */}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
                    <span className="text-gray-500 dark:text-gray-400">Hết hạn:</span>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">
                      {formatDate(sub.endDate)}
                    </span>
                  </div>

                  {/* Số ngày còn lại */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-purple-700 dark:text-purple-300">Còn lại</span>
                    <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                      {getDaysLeft(sub.endDate)} ngày
                    </span>
                  </div>
                </>
              )}

              {/* Nút gia hạn */}
              <button
                onClick={() => navigate('/plans')}
                className="flex items-center gap-2 border border-purple-400 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Gia hạn gói
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── Section 3: Lịch sử thanh toán ────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Lịch sử thanh toán
          </h2>

          {history.length === 0 && !historyLoading ? (
            /* Empty state */
            <div className="text-center py-8 space-y-2">
              <CreditCard size={32} className="text-gray-300 dark:text-gray-600 mx-auto" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Chưa có giao dịch nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  {/* Left: ngày + tier */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TierBadge tier={item.tier} />
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDate(item.createdAt)} · {item.provider}
                    </p>
                  </div>

                  {/* Right: số tiền */}
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 shrink-0 ml-3">
                    {formatAmount(item.amount)}
                  </p>
                </div>
              ))}

              {/* Load more button */}
              {hasMore && (
                <button
                  onClick={() => fetchHistory(historyOffset + LIMIT)}
                  disabled={historyLoading}
                  className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium py-2 transition-colors disabled:opacity-40"
                >
                  {historyLoading ? 'Đang tải...' : 'Xem thêm →'}
                </button>
              )}

              {/* Loading spinner khi đang load more */}
              {historyLoading && history.length > 0 && (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-2">
                  Đang tải thêm...
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
