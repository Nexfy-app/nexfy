import React, { useMemo } from 'react';
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
  mapCenter,
  radiusKm = 5,
  selectedPro,
  onEta,
}) {
  const centerSource = userLocation || mapCenter;
  const center = useMemo(() => {
    if (centerSource) return [centerSource.lat, centerSource.lng];
    return [SANTA_MARIA_CENTER.lat, SANTA_MARIA_CENTER.lng];
  }, [centerSource?.lat, centerSource?.lng]);

  const routeFrom = userLocation && isFinite(userLocation.lat) && isFinite(userLocation.lng)
    ? [userLocation.lat, userLocation.lng]
    : null;
  const routeTo = selectedPro?.latitude && selectedPro?.longitude && isFinite(selectedPro.latitude) && isFinite(selectedPro.longitude)
    ? [selectedPro.latitude, selectedPro.longitude]
    : null;

  const markers = useMemo(() => (
    professionals?.map((pro) => (
      <ProfessionalMarker
        key={pro.id}
        professional={pro}
        onClick={onMarkerClick}
        isSelected={selectedPro?.id === pro.id}
      />
    ))
  ), [professionals, onMarkerClick, selectedPro?.id]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={14}
        className="w-full h-full"
        zoomControl={false}
        preferCanvas={true}
      >
        <TileLayer
          attribution=''
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={18}
          keepBuffer={2}
          updateWhenIdle={true}
          updateWhenZooming={false}
        />

        <MapController center={center} zoom={14} />

        <UserLocationMarker location={userLocation} radiusKm={radiusKm} />

        {markers}

        {routeFrom && routeTo && (
          <RouteOverlay from={routeFrom} to={routeTo} onEta={onEta} />
        )}

        <LocateMeButton userLocation={userLocation} />
      </MapContainer>
    </div>
  );
}