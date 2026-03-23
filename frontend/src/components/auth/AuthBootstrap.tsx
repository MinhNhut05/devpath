import { useEffect, type ReactNode } from 'react';
import api, { refreshAccessTokenOnce, resetSessionExpiredGuard } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

/**
 * Runs once at app startup to restore auth session.
 * Sequence:
 * 1. Call /auth/refresh (single-flight, via cookie)
 * 2. If refresh succeeds, call /auth/me to get full user object
 * 3. Set auth state in store
 * 4. Mark bootstrap as complete (success or failure)
 *
 * This component renders nothing — it's a side-effect-only provider.
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped);
  const hasBootstrapped = useAuthStore((s) => s.hasBootstrapped);

  useEffect(() => {
    if (hasBootstrapped) {
      return;
    }

    async function bootstrap() {
      try {
        const token = await refreshAccessTokenOnce();
        if (token) {
          resetSessionExpiredGuard();
          const meRes = await api.get('/auth/me');
          const user = meRes.data?.data;
          if (user) {
            setAuth(token, user);
          }
        }
      } catch {
        // Refresh failed or /auth/me failed — user is not authenticated.
        // Expected for first-time visitors or expired sessions.
      } finally {
        setBootstrapped();
      }
    }

    void bootstrap();
  }, [hasBootstrapped, setAuth, setBootstrapped]);

  return <>{children}</>;
}
