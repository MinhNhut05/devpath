import { useState } from 'react';
import { Smartphone, CreditCard, X, Loader2 } from 'lucide-react';
import api from '../services/api';

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

interface PaymentProviderSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: 'PRO' | 'ULTRA';
  price: number;
}

interface PaymentProvider {
  id: 'MOMO' | 'VNPAY';
  name: string;
  icon: typeof Smartphone;
  color: string;
  hoverColor: string;
  bgColor: string;
  description: string;
}

const PROVIDERS: PaymentProvider[] = [
  {
    id: 'MOMO',
    name: 'MoMo',
    icon: Smartphone,
    color: 'text-pink-600 dark:text-pink-400',
    hoverColor: 'hover:border-pink-400 dark:hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    description: 'Ví điện tử MoMo',
  },
  {
    id: 'VNPAY',
    name: 'VNPay',
    icon: CreditCard,
    color: 'text-blue-600 dark:text-blue-400',
    hoverColor: 'hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Thẻ ngân hàng / QR',
  },
];

const TIER_LABELS: Record<string, string> = {
  PRO: 'Pro',
  ULTRA: 'Ultra',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentProviderSelector({
  isOpen,
  onClose,
  selectedTier,
  price,
}: PaymentProviderSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSelectProvider(provider: 'MOMO' | 'VNPAY') {
    setLoading(true);
    setError(null);
    setSelectedProvider(provider);

    try {
      const res = await api.post('/subscriptions/create', {
        tier: selectedTier,
        provider,
      });

      const paymentUrl = res.data?.data?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        setError('Không nhận được link thanh toán. Vui lòng thử lại.');
        setLoading(false);
        setSelectedProvider(null);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Tạo đơn hàng thất bại. Vui lòng thử lại.';
      setError(message);
      setLoading(false);
      setSelectedProvider(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal card */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/40 w-full max-w-md p-6 space-y-5 animate-in">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pr-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Chọn phương thức thanh toán
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nâng cấp lên <span className="font-semibold text-gray-700 dark:text-gray-300">{TIER_LABELS[selectedTier] ?? selectedTier}</span>
            {' — '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">{price.toLocaleString('vi-VN')}đ/tháng</span>
          </p>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 size={28} className="text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Đang tạo đơn hàng qua {selectedProvider === 'MOMO' ? 'MoMo' : 'VNPay'}...
            </p>
          </div>
        )}

        {/* Provider choices */}
        {!loading && (
          <div className="space-y-3">
            {PROVIDERS.map((provider) => {
              const ProviderIcon = provider.icon;
              return (
                <button
                  key={provider.id}
                  onClick={() => handleSelectProvider(provider.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 transition-all ${provider.hoverColor} active:scale-[0.98]`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${provider.bgColor}`}>
                    <ProviderIcon size={24} className={provider.color} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{provider.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{provider.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Cancel button */}
        {!loading && (
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Hủy
          </button>
        )}
      </div>
    </div>
  );
}
