import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Minimal Apple-style availability toggle for professionals on the map.
 * Shows only when the user has a professional profile.
 */
export default function ProAvailabilityToggle({ professional }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  if (!professional) return null;

  const isOn = professional.is_available;

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    const newValue = !isOn;

    if (newValue && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await base44.entities.Professional.update(professional.id, {
            is_available: true,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          queryClient.invalidateQueries({ queryKey: ['my-pro'] });
          queryClient.invalidateQueries({ queryKey: ['professionals'] });
          toast.success('Você está online!');
          setLoading(false);
        },
        async () => {
          await base44.entities.Professional.update(professional.id, { is_available: true });
          queryClient.invalidateQueries({ queryKey: ['my-pro'] });
          queryClient.invalidateQueries({ queryKey: ['professionals'] });
          toast.success('Online (GPS negado)');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      await base44.entities.Professional.update(professional.id, { is_available: false });
      queryClient.invalidateQueries({ queryKey: ['my-pro'] });
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-2 px-3 h-8 rounded-full transition-all active:scale-95 disabled:opacity-70"
      style={{
        background: isOn ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
      }}
      aria-label="Disponibilidade"
    >
      {/* iOS-style switch pill */}
      <div
        className="relative flex-shrink-0 transition-colors duration-200"
        style={{
          width: 28,
          height: 16,
          borderRadius: 8,
          background: loading ? '#94a3b8' : isOn ? '#22c55e' : '#d1d5db',
          transition: 'background 0.2s',
        }}
      >
        <div
          className="absolute top-0.5 rounded-full bg-white shadow-sm"
          style={{
            width: 12,
            height: 12,
            left: isOn ? 14 : 2,
            transition: 'left 0.18s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
      <span className="text-[11px] font-semibold text-foreground leading-none">
        {isOn ? 'Online' : 'Offline'}
      </span>
    </button>
  );
}