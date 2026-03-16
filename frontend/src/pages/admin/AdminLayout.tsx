import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  FileText,
  HelpCircle,
  Users,
  Bot,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';

// ─── Navigation Items ──────────────────────────────────────────────────────────

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Learning Paths', icon: BookOpen, path: '/admin/learning-paths' },
  { label: 'Tracks', icon: Layers, path: '/admin/tracks' },
  { label: 'Lessons', icon: FileText, path: '/admin/lessons' },
  { label: 'Quizzes', icon: HelpCircle, path: '/admin/quizzes' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'AI Content', icon: Bot, path: '/admin/ai-content' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check active link — exact match cho /admin, startsWith cho sub-routes
  function isActive(path: string) {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

      {/* ── Mobile overlay ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-[250px]
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          flex flex-col transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo / Title */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            🛡️ DevPath Admin
          </h1>
          {/* Close button — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200'
                  }
                `}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section: ThemeToggle + Back to main */}
        <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between px-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">Giao diện</span>
            <ThemeToggle />
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Về trang chính
          </button>
        </div>
      </aside>

      {/* ── Main content area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with hamburger */}
        <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
            DevPath Admin
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
