import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

// Trang callback sau OAuth (Google / GitHub)
// Backend redirect về: /auth/callback?token=xxx&isNewUser=true
export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token = params.get('token');
    const isNewUser = params.get('isNewUser') === 'true';

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // Set token vào store trước → axios interceptor đính vào request /auth/me
    setToken(token);

    // Gọi /auth/me để lấy user object đầy đủ
    api
      .get('/auth/me')
      .then((res) => {
        setAuth(token, res.data.data); // lưu cả token + user
        navigate(isNewUser ? '/onboarding' : '/dashboard', { replace: true });
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, [params, navigate, setToken, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Đang đăng nhập...</p>
    </div>
  );
}
