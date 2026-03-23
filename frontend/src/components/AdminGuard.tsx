import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ProtectedAppSkeleton } from './auth/ProtectedAppSkeleton';

/**
 * Admin route guard: loading-aware, checks token + ADMIN role.
 * During bootstrap: shows skeleton.
 * After bootstrap: redirects to /login if no token, /dashboard if not ADMIN.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return <ProtectedAppSkeleton />;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
