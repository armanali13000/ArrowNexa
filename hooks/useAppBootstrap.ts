import { useEffect, useState } from 'react';
import { useProgressStore } from '../store/progress/progressStore';
import { useSettingsStore } from '../store/settings/settingsStore';

export const useAppBootstrap = () => {
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateProgress = useProgressStore((state) => state.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([hydrateSettings(), hydrateProgress()]).finally(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [hydrateProgress, hydrateSettings]);

  return ready;
};
