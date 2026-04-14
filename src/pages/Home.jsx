import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LocateFixed, MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from '../components/map/MapView';
import CategoryFilter from '../components/home/CategoryFilter';
import ProfessionalCard from '../components/home/ProfessionalCard';
import ProfessionalSheet from '../components/home/ProfessionalSheet';
import RadiusControl from '../components/home/RadiusControl';
import EtaCard from '../components/home/EtaCard';
import useUserLocation from '../hooks/useUserLocation';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPro, setSelectedPro] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [eta, setEta] = useState(null);
  const [mapSelectedPro, setMapSelectedPro] = useState(null);

  const { location: userLocation, error: locationError } = useUserLocation();

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => base44.entities.Professional.filter({ status: 'active' }),
    refetchInterval: 15000,
  });

  const categoryFiltered = selectedCategory
    ? professionals.filter(p => p.categories?.includes(selectedCategory))
    : professionals;

  const available = useMemo(() => {
    return categoryFiltered.filter(p => {
      if (!p.is_available) return false;
      if (!userLocation || !p.latitude || !p.longitude) return true;
      return haversine(userLocation.lat, userLocation.lng, p.latitude, p.longitude) <= radiusKm;
    });
  }, [categoryFiltered, userLocation, radiusKm]);

  const availableWithDist = useMemo(() => {
    return available.map(p => {
      if (!userLocation || !p.latitude || !p.longitude) return { ...p, _dist: null };
      const dist = haversine(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
      return { ...p, _dist: dist };
    }).sort((a, b) => (a._dist ?? 999) - (b._dist ?? 999));
  }, [available, userLocation]);

  const handleSelectPro = (pro) => {
    setMapSelectedPro(pro);
    setEta(null);
    setSelectedPro(pro);
    setSheetOpen(true);
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <MapView
          professionals={availableWithDist}
          onMarkerClick={handleSelectPro}
          userLocation={userLocation}
          radiusKm={radiusKm}
          selectedPro={mapSelectedPro}
          onEta={setEta}
        />
      </div>

      {/* Top glass header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl overflow-hidden"
        >
          {/* Location bar */}
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
              userLocation ? 'bg-blue-600' : 'bg-foreground'
            }`}>
              {userLocation
                ? <LocateFixed className="w-4 h-4 text-white" />
                : <MapPin className="w-4 h-4 text-white" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-none">
                {userLocation ? 'Sua localização' : 'Santa Maria, RS'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {userLocation
                  ? `GPS ativo · ${availableWithDist.length} profissional${availableWithDist.length !== 1 ? 'is' : ''} no raio`
                  : locationError ? 'Localização negada' : 'Obtendo GPS...'
                }
              </p>
            </div>
            <div className="bg-green-500/15 text-green-700 text-[11px] font-bold px-3 py-1 rounded-full border border-green-200">
              {availableWithDist.length} online
            </div>
          </div>

          {/* Radius control */}
          {userLocation && (
            <div className="px-4 pb-2.5">
              <RadiusControl radiusKm={radiusKm} onChange={setRadiusKm} />
            </div>
          )}

          {/* Categories */}
          <div className="border-t border-white/50">
            <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>
        </motion.div>
      </div>

      {/* ETA Card */}
      <AnimatePresence>
        {eta && mapSelectedPro && (
          <div className="absolute z-20 left-4 right-4" style={{ bottom: listExpanded ? 'calc(50vh + 12px)' : '220px' }}>
            <EtaCard
              eta={eta}
              professionalName={mapSelectedPro.name}
              onClose={() => { setEta(null); setMapSelectedPro(null); }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Bottom professionals panel */}
      <motion.div
        className="absolute bottom-24 left-0 right-0 z-10 px-3"
        animate={{ height: listExpanded ? '50vh' : 'auto' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="glass-strong rounded-2xl overflow-hidden">
          {/* Handle + header */}
          <button
            onClick={() => setListExpanded(!listExpanded)}
            className="w-full flex flex-col items-center pt-2.5 pb-1 active:bg-slate-50/50 transition"
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mb-2" />
            <div className="w-full px-4 flex items-center justify-between pb-1">
              <div>
                <h2 className="text-sm font-bold text-foreground text-left">
                  {availableWithDist.length} disponíveis{userLocation ? ` em ${radiusKm}km` : ' agora'}
                </h2>
              </div>
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100">
                {listExpanded
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  : <ChevronUp className="w-4 h-4 text-muted-foreground" />
                }
              </div>
            </div>
          </button>

          {/* List */}
          <div className={`overflow-y-auto px-3 pb-3 space-y-2 ${listExpanded ? 'max-h-[calc(50vh-80px)]' : 'max-h-[136px]'}`}>
            <AnimatePresence>
              {availableWithDist.length > 0 ? availableWithDist.map(pro => (
                <ProfessionalCard
                  key={pro.id}
                  professional={pro}
                  onClick={handleSelectPro}
                  distance={pro._dist ? formatDistance(pro._dist) : null}
                />
              )) : (
                <div className="text-center py-5">
                  <p className="text-sm text-muted-foreground">
                    {userLocation
                      ? `Nenhum profissional em ${radiusKm}km`
                      : 'Nenhum profissional disponível'}
                  </p>
                  {userLocation && (
                    <button
                      onClick={() => setRadiusKm(r => Math.min(r * 2, 50))}
                      className="text-xs font-semibold mt-1.5 text-blue-600 underline"
                    >
                      Ampliar para {Math.min(radiusKm * 2, 50)}km
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