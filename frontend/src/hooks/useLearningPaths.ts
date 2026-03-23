import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { qk } from '../lib/query/queryKeys';

export interface LearningPath {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  isPublished: boolean;
  order: number;
  _count: { tracks: number };
}

export function useLearningPaths() {
  return useQuery({
    queryKey: qk.learningPaths,
    queryFn: async () => {
      const res = await api.get('/learning-paths');
      return res.data.data as LearningPath[];
    },
  });
}
