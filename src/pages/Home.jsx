import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LocateFixed, MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from '../components/map/MapView';
import CategoryFilter from '../components/home/CategoryFilter';
import ProfessionalCard from '../components/home/ProfessionalCard';
import ProfessionalSheet from '../components/home/ProfessionalSheet';

import NotificationCenter from '../components/notifications/NotificationCenter';
import useUserLocation from '../hooks/useUserLocation';
import AppTutorial from '../components/tutorial/AppTutorial';
import { Link } from 'react-router-dom';
import { Briefcase, X } from 'lucide-react';

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
  const [userEmail, setUserEmail] = useState(null);
  const [isUserPro, setIsUserPro] = useState(null); // null = loading
  const [dismissedProBanner, setDismissedProBanner] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [otherCategoryText, setOtherCategoryText] = useState('');
  const [selectedPro, setSelectedPro] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);

  const { location: userLocation, error: locationError } = useUserLocation();

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.email) {
        setUserEmail(u.email);
        base44.entities.Professional.filter({ user_email: u.email })
          .then(res => setIsUserPro(res?.length > 0))
          .catch(() => setIsUserPro(false));
      } else {
        setIsUserPro(false);
      }
    }).catch(() => setIsUserPro(false));
  }, []);

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
      if (!p.latitude || !p.longitude) return false;
      if (p.user_email === userEmail) return false;
      if (!userLocation) return true;
      return haversine(userLocation.lat, userLocation.lng, p.latitude, p.longitude) <= radiusKm;
    });
  }, [categoryFiltered, userLocation, radiusKm, userEmail]);

  const availableWithDist = useMemo(() => {
    return available.map(p => {
      if (!userLocation || !p.latitude || !p.longitude) return { ...p, _dist: null };
      const dist = haversine(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
      return { ...p, _dist: dist };
    }).sort((a, b) => (a._dist ?? 999) - (b._dist ?? 999));
  }, [available, userLocation]);

  const handleSelectPro = (pro) => {
    setSelectedPro({ ...pro, _distFormatted: pro._dist ? formatDistance(pro._dist) : null });
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
        />
      </div>

      {/* Top glass header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-3 pt-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl"
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
              {userLocation ? 'GPS ativo' : locationError ? 'GPS negado' : 'Obtendo GPS...'}
            </p>
            <div className="bg-green-500/15 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-200 shrink-0">
              {availableWithDist.length} online
            </div>
            <AppTutorial />
            {userEmail && <NotificationCenter userEmail={userEmail} />}
          </div>

          {/* Categories */}
          <div className="border-t border-white/40">
            <CategoryFilter
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              professionals={availableWithDist}
            />
          </div>
        </motion.div>
      </div>



      {/* Área inferior fixa — empilhada acima da BottomNav */}
      <div
        className="fixed left-0 right-0 z-50 px-3 flex flex-col gap-8"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
      >
        {/* Banner: cadastrar como profissional */}
        <AnimatePresence>
          {userEmail && isUserPro === false && !dismissedProBanner && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-3" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
                <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground leading-tight">Você é um profissional?</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">Cadastre-se e apareça no mapa para clientes próximos.</p>
                </div>
                <Link
                  to="/professional/edit"
                  className="shrink-0 bg-foreground text-white text-[11px] font-bold px-3 py-1.5 rounded-xl hover:opacity-80 transition"
                >
                  Cadastrar
                </Link>
                <button
                  onClick={() => setDismissedProBanner(true)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 transition shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Painel de profissionais disponíveis */}
        <AnimatePresence>
          {availableWithDist.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {/* Collapsed pill */}
              {!listExpanded && (
                <button
                  onClick={() => setListExpanded(true)}
                  className="w-full glass-strong rounded-2xl flex items-center justify-between px-3 py-2 active:scale-[0.98] transition-all"
                  style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-foreground">
                      {availableWithDist.length} profissional{availableWithDist.length > 1 ? 'is' : ''} próximo{availableWithDist.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}

              {/* Expanded list */}
              <AnimatePresence>
                {listExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-strong rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-white/40">
                        <span className="text-xs font-bold text-foreground">
                          {availableWithDist.length} disponíveis próximos
                        </span>
                        <button onClick={() => setListExpanded(false)} className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition">
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                      <div className="max-h-[40vh] overflow-y-auto px-3 pb-3 pt-2 space-y-2">
                        {availableWithDist.map(pro => (
                          <ProfessionalCard
                            key={pro.id}
                            professional={pro}
                            onClick={(p) => { handleSelectPro(p); setListExpanded(false); }}
                            distance={pro._dist ? formatDistance(pro._dist) : null}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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