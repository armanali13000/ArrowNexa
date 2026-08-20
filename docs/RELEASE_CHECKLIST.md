# ArrowNexa Release Checklist

## Build Identity
- [x] App name: ArrowNexa
- [x] Package: com.armanix.arrownexa
- [x] Version: 1.0.0
- [x] Android versionCode: 1
- [x] Orientation: portrait
- [x] EAS profiles: development, preview, production
- [ ] Production AAB generated with `eas build --platform android --profile production`

## QA Gates
- [x] TypeScript check passes
- [x] Expo Doctor passes
- [x] Engine tests pass
- [x] Rapid tap / polish stress test passes
- [x] Phase 8 daily/weekly/achievement tests pass
- [ ] Manual 500-level visual pass on device
- [ ] Manual small/standard/large Android screen pass
- [ ] Manual 30-minute session/memory pass
- [ ] Google Play pre-launch report reviewed

## Arrow & Board
- [x] Arrowheads are rounded chevron strokes, not filled oversized triangles
- [x] Touch target remains wider than visible stroke
- [x] Exit animation reports completion once per arrow
- [x] Final completion appears after the final arrow exit callback
- [ ] Capture final Easy, Hard, Expert screenshots on device

## Monetization
- [x] Central ad config exists in `services/ads/adConfig.ts`
- [x] Ad manager exists in `services/ads/AdManager.ts`
- [x] Development test ad unit IDs are centralized
- [x] Gameplay banner placement is disallowed by architecture
- [x] Interstitial frequency/cooldown/early-level protection are configured
- [x] Rewarded ad reward path is architecture-only and optional
- [ ] Choose and install a current Expo-compatible Google Mobile Ads SDK
- [ ] Add production ad unit IDs through production configuration
- [ ] Implement official consent flow required by the selected SDK
- [ ] Verify ads offline failure behavior in a custom build

## Privacy / Data Safety
- [x] No analytics SDK added
- [x] Local gameplay data is documented
- [x] Notifications are off by default
- [ ] Update hosted Privacy Policy before Play Store submission
- [ ] Fill Google Play Data Safety after final ad SDK is selected
- [ ] Review target audience and Families policy choices

## Store Listing
- [ ] Final launcher icon verified at small size
- [ ] Production splash configuration finalized with the SDK 57-supported splash package/plugin
- [ ] Feature graphic 1024x500 created
- [ ] Phone screenshots captured:
  - [ ] Easy gameplay
  - [ ] Hard gameplay
  - [ ] Expert gameplay
  - [ ] Level Map
  - [ ] Daily Challenge
  - [ ] Achievements
  - [ ] Statistics/Progress
  - [ ] Settings/theme
- [ ] Short description finalized
- [ ] Full description finalized
- [ ] Release notes finalized

## Internal / Closed Testing
- [ ] Internal Testing upload complete
- [ ] Install/update/launch verified
- [ ] Closed Testing track ready if required
- [ ] Tester feedback reviewed for tap accuracy, clarity, spacing, difficulty, and crashes

## Known Issues
- Production ads are not active until a native ad SDK, consent flow, production IDs, and privacy review are completed.
- Notification scheduling preferences exist, but scheduling is not active until `expo-notifications` is installed and permission UX is finalized.
- Splash artwork exists, but final native splash configuration still needs the SDK-supported splash package/plugin before Play Store submission.
- Legal text in-app is concise; a hosted Privacy Policy/Terms page is still needed for Play Store submission.
