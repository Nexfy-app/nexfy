import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { SANTA_MARIA_CENTER } from '@/lib/constants';
import ProfessionalMarker from './ProfessionalMarker';
import UserLocationMarker from './UserLocationMarker';
import RouteOverlay from './RouteOverlay';
import MapController from './MapController';
import LocateMeButton from './LocateMeButton';
import 'leaflet/dist/leaflet.css';

export default function MapView({
  professionals,
  onMarkerClick,
  userLocation,
  radiusKm = 5,
  selectedPro,
  onEta,
}) {
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [SANTA_MARIA_CENTER.lat, SANTA_MARIA_CENTER.lng];

  const routeFrom = userLocation && isFinite(userLocation.lat) && isFinite(userLocation.lng)
    ? [userLocation.lat, userLocation.lng]
    : null;
  const routeTo = selectedPro?.latitude && selectedPro?.longitude && isFinite(selectedPro.latitude) && isFinite(selectedPro.longitude)
    ? [selectedPro.latitude, selectedPro.longitude]
    : null;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={14}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <MapController center={center} zoom={14} fly />

        <UserLocationMarker location={userLocation} radiusKm={radiusKm} />

        {professionals?.map((pro) => (
          <ProfessionalMarker
            key={pro.id}
            professional={pro}
            onClick={onMarkerClick}
            isSelected={selectedPro?.id === pro.id}
          />
        ))}

        {routeFrom && routeTo && (
          <RouteOverlay from={routeFrom} to={routeTo} onEta={onEta} />
        )}

        <LocateMeButton userLocation={userLocation} />
      </MapContainer>
    </div>
  );
}