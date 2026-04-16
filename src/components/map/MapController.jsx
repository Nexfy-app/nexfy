import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Smoothly fly the map to a given center/zoom
export default function MapController({ center, zoom, fly = false }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    const [lat, lng] = Array.isArray(center) ? center : [center.lat, center.lng];
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;
    if (fly) {
      map.flyTo([lat, lng], zoom || map.getZoom(), { duration: 1.2 });
    } else {
      map.setView([lat, lng], zoom || map.getZoom());
    }
  }, [center?.[0], center?.[1], zoom]);

  return null;
}