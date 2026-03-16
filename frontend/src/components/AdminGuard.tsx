import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

// Guard route cho admin: check token + role ADMIN
// Nếu chưa login → /login, nếu không phải ADMIN → /dashboard
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  // Chưa đăng nhập → redirect login
  if (!token) return <Navigate to="/login" replace />;

  // Không phải ADMIN → redirect dashboard
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
