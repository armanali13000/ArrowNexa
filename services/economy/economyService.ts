import { BoosterType, Reward } from '../../engine/types/game';
import { useProgressStore } from '../../store/progress/progressStore';

export const economyService = {
  spendHint: () => useProgressStore.getState().spendHint(),
  addHints: (amount: number) => useProgressStore.getState().addHints(amount),
  useBooster: (booster: BoosterType) => useProgressStore.getState().useBooster(booster),
  addBooster: (booster: BoosterType, amount: number) => useProgressStore.getState().addBooster(booster, amount),
  applyReward: (reward: Reward) => useProgressStore.getState().applyReward(reward),
};
