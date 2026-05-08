import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const APP_ID = import.meta.env.VITE_APP_ID;

export default function useProfessionalLocationSync(professional) {
  const watcherRef = useRef(null);

  useEffect(() => {
    // Para tudo se ficar offline ou sem professional
    if (!professional?.id || !professional?.is_available) {
      if (watcherRef.current !== null) {
        navigator.geolocation?.clearWatch(watcherRef.current);
        watcherRef.current = null;
      }

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

    return () => {
      if (watcherRef.current !== null) {
        navigator.geolocation?.clearWatch(watcherRef.current);
        watcherRef.current = null;
      }
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

  return {};
}