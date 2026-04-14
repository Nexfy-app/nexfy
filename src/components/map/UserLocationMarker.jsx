import React from 'react';
import { Marker, Circle } from 'react-leaflet';
import L from 'leaflet';

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div style="
    width: 20px; height: 20px;
    background: #2563eb;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(37,99,235,0.25), 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function UserLocationMarker({ location, radiusKm }) {
  if (!location) return null;

  return (
    <>
      {/* Radius circle */}
      <Circle
        center={[location.lat, location.lng]}
        radius={radiusKm * 1000}
        pathOptions={{
          color: '#2563eb',
          fillColor: '#2563eb',
          fillOpacity: 0.04,
          weight: 1.5,
          dashArray: '6 4',
        }}
      />
      {/* Accuracy circle */}
      {location.accuracy < 500 && (
        <Circle
          center={[location.lat, location.lng]}
          radius={location.accuracy}
          pathOptions={{
            color: '#2563eb',
            fillColor: '#2563eb',
            fillOpacity: 0.06,
            weight: 0,
          }}
        />
      )}
      {/* Blue dot */}
      <Marker position={[location.lat, location.lng]} icon={userIcon} />
    </>
  );
}