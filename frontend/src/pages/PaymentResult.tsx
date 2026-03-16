import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Crown } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Map tier string → label hiển thị đẹp
function getTierLabel(tier: string | null): string {
  if (!tier) return 'Pro';
  switch (tier.toUpperCase()) {
    case 'PRO':
      return 'Pro';
    case 'ULTRA':
      return 'Ultra';
    default:
      return tier;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Đọc query params từ URL: ?status=success&tier=PRO
  const status = searchParams.get('status'); // "success" | "failure"
  const tier = searchParams.get('tier');     // "PRO" | "ULTRA" | null

  const isSuccess = status === 'success';

  // ── Success state ──────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-10">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-8 text-center space-y-5">

          {/* Icon thành công */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle size={40} className="text-green-500 dark:text-green-400" />
            </div>
          </div>

          {/* Crown icon cho tier */}
          <div className="flex items-center justify-center gap-2">
            <Crown size={18} className="text-purple-500 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
              {getTierLabel(tier)}
            </span>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              🎉 Chúc mừng!
            </h1>
            <p className="text-gray-700 dark:text-gray-200 font-medium">
              Bạn đã nâng cấp lên gói {getTierLabel(tier)} thành công
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gói <span className="font-semibold text-purple-600 dark:text-purple-400">{getTierLabel(tier)}</span> đã
            được kích hoạt. Bạn có thể sử dụng tất cả tính năng cao cấp ngay bây giờ.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Về Dashboard
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 rounded-xl transition-colors"
            >
              Xem gói của tôi →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Failure state ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-8 text-center space-y-5">

        {/* Icon thất bại */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <XCircle size={40} className="text-red-500 dark:text-red-400" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            😕 Thanh toán thất bại
          </h1>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại hoặc
          chọn phương thức thanh toán khác.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => navigate('/plans')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Thử lại
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 rounded-xl transition-colors"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
