import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

const APP_ID = import.meta.env.VITE_APP_ID;

const AUTO_OFFLINE_MS = 2 * 60 * 60 * 1000; // desativa online após 2h
const WARN_BEFORE_MS = 15 * 60 * 1000;      // avisa 15 min antes

export default function useProfessionalLocationSync(professional, onAutoOffline) {
  const watcherRef = useRef(null);
  const offlineTimerRef = useRef(null);
  const warnTimerRef = useRef(null);
  const [minutesLeft, setMinutesLeft] = useState(null);

  useEffect(() => {
    // Para tudo se ficar offline ou sem professional
    if (!professional?.id || !professional?.is_available) {
      if (watcherRef.current !== null) {
        navigator.geolocation?.clearWatch(watcherRef.current);
        watcherRef.current = null;
      }
      clearTimeout(offlineTimerRef.current);
      clearTimeout(warnTimerRef.current);
      setMinutesLeft(null);
      return;
    }

    // watchPosition — atualiza automaticamente sempre que o usuário se move
    if (navigator.geolocation) {
      watcherRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          base44.entities.Professional.update(professional.id, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

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
      if (watcherRef.current !== null) {
        navigator.geolocation?.clearWatch(watcherRef.current);
        watcherRef.current = null;
      }
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