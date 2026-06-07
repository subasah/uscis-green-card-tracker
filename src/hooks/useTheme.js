import { useCallback, useEffect, useState } from 'react';
import { applyTheme, getSystemTheme, resolveTheme, THEME_STORAGE_KEY } from '../utils/theme';

function readStoredPreference() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

export function useTheme() {
  const [preference, setPreferenceState] = useState(readStoredPreference);
  const resolved = resolveTheme(preference);

  useEffect(() => {
    applyTheme(preference);
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  }, [preference]);

  useEffect(() => {
    if (preference !== 'system') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => applyTheme('system');
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [preference]);

  const setPreference = useCallback((next) => {
    setPreferenceState(next);
  }, []);

  const toggleLightDark = useCallback(() => {
    const next = resolveTheme(preference) === 'light' ? 'dark' : 'light';
    setPreferenceState(next);
  }, [preference]);

  return {
    preference,
    resolved,
    setPreference,
    toggleLightDark,
    isLight: resolved === 'light',
    systemTheme: getSystemTheme(),
  };
}
