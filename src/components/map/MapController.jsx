import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

// Moves the map to a given center/zoom without heavy fly animation
export default function MapController({ center, zoom }) {
  const map = useMap();
  const prevRef = useRef(null);

  const lat = center ? (Array.isArray(center) ? center[0] : center.lat) : null;
  const lng = center ? (Array.isArray(center) ? center[1] : center.lng) : null;

  useEffect(() => {
    if (!map || lat == null || lng == null) return;
    if (!isFinite(lat) || !isFinite(lng)) return;
    // Skip if coords haven't meaningfully changed (avoid jitter)
    const prev = prevRef.current;
    if (prev && Math.abs(prev[0] - lat) < 0.0001 && Math.abs(prev[1] - lng) < 0.0001) return;
    prevRef.current = [lat, lng];
    try {
      map.setView([lat, lng], zoom || map.getZoom(), { animate: false });
    } catch (e) {}
  }, [lat, lng, zoom]);

  return null;
}