import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ProtectedAppSkeleton } from './auth/ProtectedAppSkeleton';

/**
 * Route guard with three states: loading, authenticated, unauthenticated.
 * During loading (auth bootstrap in progress), shows skeleton inside layout shell.
 * After bootstrap: redirects to /login if no token, renders children if authenticated.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return <ProtectedAppSkeleton />;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
