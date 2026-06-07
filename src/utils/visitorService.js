const COUNT_API_NAMESPACE = 'uscis-green-card-tracker.github.io';
const COUNT_API_KEY = 'pageviews';
const STATS_URL = `${import.meta.env.BASE_URL}data/visitor-stats.json`;

export async function loadVisitorStats() {
  const [seed, liveCount] = await Promise.all([
    fetch(STATS_URL)
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null),
    recordPageview(),
  ]);

  const locations = [...(seed?.locations ?? [])];
  const sessionLocation = await fetchSessionLocation();
  if (sessionLocation) {
    locations.push({ ...sessionLocation, weight: 1, session: true });
  }

  return {
    totalPageviews: liveCount ?? seed?.totalPageviews ?? 0,
    locations,
    updatedAt: seed?.updatedAt ?? null,
  };
}

async function recordPageview() {
  try {
    await fetch(`https://api.countapi.xyz/hit/${COUNT_API_NAMESPACE}/${COUNT_API_KEY}`);
    const response = await fetch(
      `https://api.countapi.xyz/get/${COUNT_API_NAMESPACE}/${COUNT_API_KEY}`
    );
    if (!response.ok) return null;
    const payload = await response.json();
    return typeof payload.value === 'number' ? payload.value : null;
  } catch {
    return null;
  }
}

async function fetchSessionLocation() {
  if (sessionStorage.getItem('visitor-geo-recorded')) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const payload = await response.json();
    if (payload.latitude == null || payload.longitude == null) return null;
    sessionStorage.setItem('visitor-geo-recorded', '1');
    return {
      lat: payload.latitude,
      lng: payload.longitude,
      weight: 2,
      label: [payload.city, payload.country_name].filter(Boolean).join(', '),
    };
  } catch {
    return null;
  }
}
