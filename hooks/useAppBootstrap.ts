import { useEffect, useState } from 'react';
import { useProgressStore } from '../store/progress/progressStore';
import { useSettingsStore } from '../store/settings/settingsStore';

export const useAppBootstrap = () => {
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateProgress = useProgressStore((state) => state.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const started = Date.now();
    const mark = (label: string) => {
      if (__DEV__) console.log(`[BOOT] ${label}: ${Date.now() - started}ms`);
    };

    Promise.all([
      hydrateSettings().finally(() => mark('settings loaded')),
      hydrateProgress().finally(() => mark('progress loaded')),
    ]).finally(() => {
      mark('total');
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [hydrateProgress, hydrateSettings]);

  return ready;
};
