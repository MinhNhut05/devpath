import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  CreditCard,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { vi } from '../strings/vi';

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
    FREE: 'badge badge-success',
    PRO: 'badge badge-primary',
    ULTRA: 'badge badge-warning',
  };

  const labels: Record<string, string> = {
    FREE: vi.settings.freeTier,
    PRO: vi.settings.proTier,
    ULTRA: vi.settings.ultraTier,
  };

  const style = styles[tierUpper] ?? styles.FREE;
  const label = labels[tierUpper] ?? labels.FREE;

  return (
    <span className={`${style}`}>
      {(tierUpper === 'PRO' || tierUpper === 'ULTRA') && (
        <Crown size={11} />
      )}
      {label}
    </span>
  );
}

// ─── Status Badge component ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const statusUpper = status.toUpperCase();

  const styles: Record<string, string> = {
    SUCCESS: 'badge badge-success',
    PENDING: 'badge badge-warning',
    FAILED: 'badge badge-error',
  };

  const labels: Record<string, string> = {
    SUCCESS: vi.settings.statusSuccess,
    PENDING: vi.settings.statusPending,
    FAILED: vi.settings.statusFailed,
  };

  const style = styles[statusUpper] ?? styles.PENDING;
  const label = labels[statusUpper] ?? statusUpper;

  return (
    <span className={style}>
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
        setError(vi.settings.loadError);
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
      <div className="flex items-center justify-center py-20">
        <p className="text-dp-text-muted">{vi.common.loading}</p>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="glass rounded-2xl p-6 text-center space-y-4 max-w-md">
          <p className="text-dp-text-secondary">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            {vi.common.retry}
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
    <div className="space-y-6">

      {/* ── Page title ──────────────────────────────────────────────── */}
      <h1 className="text-2xl font-bold text-dp-text-primary">{vi.settings.title}</h1>

      <div className="max-w-2xl space-y-6">

        {/* ── Section 1: Thông tin tài khoản ────────────────────────── */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-dp-text-muted uppercase tracking-wide mb-4">
            {vi.settings.accountInfo}
          </h2>

          <div className="flex items-center gap-4">
            {/* Avatar letter */}
            <div className="w-14 h-14 bg-dp-glass-hover rounded-full flex items-center justify-center text-dp-text-primary font-bold text-xl shrink-0">
              {avatarLetter}
            </div>

            {/* Info */}
            <div className="space-y-1 min-w-0">
              <p className="font-semibold text-dp-text-primary truncate">
                {user?.displayName ?? vi.settings.defaultUser}
              </p>
              <p className="text-sm text-dp-text-secondary truncate">
                {user?.email}
              </p>
              <TierBadge tier={tier} />
            </div>
          </div>
        </div>

        {/* ── Section 2: Subscription ────────────────────────────────── */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-dp-text-muted uppercase tracking-wide mb-4">
            {vi.settings.subscription}
          </h2>

          {isFree ? (
            /* FREE tier */
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Crown size={20} className="text-dp-text-muted" />
                <p className="text-dp-text-secondary">
                  {vi.settings.freeDesc}{' '}
                  <span className="font-semibold text-dp-text-primary">{vi.settings.freeLabel}</span>
                </p>
              </div>
              <p className="text-sm text-dp-text-muted">
                {vi.settings.upgradeDesc}
              </p>
              <button
                onClick={() => navigate('/plans')}
                className="btn-primary"
              >
                <Crown size={14} />
                {vi.settings.upgradeButton}
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            /* PRO / ULTRA tier với subscription active */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-dp-text-secondary font-medium">{vi.settings.currentPlan}</span>
                <TierBadge tier={tier} />
              </div>

              {sub && (
                <>
                  {/* Ngày bắt đầu */}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-dp-text-muted shrink-0" />
                    <span className="text-dp-text-muted">{vi.settings.startDate}</span>
                    <span className="text-dp-text-primary font-medium">
                      {formatDate(sub.startDate)}
                    </span>
                  </div>

                  {/* Ngày hết hạn */}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-dp-text-muted shrink-0" />
                    <span className="text-dp-text-muted">{vi.settings.endDate}</span>
                    <span className="text-dp-text-primary font-medium">
                      {formatDate(sub.endDate)}
                    </span>
                  </div>

                  {/* Số ngày còn lại */}
                  <div className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-dp-text-secondary">{vi.settings.daysLeft}</span>
                    <span className="text-sm font-bold text-dp-text-primary">
                      {getDaysLeft(sub.endDate)} {vi.settings.daysUnit}
                    </span>
                  </div>
                </>
              )}

              {/* Nút gia hạn */}
              <button
                onClick={() => navigate('/plans')}
                className="btn-primary"
              >
                {vi.settings.renewButton}
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── Section 3: Lịch sử thanh toán ────────────────────────── */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-dp-text-muted uppercase tracking-wide mb-4">
            {vi.settings.paymentHistory}
          </h2>

          {history.length === 0 && !historyLoading ? (
            /* Empty state */
            <div className="text-center py-8 space-y-2">
              <CreditCard size={32} className="text-dp-text-ghost mx-auto" />
              <p className="text-sm text-dp-text-muted">{vi.settings.noTransactions}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b border-dp-border-subtle last:border-0"
                >
                  {/* Left: ngày + tier */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TierBadge tier={item.tier} />
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-dp-text-muted mt-1">
                      {formatDate(item.createdAt)} · {item.provider}
                    </p>
                  </div>

                  {/* Right: số tiền */}
                  <p className="text-sm font-semibold text-dp-text-primary shrink-0 ml-3">
                    {formatAmount(item.amount)}
                  </p>
                </div>
              ))}

              {/* Load more button */}
              {hasMore && (
                <button
                  onClick={() => fetchHistory(historyOffset + LIMIT)}
                  disabled={historyLoading}
                  className="w-full text-sm text-dp-text-secondary hover:text-dp-text-primary font-medium py-2 transition-colors disabled:opacity-40"
                >
                  {historyLoading ? vi.common.loading : `${vi.settings.loadMore} →`}
                </button>
              )}

              {/* Loading spinner khi đang load more */}
              {historyLoading && history.length > 0 && (
                <p className="text-center text-xs text-dp-text-muted py-2">
                  {vi.settings.loadingMore}
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
