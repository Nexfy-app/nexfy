import React, { useMemo } from 'react';
import { Marker } from 'react-map-gl/maplibre';

const ProfessionalMarker = React.memo(function ProfessionalMarker({ professional, onClick, isSelected }) {
  if (!professional.latitude || !professional.longitude) return null;

  const color = isSelected ? '#1d4ed8' : professional.is_premium ? '#7c3aed' : '#10b981';
  const size = isSelected ? 44 : professional.is_premium ? 40 : 34;

  return (
    <Marker
      longitude={professional.longitude}
      latitude={professional.latitude}
      anchor="center"
      onClick={() => onClick(professional)}
    >
      <div
        style={{
          width: size,
          height: size,
          background: color,
          border: '3px solid white',
          borderRadius: '50%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    </Marker>
  );
}, (prev, next) =>
  prev.professional.id === next.professional.id &&
  prev.professional.latitude === next.professional.latitude &&
  prev.professional.longitude === next.professional.longitude &&
  prev.professional.is_available === next.professional.is_available &&
  prev.professional.is_premium === next.professional.is_premium &&
  prev.isSelected === next.isSelected
);

export default ProfessionalMarker;