import React, { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

function createCustomIcon(isAvailable, isPremium, isSelected) {
  const color = isSelected ? '#1d4ed8' : isPremium ? '#7c3aed' : isAvailable ? '#10b981' : '#94a3b8';
  const size = isSelected ? 44 : isPremium ? 40 : 34;

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px; height: ${size}px; 
      background: ${color}; 
      border: 3px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: flex; align-items: center; justify-content: center;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const ProfessionalMarker = React.memo(function ProfessionalMarker({ professional, onClick, isSelected }) {
  const icon = useMemo(
    () => createCustomIcon(professional.is_available, professional.is_premium, isSelected),
    [professional.is_available, professional.is_premium, isSelected]
  );

  if (!professional.latitude || !professional.longitude) return null;

  return (
    <Marker
      position={[professional.latitude, professional.longitude]}
      icon={icon}
      eventHandlers={{ click: () => onClick(professional) }}
    />
  );
}, (prev, next) => {
  return prev.professional.id === next.professional.id &&
    prev.professional.latitude === next.professional.latitude &&
    prev.professional.longitude === next.professional.longitude &&
    prev.professional.is_available === next.professional.is_available &&
    prev.professional.is_premium === next.professional.is_premium &&
    prev.isSelected === next.isSelected;
});

export default ProfessionalMarker;