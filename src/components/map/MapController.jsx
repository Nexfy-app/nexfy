import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Smoothly fly the map to a given center/zoom
export default function MapController({ center, zoom, fly = false }) {
  const map = useMap();

  const lat = center ? (Array.isArray(center) ? center[0] : center.lat) : null;
  const lng = center ? (Array.isArray(center) ? center[1] : center.lng) : null;

  useEffect(() => {
    if (!map) return;
    if (lat == null || lng == null) return;
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    if (!isFinite(lat) || !isFinite(lng)) return;
    try {
      if (fly) {
        map.flyTo([lat, lng], zoom || map.getZoom(), { duration: 1.2 });
      } else {
        map.setView([lat, lng], zoom || map.getZoom());
      }
    } catch (e) {
      // ignore invalid latlng
    }
  }, [lat, lng, zoom]);

  return null;
}