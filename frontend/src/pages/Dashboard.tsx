import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Clock, BookOpen, MessageSquare, LogOut } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

interface CurrentLesson {
  id: string;
  title: string;
  slug: string;
}

interface EnrolledPath {
  id: string;
  name: string;
  slug: string;
  progress: number;
  currentLesson: CurrentLesson | null;
  totalLessons: number;
  completedLessons: number;
}

interface RecentActivity {
  currentStreak: number;
  totalStudyMinutes: number;
  sessionsThisWeek: number;
}

interface AiQuota {
  used: number;
  limit: number;
  tier: string;
}

interface DashboardOverview {
  user: {
    displayName: string;
    email: string;
    tier: string;
    avatarUrl: string | null;
  };
  enrolledPaths: EnrolledPath[];
  recentActivity: RecentActivity;
  aiQuota: AiQuota;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Gọi /dashboard/overview → fallback /auth/me nếu lỗi
  useEffect(() => {
    api
      .get('/dashboard/overview')
      .then((res) => setData(res.data.data))
      .catch(() => {
        // Fallback: gọi /auth/me, hiện enrolled paths rỗng
        api
          .get('/auth/me')
          .then((res) => {
            const u = res.data.data;
            setData({
              user: {
                displayName: u.displayName ?? u.email,
                email: u.email,
                tier: 'free',
                avatarUrl: u.avatarUrl ?? null,
              },
              enrolledPaths: [],
              recentActivity: { currentStreak: 0, totalStudyMinutes: 0, sessionsThisWeek: 0 },
              aiQuota: { used: 0, limit: 10, tier: 'free' },
            });
          })
          .catch(() => {
            logout();
            navigate('/login');
          });
      })
      .finally(() => setLoading(false));
  }, []);

  // Đăng xuất: gọi API → clear store → redirect
  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } finally {
      logout();
      navigate('/login');
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Đang tải...</p>
      </div>
    );
  }

  if (!data) return null;

  const { user, enrolledPaths, recentActivity, aiQuota } = data;
  const avatarLetter = (user.displayName || user.email).charAt(0).toUpperCase();

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">

        {/* ── Section 1: Header ──────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            {/* Avatar + tên + tier badge */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                {avatarLetter}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{user.displayName}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.tier === 'Pro'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {user.tier}
                </span>
              </div>
            </div>

            {/* Nút đăng xuất */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={15} />
              Đăng xuất
            </button>
          </div>
        </div>

        {/* ── Section 2: Enrolled Learning Paths ────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
            Lộ trình đang học
          </h2>

          {enrolledPaths.length > 0 ? (
            <div className="space-y-3">
              {enrolledPaths.map((path) => (
                <div key={path.id} className="bg-white rounded-xl shadow-sm p-5">
                  <p className="font-semibold text-gray-800 mb-3">{path.name}</p>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Bài hiện tại: <span className="text-gray-700">{path.currentLesson?.title ?? 'Chưa bắt đầu'}</span></span>
                    <span className="font-medium text-blue-600">{path.progress}% hoàn thành</span>
                  </div>

                  <button
                    onClick={() => { if (path.currentLesson?.slug) navigate(`/lesson/${path.currentLesson.slug}`); }}
                    disabled={!path.currentLesson}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Tiếp tục học →
                  </button>
                </div>
              ))}

              {/* Link khám phá thêm — luôn hiện dù đã có lộ trình */}
              <button
                onClick={() => navigate('/explore')}
                className="w-full border-2 border-dashed border-gray-200 hover:border-blue-400 text-gray-500 hover:text-blue-600 text-sm font-medium py-3 rounded-xl transition-colors"
              >
                + Khám phá thêm lộ trình
              </button>
            </div>
          ) : (
            /* Empty state CTA */
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-gray-500 text-sm mb-1">Chưa có lộ trình nào</p>
              <p className="text-gray-400 text-xs mb-4">Hãy khám phá và chọn lộ trình phù hợp với bạn</p>
              <button
                onClick={() => navigate('/explore')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Khám phá lộ trình →
              </button>
            </div>
          )}
        </div>

        {/* ── Section 3: Activity Summary ───────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
            Hoạt động của bạn
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {/* Streak */}
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center gap-2">
              <Flame size={20} className="text-orange-500" />
              <p className="text-xl font-bold text-gray-800">{recentActivity.currentStreak}</p>
              <p className="text-xs text-gray-500 text-center leading-tight">Chuỗi ngày học</p>
            </div>

            {/* Weekly minutes */}
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center gap-2">
              <Clock size={20} className="text-blue-500" />
              <p className="text-xl font-bold text-gray-800">{recentActivity.totalStudyMinutes}</p>
              <p className="text-xs text-gray-500 text-center leading-tight">Phút tuần này</p>
            </div>

            {/* Weekly sessions */}
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center gap-2">
              <BookOpen size={20} className="text-green-500" />
              <p className="text-xl font-bold text-gray-800">{recentActivity.sessionsThisWeek}</p>
              <p className="text-xs text-gray-500 text-center leading-tight">Số buổi học</p>
            </div>
          </div>
        </div>

        {/* ── Section 4: AI Chat Quick Access ───────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
            Trợ lý AI
          </h2>

          <Link to="/ai-chat">
            <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageSquare size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Hỏi AI</p>
                  <p className="text-xs text-gray-500">
                    Quota: {aiQuota.used}/{aiQuota.limit} câu hỏi hôm nay
                  </p>
                </div>
              </div>

              {/* Quota progress mini-bar */}
              <div className="flex flex-col items-end gap-1.5">
                <div className="w-20 bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-purple-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min((aiQuota.used / aiQuota.limit) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-purple-600 font-medium">
                  Còn {aiQuota.limit - aiQuota.used} câu
                </span>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
