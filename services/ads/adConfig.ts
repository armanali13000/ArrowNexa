export const ADMOB_TEST_IDS = {
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
};

export const adConfig = {
  enabled: false,
  useTestAds: process.env.NODE_ENV !== 'production',
  removeAdsEntitlement: false,
  interstitialEveryCompletions: 5,
  interstitialCooldownMs: 4 * 60 * 1000,
  protectLevelsBelow: 6,
  bannerScreens: ['home', 'levels', 'achievements', 'statistics', 'settings'] as const,
  units: ADMOB_TEST_IDS,
};
