import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Zap, Shield, ArrowLeft, Sparkles } from 'lucide-react';
import api from '../services/api';
import PaymentProviderSelector from '../components/PaymentProviderSelector';

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

interface Plan {
  tier: 'FREE' | 'PRO' | 'ULTRA';
  name: string;
  price: number;
  dailyAiLimit: number;
  description: string;
}

interface Subscription {
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface CurrentSubscription {
  tier: string;
  subscription: Subscription | null;
}

// ─── Feature lists per tier ───────────────────────────────────────────────────

const TIER_FEATURES: Record<string, string[]> = {
  FREE: [
    '10 AI chat/ngày',
    'Truy cập toàn bộ bài học',
    'Hỗ trợ cộng đồng',
  ],
  PRO: [
    '100 AI chat/ngày',
    'Toàn bộ bài học',
    'Ưu tiên hỗ trợ',
    'Không quảng cáo',
  ],
  ULTRA: [
    '500 AI chat/ngày',
    'Toàn bộ bài học',
    'Hỗ trợ 24/7',
    'Không quảng cáo',
    'Chứng chỉ',
  ],
};

// ─── Tier visual config ───────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, {
  icon: typeof Crown;
  gradient: string;
  border: string;
  iconColor: string;
  buttonBg: string;
  buttonHover: string;
  badgeBg: string;
  badgeText: string;
}> = {
  FREE: {
    icon: Shield,
    gradient: 'from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    iconColor: 'text-gray-500 dark:text-gray-400',
    buttonBg: 'bg-gray-200 dark:bg-gray-700',
    buttonHover: 'hover:bg-gray-300 dark:hover:bg-gray-600',
    badgeBg: 'bg-gray-100 dark:bg-gray-700',
    badgeText: 'text-gray-600 dark:text-gray-400',
  },
  PRO: {
    icon: Crown,
    gradient: 'from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
    border: 'border-purple-300 dark:border-purple-600 ring-2 ring-purple-100 dark:ring-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    buttonBg: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    buttonHover: 'hover:from-purple-700 hover:to-indigo-700',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
    badgeText: 'text-purple-700 dark:text-purple-400',
  },
  ULTRA: {
    icon: Zap,
    gradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    border: 'border-amber-300 dark:border-amber-600',
    iconColor: 'text-amber-600 dark:text-amber-400',
    buttonBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    buttonHover: 'hover:from-amber-600 hover:to-orange-600',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
    badgeText: 'text-amber-700 dark:text-amber-400',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Plans() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    tier: 'PRO' | 'ULTRA';
    price: number;
  }>({ isOpen: false, tier: 'PRO', price: 0 });

  // ── Fetch plans + current subscription ────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        const [plansRes, subRes] = await Promise.all([
          api.get('/subscriptions/plans'),
          api.get('/subscriptions/current'),
        ]);
        setPlans(plansRes.data.data);
        setCurrentSub(subRes.data.data);
      } catch {
        setError('Không thể tải thông tin gói dịch vụ. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── Subscription badge text ───────────────────────────────────────────────
  function getSubscriptionBadge(): string {
    if (!currentSub) return '';
    const tier = currentSub.tier;
    if (currentSub.subscription?.endDate) {
      const days = getDaysRemaining(currentSub.subscription.endDate);
      return `Gói hiện tại: ${tier} (còn ${days} ngày)`;
    }
    return `Gói hiện tại: ${tier}`;
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">Đang tải gói dịch vụ...</p>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && plans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
        <div className="max-w-xl mx-auto space-y-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Quay lại Dashboard
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-8 text-center space-y-4">
            <p className="text-4xl">😕</p>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentTier = currentSub?.tier ?? 'FREE';

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Back button ──────────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Quay lại Dashboard
        </button>

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center justify-center gap-2">
            <Sparkles size={24} className="text-purple-500" />
            Chọn gói phù hợp
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
            Nâng cấp để mở khóa thêm AI chat, hỗ trợ ưu tiên và nhiều tính năng premium
          </p>
        </div>

        {/* ── Subscription badge ────────────────────────────────────────── */}
        {currentSub && (
          <div className="flex justify-center">
            <span className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full ${
              TIER_CONFIG[currentTier]?.badgeBg ?? 'bg-gray-100 dark:bg-gray-700'
            } ${TIER_CONFIG[currentTier]?.badgeText ?? 'text-gray-600 dark:text-gray-400'}`}>
              {(() => {
                const Icon = TIER_CONFIG[currentTier]?.icon ?? Shield;
                return <Icon size={16} />;
              })()}
              {getSubscriptionBadge()}
            </span>
          </div>
        )}

        {/* ── Pricing cards grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const config = TIER_CONFIG[plan.tier] ?? TIER_CONFIG.FREE;
            const TierIcon = config.icon;
            const isCurrentTier = currentTier === plan.tier;
            const isPro = plan.tier === 'PRO';
            const features = TIER_FEATURES[plan.tier] ?? [];

            return (
              <div
                key={plan.tier}
                className={`relative bg-gradient-to-b ${config.gradient} border ${config.border} rounded-2xl shadow-sm dark:shadow-gray-900/20 p-6 flex flex-col transition-all hover:shadow-md dark:hover:shadow-gray-900/40 ${
                  isPro ? 'md:-translate-y-2 md:scale-[1.03]' : ''
                }`}
              >
                {/* Recommended badge for Pro */}
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-sm whitespace-nowrap">
                      ⭐ Đề xuất
                    </span>
                  </div>
                )}

                {/* Tier icon + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.badgeBg}`}>
                    <TierIcon size={20} className={config.iconColor} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{plan.name}</h3>
                    {isCurrentTier && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Đang sử dụng
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <span className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
                    {plan.price === 0 ? 'Miễn phí' : plan.price.toLocaleString('vi-VN') + 'đ'}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">/tháng</span>
                  )}
                </div>

                {/* Description */}
                {plan.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                    {plan.description}
                  </p>
                )}

                {/* Features list */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      <Check size={16} className={`flex-shrink-0 mt-0.5 ${config.iconColor}`} />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action button */}
                {plan.tier === 'FREE' ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  >
                    Gói mặc định
                  </button>
                ) : isCurrentTier ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  >
                    ✓ Đang sử dụng
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setPaymentModal({
                        isOpen: true,
                        tier: plan.tier as 'PRO' | 'ULTRA',
                        price: plan.price,
                      })
                    }
                    className={`w-full py-3 rounded-xl text-sm font-semibold text-white transition-all ${config.buttonBg} ${config.buttonHover} shadow-sm hover:shadow-md active:scale-[0.98]`}
                  >
                    Nâng cấp ngay →
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer note ──────────────────────────────────────────────── */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Thanh toán an toàn qua MoMo hoặc VNPay. Hủy bất cứ lúc nào.
        </p>

      </div>

      {/* ── Payment modal ────────────────────────────────────────────── */}
      <PaymentProviderSelector
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
        selectedTier={paymentModal.tier}
        price={paymentModal.price}
      />
    </div>
  );
}
