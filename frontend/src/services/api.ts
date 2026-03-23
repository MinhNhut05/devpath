import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import { vi } from '../strings/vi';

const API_BASE =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3002/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;
let sessionExpiredHandled = false;

export async function refreshAccessTokenOnce(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const newToken: string | null = res.data?.data?.accessToken ?? null;
        if (newToken) {
          useAuthStore.getState().setToken(newToken);
        }
        return newToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function handleSessionExpired() {
  if (sessionExpiredHandled) {
    return;
  }

  sessionExpiredHandled = true;
  useAuthStore.getState().logout();
  toast.error(vi.auth.sessionExpired);

  setTimeout(() => {
    window.location.href = '/login';
  }, 2000);
}

export function resetSessionExpiredGuard() {
  sessionExpiredHandled = false;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest?.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const newToken = await refreshAccessTokenOnce();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      handleSessionExpired();
    }

    return Promise.reject(error);
  },
);

export default api;
