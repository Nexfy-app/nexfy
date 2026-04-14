import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, ChevronUp, ChevronDown, LocateFixed, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from '../components/map/MapView';
import CategoryFilter from '../components/home/CategoryFilter';
import ProfessionalCard from '../components/home/ProfessionalCard';
import ProfessionalSheet from '../components/home/ProfessionalSheet';
import RadiusControl from '../components/home/RadiusControl';
import EtaCard from '../components/home/EtaCard';
import useUserLocation from '../hooks/useUserLocation';

// Haversine distance in km
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

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPro, setSelectedPro] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [eta, setEta] = useState(null);
  const [mapSelectedPro, setMapSelectedPro] = useState(null); // pro selected on map for ETA

  const { location: userLocation, error: locationError } = useUserLocation();

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => base44.entities.Professional.filter({ status: 'active' }),
    refetchInterval: 15000,
  });

  // Filter by category
  const categoryFiltered = selectedCategory
    ? professionals.filter(p => p.categories?.includes(selectedCategory))
    : professionals;

  // Filter available + within radius (only if user has location)
  const available = useMemo(() => {
    return categoryFiltered.filter(p => {
      if (!p.is_available) return false;
      if (!userLocation || !p.latitude || !p.longitude) return true;
      const dist = haversine(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
      return dist <= radiusKm;
    });
  }, [categoryFiltered, userLocation, radiusKm]);

  // Add distance info to each pro
  const availableWithDist = useMemo(() => {
    return available.map(p => {
      if (!userLocation || !p.latitude || !p.longitude) return { ...p, _dist: null };
      const dist = haversine(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
      return { ...p, _dist: dist };
    }).sort((a, b) => (a._dist ?? 999) - (b._dist ?? 999));
  }, [available, userLocation]);

  const handleMarkerClick = (pro) => {
    setMapSelectedPro(pro);
    setEta(null);
    setSelectedPro(pro);
    setSheetOpen(true);
  };

  const handleCardClick = (pro) => {
    setMapSelectedPro(pro);
    setEta(null);
    setSelectedPro(pro);
    setSheetOpen(true);
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-safe">
        <div className="px-4 pt-3 pb-2">
          <div className="bg-card rounded-2xl shadow-lg border">
            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${userLocation ? 'bg-blue-600' : 'bg-foreground'}`}>
                {userLocation
                  ? <LocateFixed className="w-3.5 h-3.5 text-white" />
                  : <MapPin className="w-3.5 h-3.5 text-background" />
                }
              </div>
              <div className="flex-1">
                {userLocation ? (
                  <>
                    <p className="text-sm font-bold leading-none">Sua localização</p>
                    <p className="text-[10px] text-muted-foreground">GPS ativo · {availableWithDist.length} no raio</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold leading-none">Santa Maria, RS</p>
                    <p className="text-[10px] text-muted-foreground">
                      {locationError ? 'Localização negada' : 'Obtendo localização...'}
                    </p>
                  </>
                )}
              </div>
              <span className="text-[10px] font-bold bg-foreground text-background px-2.5 py-1 rounded-full">
                {availableWithDist.length} online
              </span>
            </div>

            {/* Radius control — only when GPS is active */}
            {userLocation && (
              <div className="px-3 pb-2">
                <RadiusControl radiusKm={radiusKm} onChange={setRadiusKm} />
              </div>
            )}

            <div className="border-t">
              <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapView
          professionals={availableWithDist}
          onMarkerClick={handleMarkerClick}
          userLocation={userLocation}
          radiusKm={radiusKm}
          selectedPro={mapSelectedPro}
          onEta={setEta}
        />
      </div>

      {/* ETA Card — appears when a pro with location is selected */}
      {eta && mapSelectedPro && (
        <div className="absolute bottom-64 left-4 right-4 z-20">
          <EtaCard
            eta={eta}
            professionalName={mapSelectedPro.name}
            onClose={() => { setEta(null); setMapSelectedPro(null); }}
          />
        </div>
      )}

      {/* Bottom List Panel */}
      <motion.div
        className="absolute bottom-20 left-0 right-0 z-10"
        animate={{ height: listExpanded ? '50vh' : 'auto' }}
      >
        <div className="bg-card rounded-t-3xl shadow-2xl border-t mx-2">
          <button
            onClick={() => setListExpanded(!listExpanded)}
            className="w-full flex items-center justify-center pt-3 pb-1"
          >
            <div className="w-12 h-1.5 bg-border rounded-full" />
          </button>

          <div className="px-4 pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">
              {availableWithDist.length} disponíveis
              {userLocation ? ` em ${radiusKm}km` : ' agora'}
            </h2>
            <button onClick={() => setListExpanded(!listExpanded)} className="text-muted-foreground">
              {listExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          <div className={`overflow-y-auto px-4 pb-4 space-y-2 ${listExpanded ? 'max-h-[40vh]' : 'max-h-40'}`}>
            <AnimatePresence>
              {availableWithDist.length > 0 ? availableWithDist.map(pro => (
                <ProfessionalCard
                  key={pro.id}
                  professional={pro}
                  onClick={handleCardClick}
                  distance={pro._dist ? formatDistance(pro._dist) : null}
                />
              )) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    {userLocation
                      ? `Nenhum profissional disponível em ${radiusKm}km`
                      : 'Nenhum profissional disponível no momento'}
                  </p>
                  {userLocation && (
                    <button
                      onClick={() => setRadiusKm(r => Math.min(r * 2, 50))}
                      className="text-xs font-semibold mt-2 underline"
                    >
                      Ampliar raio para {Math.min(radiusKm * 2, 50)}km
                    </button>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <ProfessionalSheet
        professional={selectedPro}
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSelectedPro(null); }}
      />
    </div>
  );
}