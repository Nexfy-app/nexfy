import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Star } from 'lucide-react';

function createCustomIcon(isAvailable, isPremium, isSelected) {
  const color = isSelected ? '#1d4ed8' : isPremium ? '#7c3aed' : isAvailable ? '#10b981' : '#94a3b8';
  const size = isSelected ? 46 : isPremium ? 42 : 36;
  const pulse = isSelected || isPremium;

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px; height: ${size}px; 
      background: ${color}; 
      border: 3px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 12px rgba(0,0,0,0.25)${isSelected ? ', 0 0 0 6px rgba(29,78,216,0.2)' : ''};
      display: flex; align-items: center; justify-content: center;
      ${pulse ? 'animation: pulse 2s infinite;' : ''}
      transition: all 0.2s;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function ProfessionalMarker({ professional, onClick, isSelected }) {
  if (!professional.latitude || !professional.longitude) return null;

  const icon = createCustomIcon(professional.is_available, professional.is_premium, isSelected);

  return (
    <Marker
      position={[professional.latitude, professional.longitude]}
      icon={icon}
      eventHandlers={{ click: () => onClick(professional) }}
    >
      <Popup className="professional-popup">
        <div className="p-1">
          <p className="font-semibold text-sm">{professional.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs">{professional.rating_avg?.toFixed(1) || '0.0'}</span>
          </div>
          {professional.is_available && (
            <span className="text-[10px] text-green-600 font-medium">● Disponível agora</span>
          )}
        </div>
      </Popup>
    </Marker>
  );
}