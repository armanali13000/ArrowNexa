import { adConfig } from './adConfig';

type RewardKind = 'hint' | 'extra_life' | 'undo' | 'reveal';

let completionsSinceInterstitial = 0;
let lastInterstitialAt = 0;

export const AdManager = {
  canShowBanner: (screen: string) =>
    adConfig.enabled && !adConfig.removeAdsEntitlement && (adConfig.bannerScreens as readonly string[]).includes(screen),
  shouldShowInterstitialAfterCompletion: (levelNumber: number) => {
    if (!adConfig.enabled || adConfig.removeAdsEntitlement || levelNumber < adConfig.protectLevelsBelow) return false;
    completionsSinceInterstitial += 1;
    const cooldownReady = Date.now() - lastInterstitialAt >= adConfig.interstitialCooldownMs;
    return completionsSinceInterstitial >= adConfig.interstitialEveryCompletions && cooldownReady;
  },
  showInterstitial: async () => {
    lastInterstitialAt = Date.now();
    completionsSinceInterstitial = 0;
    return false;
  },
  isRewardedAvailable: (_reward: RewardKind) => adConfig.enabled,
  showRewarded: async (_reward: RewardKind) => false,
};
