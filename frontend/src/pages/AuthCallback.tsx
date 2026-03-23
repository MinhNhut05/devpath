import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { resetSessionExpiredGuard } from '../services/api';
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
        resetSessionExpiredGuard();
        setAuth(token, res.data.data); // lưu cả token + user
        navigate(isNewUser ? '/onboarding' : '/dashboard', { replace: true });
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, [params, navigate, setToken, setAuth]);

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d0a1a 0%, #1a0e2e 30%, #12101f 60%, #0a0a18 100%)' }}
    >
      {/* Decorative orb */}
      <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full opacity-15 blur-[100px]" style={{ background: 'radial-gradient(circle, #8E37D7, transparent)' }} />

      <div className="relative z-10 text-center">
        <div className="inline-block w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mb-4" />
        <p className="text-white/40">Đang đăng nhập...</p>
      </div>
    </div>
  );
}
