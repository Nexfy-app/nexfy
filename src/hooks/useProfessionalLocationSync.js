import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

const APP_ID = import.meta.env.VITE_APP_ID;

const SYNC_INTERVAL_MS = 60 * 1000;        // atualiza localização a cada 1 min
const AUTO_OFFLINE_MS = 2 * 60 * 60 * 1000; // desativa online após 2h
const WARN_BEFORE_MS = 15 * 60 * 1000;      // avisa 15 min antes

export default function useProfessionalLocationSync(professional, onAutoOffline) {
  const intervalRef = useRef(null);
  const offlineTimerRef = useRef(null);
  const warnTimerRef = useRef(null);
  const [minutesLeft, setMinutesLeft] = useState(null); // null = sem aviso ativo

  useEffect(() => {
    // Limpa tudo se ficar offline ou sem professional
    if (!professional?.id || !professional?.is_available) {
      clearInterval(intervalRef.current);
      clearTimeout(offlineTimerRef.current);
      clearTimeout(warnTimerRef.current);
      setMinutesLeft(null);
      return;
    }

    // Atualiza localização
    const updateLocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          base44.entities.Professional.update(professional.id, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    };

    updateLocation();
    intervalRef.current = setInterval(updateLocation, SYNC_INTERVAL_MS);

    // Aviso 15 min antes de desativar
    warnTimerRef.current = setTimeout(() => {
      setMinutesLeft(15);
    }, AUTO_OFFLINE_MS - WARN_BEFORE_MS);

    // Auto-desativar após 2h
    offlineTimerRef.current = setTimeout(async () => {
      await base44.entities.Professional.update(professional.id, { is_available: false }).catch(() => {});
      setMinutesLeft(null);
      if (onAutoOffline) onAutoOffline();
    }, AUTO_OFFLINE_MS);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(offlineTimerRef.current);
      clearTimeout(warnTimerRef.current);
      setMinutesLeft(null);
    };
  }, [professional?.id, professional?.is_available]);

  // Marca offline ao fechar/recarregar a página
  useEffect(() => {
    if (!professional?.id || !professional?.is_available) return;

    const handleBeforeUnload = () => {
      const url = `https://api.base44.com/api/apps/${APP_ID}/functions/setOffline`;
      const data = JSON.stringify({ professional_id: professional.id });
      navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [professional?.id, professional?.is_available]);

  return { minutesLeft };
}