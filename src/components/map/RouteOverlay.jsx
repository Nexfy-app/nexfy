import { useEffect, useState } from 'react';
import { Polyline, CircleMarker, useMap } from 'react-leaflet';

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
  const map = useMap();
  const [routePoints, setRoutePoints] = useState(null);

  useEffect(() => {
    if (!isValidCoord(from) || !isValidCoord(to)) return;
    setRoutePoints(null);

    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.routes?.[0]) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRoutePoints(coords);
          const distKm = (route.distance / 1000).toFixed(1);
          const minutes = Math.round(route.duration / 60);
          onEta({ distKm, minutes });
          map.fitBounds(coords, { padding: [120, 80] });
        } else {
          fallback();
        }
      })
      .catch(() => fallback());

    function fallback() {
      const distKm = haversine(from[0], from[1], to[0], to[1]);
      const minutes = Math.round((distKm / 30) * 60);
      onEta({ distKm: distKm.toFixed(1), minutes });
      setRoutePoints([from, to]);
      map.fitBounds([from, to], { padding: [120, 80] });
    }
  }, [from?.[0], from?.[1], to?.[0], to?.[1]]);

  if (!routePoints) return null;

  return (
    <>
      {/* Glow/shadow layer */}
      <Polyline
        positions={routePoints}
        pathOptions={{ color: '#1d4ed8', weight: 14, opacity: 0.08, lineCap: 'round', lineJoin: 'round' }}
      />
      {/* Main route — estilo Uber */}
      <Polyline
        positions={routePoints}
        pathOptions={{ color: '#1d4ed8', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
      />
      {/* Highlight top line */}
      <Polyline
        positions={routePoints}
        pathOptions={{ color: '#93c5fd', weight: 2, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
      />

      {/* Ponto de origem (usuário) */}
      <CircleMarker
        center={from}
        radius={8}
        pathOptions={{ color: '#fff', weight: 3, fillColor: '#1d4ed8', fillOpacity: 1 }}
      />

      {/* Ponto de destino (profissional) */}
      <CircleMarker
        center={to}
        radius={10}
        pathOptions={{ color: '#fff', weight: 3, fillColor: '#0f172a', fillOpacity: 1 }}
      />
      <CircleMarker
        center={to}
        radius={4}
        pathOptions={{ color: '#fff', weight: 0, fillColor: '#fff', fillOpacity: 1 }}
      />
    </>
  );
}