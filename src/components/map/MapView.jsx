import React, { useState, useRef, useMemo, useEffect } from 'react';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SANTA_MARIA_CENTER } from '@/lib/constants';
import ProfessionalMarker from './ProfessionalMarker';
import UserLocationMarker from './UserLocationMarker';
import RouteOverlay from './RouteOverlay';
import LocateMeButton from './LocateMeButton';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export default function MapView({
  professionals,
  onMarkerClick,
  userLocation,
  mapCenter,
  radiusKm = 5,
  selectedPro,
  onEta,
}) {
  const initialCenter = userLocation || mapCenter || SANTA_MARIA_CENTER;
  const [viewState, setViewState] = useState({
    longitude: initialCenter.lng,
    latitude: initialCenter.lat,
    zoom: 13,
  });

  const hasSetLocationRef = useRef(false);
  React.useEffect(() => {
    if (userLocation && !hasSetLocationRef.current) {
      hasSetLocationRef.current = true;
      setViewState(v => ({ ...v, longitude: userLocation.lng, latitude: userLocation.lat }));
    }
  }, [userLocation]);

  const markers = useMemo(() => (
    professionals?.map(pro => (
      <ProfessionalMarker
        key={pro.id}
        professional={pro}
        onClick={onMarkerClick}
        isSelected={selectedPro?.id === pro.id}
      />
    ))
  ), [professionals, onMarkerClick, selectedPro?.id]);

  const routeFrom = userLocation && isFinite(userLocation.lat) ? [userLocation.lat, userLocation.lng] : null;
  const routeTo = selectedPro?.latitude && isFinite(selectedPro.latitude) ? [selectedPro.latitude, selectedPro.longitude] : null;

  return (
    <div className="relative w-full h-full">
      <Map
        {...viewState}
        onMove={e => setViewState(e.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
      >
        <UserLocationMarker location={userLocation} />
        {markers}
        {routeFrom && routeTo && (
          <RouteOverlay from={routeFrom} to={routeTo} onEta={onEta} />
        )}
      </Map>
      <LocateMeButton
        userLocation={userLocation}
        onLocate={(loc) => setViewState(v => ({ ...v, longitude: loc.lng, latitude: loc.lat, zoom: 16 }))}
      />
    </div>
  );
}