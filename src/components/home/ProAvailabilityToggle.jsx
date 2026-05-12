import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MapPin, Loader2 } from 'lucide-react';

export default function ProAvailabilityToggle({ professional }) {
  const [loading, setLoading] = useState(false);
  const [localIsOn, setLocalIsOn] = useState(professional?.is_available ?? false);
  const queryClient = useQueryClient();

  // Sync with prop changes (e.g. after refetch)
  useEffect(() => {
    if (!loading) {
      setLocalIsOn(professional?.is_available ?? false);
    }
  }, [professional?.is_available]);

  if (!professional) return null;

  const toggle = async () => {
    if (loading) return;
    const newValue = !localIsOn;
    setLocalIsOn(newValue); // optimistic
    setLoading(true);

    try {
      if (newValue && navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              await base44.entities.Professional.update(professional.id, {
                is_available: true,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
              resolve();
            },
            async () => {
              await base44.entities.Professional.update(professional.id, { is_available: true });
              resolve();
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        });
        toast.success('Você está online! Clientes podem te encontrar.');
      } else {
        await base44.entities.Professional.update(professional.id, { is_available: false });
        toast('Você está offline.');
      }
      queryClient.invalidateQueries({ queryKey: ['my-pro'] });
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      queryClient.invalidateQueries({ queryKey: ['my-pro-dashboard'] });
    } catch {
      // revert on error
      setLocalIsOn(!newValue);
      toast.error('Erro ao atualizar disponibilidade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-80 select-none"
      style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderRadius: 20,
        padding: '10px 14px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06), 0 8px 28px rgba(0,0,0,0.10)',
        minWidth: 148,
      }}
    >
      {/* Status dot */}
      <div className="relative shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300"
          style={{ background: localIsOn ? '#dcfce7' : '#f1f5f9' }}
        >
          <MapPin className={`w-4 h-4 ${localIsOn ? 'text-green-600' : 'text-slate-400'}`} />
        </div>
        {localIsOn && !loading && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 text-left">
        <p className="text-xs font-bold text-foreground leading-tight">
          {loading ? 'Atualizando...' : localIsOn ? 'Online' : 'Offline'}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
          {localIsOn ? 'Visível no mapa' : 'Toque para ficar online'}
        </p>
      </div>

      {/* Toggle pill */}
      <div className="shrink-0">
        {loading ? (
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
        ) : (
          <div
            className="relative transition-colors duration-200"
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: localIsOn ? '#22c55e' : '#d1d5db',
            }}
          >
            <div
              className="absolute top-1 rounded-full bg-white shadow"
              style={{
                width: 14,
                height: 14,
                left: localIsOn ? 18 : 3,
                transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>
        )}
      </div>
    </button>
  );
}