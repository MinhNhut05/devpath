import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface User {
  id: string;
  email: string;
  role: string;
}

// Dashboard: hiển thị thông tin user + nút logout
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [meData, setMeData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Gọi /auth/me để lấy thông tin user mới nhất
  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        setMeData(res.data.data);
        // Cập nhật user trong store nếu chưa có
        if (!user) setUser(res.data.data);
      })
      .catch(() => {
        logout();
        navigate('/login');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } finally {
      logout();
      navigate('/login');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Đang tải...</p>
      </div>
    );
  }

  const displayUser = meData ?? user;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">DevPath</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Đăng xuất
          </button>
        </div>

        {/* User card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
              {displayUser?.email?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-medium">{displayUser?.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                displayUser?.role === 'ADMIN'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {displayUser?.role ?? 'USER'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-sm text-gray-500">
            <p>ID: <span className="font-mono text-gray-700">{displayUser?.id}</span></p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
          ✅ Backend API hoạt động bình thường tại <strong>localhost:3002</strong>
        </div>
      </div>
    </div>
  );
}
