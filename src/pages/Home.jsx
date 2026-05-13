import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LocateFixed, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from '../components/map/MapView';
import CategoryFilter from '../components/home/CategoryFilter';
import ProfessionalSheet from '../components/home/ProfessionalSheet';
import ProListPanel from '../components/home/ProListPanel';

import NotificationCenter from '../components/notifications/NotificationCenter';
import useUserLocation from '../hooks/useUserLocation';
import AppTutorial from '../components/tutorial/AppTutorial';
import { Link } from 'react-router-dom';
import { Briefcase, X } from 'lucide-react';
import ProAvailabilityToggle from '../components/home/ProAvailabilityToggle';

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
  const [myProfessional, setMyProfessional] = useState(null);
  const [turboActive, setTurboActive] = useState(false);
  const [dismissedProBanner, setDismissedProBanner] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [otherCategoryText, setOtherCategoryText] = useState('');
  const [selectedPro, setSelectedPro] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [radiusKm, setRadiusKm] = useState(100);

  const { location: userLocation, error: locationError } = useUserLocation();

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.email) {
        setUserEmail(u.email);
        base44.entities.Professional.filter({ user_email: u.email })
          .then(res => {
            setIsUserPro(res?.length > 0);
            if (res?.length > 0) {
              setMyProfessional(res[0]);
              // check turbo status
              base44.functions.invoke('turboCheckout', { action: 'get_status' })
                .then(r => setTurboActive(r?.data?.active || false))
                .catch(() => {});
            }
          })
          .catch(() => setIsUserPro(false));
      } else {
        setIsUserPro(false);
      }
    }).catch(() => setIsUserPro(false));
  }, []);

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => base44.entities.Professional.filter({ status: 'active' }),
    refetchInterval: 30000,
    staleTime: 20000,
  });

  const categoryFiltered = selectedCategory
    ? professionals.filter(p => p.categories?.includes(selectedCategory))
    : professionals;

  const available = useMemo(() => {
    return categoryFiltered.filter(p => {
      if (!p.is_available) return false;
      if (!p.latitude || !p.longitude) return false;
      if (p.user_email === userEmail) return false;
      return true;
    });
  }, [categoryFiltered, userLocation, radiusKm, userEmail]);

  const availableWithDist = useMemo(() => {
    const sorted = available.map(p => {
      if (!userLocation || !p.latitude || !p.longitude) return { ...p, _dist: null };
      const dist = haversine(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
      return { ...p, _dist: dist };
    }).sort((a, b) => {
      if (a.is_premium && !b.is_premium) return -1;
      if (!a.is_premium && b.is_premium) return 1;
      return (a._dist ?? 999) - (b._dist ?? 999);
    });
    return sorted;
  }, [available, userLocation]);

  const mapCenter = useMemo(() => {
    if (userLocation) return userLocation;
    const withCoords = professionals.filter(p => p.latitude && p.longitude);
    if (withCoords.length === 0) return null;
    const lat = withCoords.reduce((s, p) => s + p.latitude, 0) / withCoords.length;
    const lng = withCoords.reduce((s, p) => s + p.longitude, 0) / withCoords.length;
    return { lat, lng };
  }, [userLocation, professionals]);

  // Rastreia search_impressions para profissionais Turbo visíveis
  const trackedImpressionsRef = React.useRef(new Set());
  React.useEffect(() => {
    availableWithDist.forEach(p => {
      if (p.is_premium && !trackedImpressionsRef.current.has(p.id)) {
        trackedImpressionsRef.current.add(p.id);
        base44.functions.invoke('trackTurboMetrics', { professional_id: p.id, metric: 'search_impression' }).catch(() => {});
      }
    });
  }, [availableWithDist]);

  const handleSelectPro = useCallback((pro) => {
    setSelectedPro({ ...pro, _distFormatted: pro._dist ? formatDistance(pro._dist) : null });
    setSheetOpen(true);
    if (pro.is_premium) {
      base44.functions.invoke('trackTurboMetrics', { professional_id: pro.id, metric: 'profile_view' }).catch(() => {});
    }
  }, []);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <MapView
          professionals={availableWithDist}
          onMarkerClick={handleSelectPro}
          userLocation={userLocation}
          mapCenter={mapCenter}
          radiusKm={radiusKm}
        />
      </div>

      {/* Top glass header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-3 pt-3 flex justify-center">
        <div className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl">
          <div
            style={{
              background: 'rgba(255,255,255,0.90)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              borderRadius: 22,
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.07)',
            }}
          >
            {/* Location bar */}
            <div className="flex items-center gap-2.5 px-3.5 pt-2.5 pb-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'hsl(224 32% 8%)' }}
              >
                {userLocation
                  ? <LocateFixed style={{ width: 11, height: 11, color: 'white' }} />
                  : <MapPin style={{ width: 11, height: 11, color: 'white' }} />
                }
              </div>
              <p className="text-[12px] font-semibold text-foreground flex-1 truncate tracking-tight">
                {userLocation ? 'Localização ativa' : locationError ? 'GPS indisponível' : 'Obtendo localização...'}
              </p>
              <div
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-[10px] font-bold text-green-700">{availableWithDist.length} online</span>
              </div>
              <AppTutorial />
              {userEmail && <NotificationCenter userEmail={userEmail} />}
            </div>

            {/* Categories */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <CategoryFilter
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                professionals={availableWithDist}
              />
            </div>
          </div>
        </div>
      </div>



      {/* Banner: cadastrar como profissional */}
      <AnimatePresence>
        {userEmail && isUserPro === false && !dismissedProBanner && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-0 right-0 z-50 px-3 flex justify-center"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 164px)' }}
          >
            <div className="w-full max-w-lg">
              <div
                className="flex items-center gap-3 px-4 py-3.5 rounded-[22px]"
                style={{
                  background: 'rgba(255,255,255,0.97)',
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'hsl(224 32% 8%)' }}
                >
                  <Briefcase style={{ width: 16, height: 16, color: 'white' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-foreground leading-tight tracking-tight">Você é profissional?</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">Apareça no mapa para clientes próximos.</p>
                </div>
                <Link
                  to="/professional/edit"
                  className="shrink-0 text-white text-[12px] font-bold px-4 py-2 rounded-full transition active:scale-95"
                  style={{ background: 'hsl(224 32% 8%)', letterSpacing: '-0.01em' }}
                >
                  Cadastrar
                </Link>
                <button
                  onClick={() => setDismissedProBanner(true)}
                  className="w-7 h-7 flex items-center justify-center rounded-full transition shrink-0"
                  style={{ background: 'rgba(0,0,0,0.05)' }}
                >
                  <X style={{ width: 13, height: 13, color: '#94a3b8' }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Availability toggle flutuante no mapa — apenas para profissionais */}
      {myProfessional && (
        <div
          className="absolute z-20 left-3"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 164px)' }}
        >
          <ProAvailabilityToggle professional={myProfessional} />
        </div>
      )}

      {/* Nova lista de profissionais */}
      <ProListPanel
        professionals={availableWithDist}
        onSelect={handleSelectPro}
        selectedId={selectedPro?.id}
      />

      <ProfessionalSheet
        professional={selectedPro}
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSelectedPro(null); }}
      />
    </div>
  );
}