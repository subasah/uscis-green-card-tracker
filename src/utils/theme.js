export const THEME_STORAGE_KEY = 'uscis-tracker-theme';

export function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function resolveTheme(preference) {
  if (preference === 'light' || preference === 'dark') return preference;
  return getSystemTheme();
}

export function applyTheme(preference) {
  const resolved = resolveTheme(preference);
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

export function initTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  const preference =
    stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  return applyTheme(preference);
}

export function getChartTheme(resolvedTheme) {
  const isLight = resolvedTheme === 'light';

  return {
    tick: isLight ? '#475569' : '#cbd5e1',
    grid: isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(148, 163, 184, 0.25)',
    tooltip: {
      background: isLight ? '#ffffff' : '#0f172a',
      border: isLight ? '#cbd5e1' : '#334155',
      color: isLight ? '#0f172a' : '#e2e8f0',
    },
    line: isLight ? '#0284c7' : '#38bdf8',
    barGreen: isLight ? '#059669' : '#34d399',
    barPurple: isLight ? '#4f46e5' : '#818cf8',
  };
}

export function getMapTileUrl(resolvedTheme) {
  return resolvedTheme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
}
