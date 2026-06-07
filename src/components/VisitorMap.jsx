import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { loadVisitorStats } from '../utils/visitorService';
import { getMapTileUrl } from '../utils/theme';
import 'leaflet/dist/leaflet.css';

function markerStyle(location) {
  if (location.session) {
    return { radius: 9, color: '#c4b5fd', fillColor: '#a78bfa', weight: 2, fillOpacity: 0.85 };
  }
  if (location.weight >= 3) {
    return { radius: 8, color: '#f472b6', fillColor: '#ec4899', weight: 1, fillOpacity: 0.72 };
  }
  return { radius: 6, color: '#34d399', fillColor: '#10b981', weight: 1, fillOpacity: 0.68 };
}

export default function VisitorMap({ theme = 'dark' }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;
    loadVisitorStats()
      .then((data) => {
        if (active) setStats(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="panel case-map-panel">
      <div className="case-map-header">
        <div>
          <p className="case-hero-eyebrow">Community reach</p>
          <h2>Who&apos;s using the tracker</h2>
          <p>Anonymous pageviews from filers around the world — your case JSON is never included.</p>
        </div>
        <div className="case-map-stat">
          <strong>{loading ? '—' : (stats?.totalPageviews ?? 0).toLocaleString()}</strong>
          <span>total pageviews</span>
        </div>
      </div>

      <div className="case-map-frame">
        {mounted ? (
          <MapContainer
            key={theme}
            center={[24, 0]}
            zoom={2}
            minZoom={2}
            maxZoom={8}
            scrollWheelZoom={false}
            className="case-leaflet-map"
            attributionControl
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url={getMapTileUrl(theme)}
            />
            {stats?.locations?.map((location, index) => (
              <CircleMarker
                key={`${location.lat}-${location.lng}-${index}`}
                center={[location.lat, location.lng]}
                pathOptions={markerStyle(location)}
              >
                {location.label ? <Popup>{location.label}</Popup> : null}
              </CircleMarker>
            ))}
          </MapContainer>
        ) : (
          <div className="case-map-placeholder">Loading map…</div>
        )}
      </div>
    </section>
  );
}
