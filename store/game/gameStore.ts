import { create } from 'zustand';

type GameState = {
  pauseVisible: boolean;
  completeVisible: boolean;
  failedVisible: boolean;
  phaseOneNotice: string | null;
  setPauseVisible: (visible: boolean) => void;
  setCompleteVisible: (visible: boolean) => void;
  setFailedVisible: (visible: boolean) => void;
  setPhaseOneNotice: (notice: string | null) => void;
};

export const useGameStore = create<GameState>((set) => ({
  pauseVisible: false,
  completeVisible: false,
  failedVisible: false,
  phaseOneNotice: null,
  setPauseVisible: (pauseVisible) => set({ pauseVisible }),
  setCompleteVisible: (completeVisible) => set({ completeVisible }),
  setFailedVisible: (failedVisible) => set({ failedVisible }),
  setPhaseOneNotice: (phaseOneNotice) => set({ phaseOneNotice }),
}));
