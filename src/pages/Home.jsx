import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LocateFixed, MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from '../components/map/MapView';
import CategoryFilter from '../components/home/CategoryFilter';
import ProfessionalCard from '../components/home/ProfessionalCard';
import ProfessionalSheet from '../components/home/ProfessionalSheet';
import EtaOverlay from '../components/map/EtaOverlay';
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
  const [otherCategoryText, setOtherCategoryText] = useState('');
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
      <div className="absolute top-0 left-0 right-0 z-10 px-3 pt-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl overflow-hidden"
        >
          {/* Location bar */}
          <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              userLocation ? 'bg-blue-600' : 'bg-foreground'
            }`}>
              {userLocation
                ? <LocateFixed className="w-2.5 h-2.5 text-white" />
                : <MapPin className="w-2.5 h-2.5 text-white" />
              }
            </div>
            <p className="text-[11px] font-medium text-foreground flex-1 truncate">
              {userLocation ? `GPS ativo · ${radiusKm}km` : locationError ? 'GPS negado' : 'Obtendo GPS...'}
            </p>
            {userLocation && (
              <div className="flex gap-1">
                {[1, 5, 10, 25].map(km => (
                  <button
                    key={km}
                    onClick={() => setRadiusKm(km)}
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-all ${
                      radiusKm === km
                        ? 'bg-foreground text-white'
                        : 'bg-white/60 text-muted-foreground border border-border'
                    }`}
                  >
                    {km}km
                  </button>
                ))}
              </div>
            )}
            <div className="bg-green-500/15 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-200 shrink-0">
              {availableWithDist.length} online
            </div>
          </div>

          {/* Categories */}
          <div className="border-t border-white/40">
            <CategoryFilter
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              otherText={otherCategoryText}
              onOtherText={setOtherCategoryText}
            />
          </div>
        </motion.div>
      </div>

      {/* ETA Overlay (estilo Uber) */}
      {eta && mapSelectedPro && (
        <EtaOverlay
          eta={eta}
          professional={mapSelectedPro}
          onClose={() => { setEta(null); setMapSelectedPro(null); }}
        />
      )}

      {/* Bottom professionals panel */}
      <div className="absolute bottom-24 left-0 right-0 z-10 px-3">
        {/* Collapsed pill — always visible */}
        <button
          onClick={() => setListExpanded(!listExpanded)}
          className="w-full glass-strong rounded-2xl flex items-center justify-between px-4 py-3 active:scale-[0.98] transition-all"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-bold text-foreground">
              {availableWithDist.length} disponíveis{userLocation ? ` · ${radiusKm}km` : ''}
            </span>
          </div>
          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100">
            {listExpanded
              ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            }
          </div>
        </button>

        {/* Expanded list */}
        <AnimatePresence>
          {listExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="overflow-hidden mt-2"
            >
              <div className="glass-strong rounded-2xl overflow-hidden max-h-[45vh] overflow-y-auto px-3 pb-3 pt-2 space-y-2">
                {availableWithDist.length > 0 ? availableWithDist.map(pro => (
                  <ProfessionalCard
                    key={pro.id}
                    professional={pro}
                    onClick={(p) => { handleSelectPro(p); setListExpanded(false); }}
                    distance={pro._dist ? formatDistance(pro._dist) : null}
                  />
                )) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      {userLocation ? `Nenhum profissional em ${radiusKm}km` : 'Nenhum profissional disponível'}
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProfessionalSheet
        professional={selectedPro}
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSelectedPro(null); }}
      />
    </div>
  );
}