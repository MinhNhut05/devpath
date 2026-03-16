import { useEffect, useState } from 'react';
import {
  Users,
  Activity,
  DollarSign,
  UserPlus,
  BookOpen,
  Layers,
  FileText,
  HelpCircle,
  GraduationCap,
  CheckCircle,
  BarChart3,
  CreditCard,
  Clock,
} from 'lucide-react';
import api from '../../services/api';

// ─── TypeScript Interfaces ─────────────────────────────────────────────────────

interface AnalyticsUsers {
  total: number;
  activeThisWeek: number;
  newThisMonth: number;
  byTier: { FREE: number; PRO: number; ULTRA: number };
}

interface AnalyticsContent {
  learningPaths: number;
  tracks: number;
  lessons: number;
  quizzes: number;
}

interface AnalyticsLearning {
  totalEnrollments: number;
  totalQuizResults: number;
  completedLessons: number;
  avgQuizScore: number;
  avgAiResponseTimeMs: number;
}

interface AnalyticsRevenue {
  totalPayments: number;
  completedPayments: number;
  totalRevenue: number;
}

interface AnalyticsData {
  users: AnalyticsUsers;
  content: AnalyticsContent;
  learning: AnalyticsLearning;
  revenue: AnalyticsRevenue;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

function formatMs(ms: number): string {
  return (ms / 1000).toFixed(1) + 's';
}

// ─── StatCard Component ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string; // Tailwind color class prefix e.g. "blue", "green"
  subtitle?: string;
}

function StatCard({ label, value, icon: Icon, color, subtitle }: StatCardProps) {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-600 dark:text-blue-400',     iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
    green:  { bg: 'bg-green-50 dark:bg-green-900/20',    text: 'text-green-600 dark:text-green-400',   iconBg: 'bg-green-100 dark:bg-green-900/30' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20',  text: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/30' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20',  text: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/30' },
    cyan:   { bg: 'bg-cyan-50 dark:bg-cyan-900/20',      text: 'text-cyan-600 dark:text-cyan-400',     iconBg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20',    text: 'text-amber-600 dark:text-amber-400',   iconBg: 'bg-amber-100 dark:bg-amber-900/30' },
    rose:   { bg: 'bg-rose-50 dark:bg-rose-900/20',      text: 'text-rose-600 dark:text-rose-400',     iconBg: 'bg-rose-100 dark:bg-rose-900/30' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20',  text: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    teal:   { bg: 'bg-teal-50 dark:bg-teal-900/20',      text: 'text-teal-600 dark:text-teal-400',     iconBg: 'bg-teal-100 dark:bg-teal-900/30' },
    gray:   { bg: 'bg-gray-50 dark:bg-gray-800',         text: 'text-gray-600 dark:text-gray-400',     iconBg: 'bg-gray-100 dark:bg-gray-700' },
  };

  const c = colorMap[color] ?? colorMap.gray;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${c.iconBg} rounded-lg flex items-center justify-center`}>
          <Icon size={20} className={c.text} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      {subtitle && (
        <p className={`text-xs mt-1 ${c.text}`}>{subtitle}</p>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/admin/analytics')
      .then((res) => setData(res.data.data))
      .catch(() => setError('Không thể tải dữ liệu thống kê.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <p className="text-gray-500 dark:text-gray-400">{error ?? 'Đã xảy ra lỗi.'}</p>
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

  const { users, content, learning, revenue } = data;

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tổng quan hệ thống DevPath</p>
      </div>

      {/* ── Row 1: User Stats ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Người dùng
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Tổng người dùng"
            value={users.total}
            icon={Users}
            color="blue"
            subtitle={`FREE: ${users.byTier.FREE} · PRO: ${users.byTier.PRO} · ULTRA: ${users.byTier.ULTRA}`}
          />
          <StatCard
            label="Hoạt động tuần này"
            value={users.activeThisWeek}
            icon={Activity}
            color="green"
          />
          <StatCard
            label="Tổng doanh thu"
            value={formatVND(revenue.totalRevenue)}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            label="Người dùng mới tháng này"
            value={users.newThisMonth}
            icon={UserPlus}
            color="orange"
          />
        </div>
      </div>

      {/* ── Row 2: Content Stats ────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Nội dung
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Learning Paths"
            value={content.learningPaths}
            icon={BookOpen}
            color="indigo"
          />
          <StatCard
            label="Tracks"
            value={content.tracks}
            icon={Layers}
            color="cyan"
          />
          <StatCard
            label="Lessons"
            value={content.lessons}
            icon={FileText}
            color="teal"
          />
          <StatCard
            label="Quizzes"
            value={content.quizzes}
            icon={HelpCircle}
            color="amber"
          />
        </div>
      </div>

      {/* ── Row 3: Learning Stats ───────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Học tập
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            label="Tổng lượt đăng ký"
            value={learning.totalEnrollments}
            icon={GraduationCap}
            color="blue"
          />
          <StatCard
            label="Bài học hoàn thành"
            value={learning.completedLessons}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label="Điểm quiz trung bình"
            value={`${learning.avgQuizScore}%`}
            icon={BarChart3}
            color="purple"
          />
        </div>
      </div>

      {/* ── Row 4: Revenue + Payment Stats ──────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Thanh toán
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Thanh toán"
            value={`${revenue.completedPayments}/${revenue.totalPayments}`}
            icon={CreditCard}
            color="rose"
            subtitle="Hoàn thành / Tổng"
          />
          <StatCard
            label="Thời gian phản hồi AI"
            value={formatMs(learning.avgAiResponseTimeMs)}
            icon={Clock}
            color="amber"
            subtitle={`${learning.avgAiResponseTimeMs}ms`}
          />
        </div>
      </div>
    </div>
  );
}
