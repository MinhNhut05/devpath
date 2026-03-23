import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../services/api';
import { vi } from '../strings/vi';

export function useEnroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await api.post(`/learning-paths/${slug}/enroll`);
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['learning-paths'] }),
        queryClient.invalidateQueries({ queryKey: ['progress'] }),
      ]);
    },
    onError: (error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status !== 409) {
        toast.error(vi.explore.enrollError);
      }
    },
  });
}
