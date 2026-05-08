import { useEffect, useState } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';

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

function isValidCoord(arr) {
  return Array.isArray(arr) && arr.length === 2 && arr.every(v => typeof v === 'number' && isFinite(v));
}

export default function RouteOverlay({ from, to, onEta }) {
  const [geojson, setGeojson] = useState(null);

  useEffect(() => {
    if (!isValidCoord(from) || !isValidCoord(to)) return;
    setGeojson(null);

    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.routes?.[0]) {
          const route = data.routes[0];
          setGeojson(route.geometry);
          const distKm = (route.distance / 1000).toFixed(1);
          const minutes = Math.round(route.duration / 60);
          if (onEta) onEta({ distKm, minutes });
        } else {
          fallback();
        }
      })
      .catch(() => fallback());

    function fallback() {
      const distKm = haversine(from[0], from[1], to[0], to[1]);
      const minutes = Math.round((distKm / 30) * 60);
      if (onEta) onEta({ distKm: distKm.toFixed(1), minutes });
      setGeojson({
        type: 'LineString',
        coordinates: [[from[1], from[0]], [to[1], to[0]]],
      });
    }
  }, [from?.[0], from?.[1], to?.[0], to?.[1]]);

  if (!geojson) return null;

  return (
    <Source id="route" type="geojson" data={geojson}>
      <Layer id="route-glow" type="line" paint={{ 'line-color': '#1d4ed8', 'line-width': 14, 'line-opacity': 0.08 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
      <Layer id="route-main" type="line" paint={{ 'line-color': '#1d4ed8', 'line-width': 5, 'line-opacity': 1 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
      <Layer id="route-highlight" type="line" paint={{ 'line-color': '#93c5fd', 'line-width': 2, 'line-opacity': 0.9 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
    </Source>
  );
}