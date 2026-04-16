import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Smoothly fly the map to a given center/zoom
export default function MapController({ center, zoom, fly = false }) {
  const map = useMap();

  const lat = center ? (Array.isArray(center) ? center[0] : center.lat) : null;
  const lng = center ? (Array.isArray(center) ? center[1] : center.lng) : null;

  useEffect(() => {
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return;
    if (fly) {
      map.flyTo([lat, lng], zoom || map.getZoom(), { duration: 1.2 });
    } else {
      map.setView([lat, lng], zoom || map.getZoom());
    }
  }, [lat, lng, zoom]);

  return null;
}