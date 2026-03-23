import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { qk } from '../lib/query/queryKeys';

export interface DashboardUser {
  displayName: string;
  email: string;
  tier: string;
  avatarUrl: string | null;
}

export interface EnrolledPath {
  id: string;
  name: string;
  slug: string;
  progress: number;
  currentLesson: { id: string; title: string; slug: string } | null;
  totalLessons: number;
  completedLessons: number;
}

export interface DashboardData {
  user: DashboardUser;
  enrolledPaths: EnrolledPath[];
  recentActivity: {
    totalStudyMinutes: number;
    currentStreak: number;
    sessionsThisWeek: number;
  };
  aiQuota: { used: number; limit: number; tier: string };
}

export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: async () => {
      const res = await api.get('/dashboard/overview');
      return res.data.data as DashboardData;
    },
  });
}
