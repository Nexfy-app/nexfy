import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const SYNC_INTERVAL_MS = 60 * 1000; // atualiza a cada 1 minuto

export default function useProfessionalLocationSync(professional) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!professional?.id || !professional?.is_available) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const updateLocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          base44.entities.Professional.update(professional.id, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }).catch(() => {});
        },
        () => {}, // falha silenciosa
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    };

    // Atualiza imediatamente ao montar
    updateLocation();

    // E depois a cada 1 minuto
    intervalRef.current = setInterval(updateLocation, SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [professional?.id, professional?.is_available]);
}