import { create } from 'zustand';
import { apiClient, VaultGovStats } from '@/services/api';

interface StatsStoreState {
  stats: VaultGovStats | null;
  isLoading: boolean;
  fetchStats: () => Promise<void>;
}

export const useStatsStore = create<StatsStoreState>((set) => ({
  stats: null,
  isLoading: true,
  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const data = await apiClient.getStats();
      set({ stats: data, isLoading: false });
    } catch (err) {
      console.warn('[StatsStore] Failed to fetch stats:', err);
      set({ isLoading: false });
    }
  },
}));
