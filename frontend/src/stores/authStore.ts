import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  role: string;
  displayName?: string; // tên hiển thị (optional, từ register)
  isNewUser?: boolean; // legacy flag từ auth response cũ
  onboardingCompleted?: boolean;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;
  hasBootstrapped: boolean;
  setAuth: (token: string, user: User) => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setBootstrapped: () => void;
  logout: () => void;
}

// Zustand store: lưu accessToken trong memory (không localStorage)
// → Bảo mật hơn: JS có thể đọc localStorage nhưng memory xóa khi đóng tab
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isLoading: true,
  hasBootstrapped: false,

  setAuth: (token, user) => set({ accessToken: token, user }),
  setToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setBootstrapped: () => set({ hasBootstrapped: true, isLoading: false }),
  logout: () => set({ accessToken: null, user: null }),
}));
