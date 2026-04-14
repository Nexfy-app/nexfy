import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Smoothly fly the map to a given center/zoom
export default function MapController({ center, zoom, fly = false }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    if (fly) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
    } else {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center?.[0], center?.[1], zoom]);

  return null;
}