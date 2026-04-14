import { useEffect, useState } from 'react';
import { Polyline, useMap } from 'react-leaflet';

// Haversine distance in km
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Simple straight-line route — no API key needed
export default function RouteOverlay({ from, to, onEta }) {
  const map = useMap();

  useEffect(() => {
    if (!from || !to) return;

    const distKm = haversine(from[0], from[1], to[0], to[1]);
    // Average urban travel speed ~30 km/h
    const minutes = Math.round((distKm / 30) * 60);
    onEta({ distKm: distKm.toFixed(1), minutes });

    // Fit bounds to show both points
    map.fitBounds([from, to], { padding: [80, 80] });
  }, [from?.[0], from?.[1], to?.[0], to?.[1]]);

  if (!from || !to) return null;

  return (
    <Polyline
      positions={[from, to]}
      pathOptions={{
        color: '#111',
        weight: 4,
        opacity: 0.85,
        dashArray: '10 6',
        lineCap: 'round',
      }}
    />
  );
}