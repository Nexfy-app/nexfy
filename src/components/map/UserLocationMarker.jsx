import React from 'react';
import { Marker } from 'react-map-gl/maplibre';

export default function UserLocationMarker({ location }) {
  if (!location) return null;

  return (
    <Marker longitude={location.lng} latitude={location.lat} anchor="center">
      <div style={{
        width: 20,
        height: 20,
        background: '#2563eb',
        border: '3px solid white',
        borderRadius: '50%',
        boxShadow: '0 0 0 4px rgba(37,99,235,0.25), 0 2px 8px rgba(0,0,0,0.3)',
      }} />
    </Marker>
  );
}