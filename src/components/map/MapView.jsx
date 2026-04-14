import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { SANTA_MARIA_CENTER } from '@/lib/constants';
import ProfessionalMarker from './ProfessionalMarker';
import 'leaflet/dist/leaflet.css';

export default function MapView({ professionals, onMarkerClick, center, zoom }) {
  return (
    <MapContainer
      center={center || [SANTA_MARIA_CENTER.lat, SANTA_MARIA_CENTER.lng]}
      zoom={zoom || 14}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {professionals?.map((pro) => (
        <ProfessionalMarker
          key={pro.id}
          professional={pro}
          onClick={onMarkerClick}
        />
      ))}
    </MapContainer>
  );
}