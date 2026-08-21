import { useEffect, useState } from 'react';
import { useProgressStore } from '../store/progress/progressStore';
import { useSettingsStore } from '../store/settings/settingsStore';

export const useAppBootstrap = () => {
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateProgress = useProgressStore((state) => state.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const minimumSplashTime = new Promise((resolve) => setTimeout(resolve, 1400));
    Promise.all([hydrateSettings(), hydrateProgress(), minimumSplashTime]).finally(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [hydrateProgress, hydrateSettings]);

  return ready;
};
