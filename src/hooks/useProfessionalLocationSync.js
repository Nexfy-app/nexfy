import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';


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



  return {};
}