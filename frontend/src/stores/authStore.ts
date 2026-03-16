import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  role: string;
  displayName?: string;  // tên hiển thị (optional, từ register)
  isNewUser?: boolean;   // dùng để navigate sau login: true → /onboarding
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

// Zustand store: lưu accessToken trong memory (không localStorage)
// → Bảo mật hơn: JS có thể đọc localStorage nhưng memory xóa khi đóng tab
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,

  setAuth: (token, user) => set({ accessToken: token, user }),
  setToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  logout: () => set({ accessToken: null, user: null }),
}));
