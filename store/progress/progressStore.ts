import { create } from 'zustand';
import { ProgressData, defaultProgress, loadProgress, resetProgressStorage, saveProgress } from '../../services/storage/progressStorage';

type ProgressState = ProgressData & {
  loaded: boolean;
  hydrate: () => Promise<void>;
  resetProgress: () => Promise<void>;
};

export const useProgressStore = create<ProgressState>((set) => ({
  ...defaultProgress,
  loaded: false,
  hydrate: async () => {
    const progress = await loadProgress();
    set({ ...progress, loaded: true });
  },
  resetProgress: async () => {
    await resetProgressStorage();
    set({ ...defaultProgress, loaded: true });
  },
}));

export const persistProgressSnapshot = saveProgress;
