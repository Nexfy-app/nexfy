import React, { useState } from 'react';
import { Zap, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * Compact floating Turbo Serfy prompt on the map — for professionals who haven't activated yet.
 * Dismissed per session.
 */
export default function ProTurboFloating({ professional, turboActive }) {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!professional || turboActive || dismissed) return null;

  const handleActivate = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('turboCheckout', {
        action: 'create_checkout',
        professional_id: professional.id,
      });
      if (res.data?.url) window.location.href = res.data.url;
      else toast.error('Erro ao iniciar checkout.');
    } catch {
      toast.error('Erro ao conectar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
        maxWidth: 260,
      }}
    >
      <div className="w-7 h-7 rounded-xl bg-black flex items-center justify-center shrink-0">
        <Zap className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-foreground leading-tight">Ative o Turbo Serfy</p>
        <p className="text-[10px] text-muted-foreground leading-tight">Apareça primeiro no mapa</p>
      </div>
      <button
        onClick={handleActivate}
        disabled={loading}
        className="text-[10px] font-bold text-white bg-black rounded-lg px-2.5 py-1.5 shrink-0 hover:bg-black/80 transition disabled:opacity-60"
      >
        {loading ? '...' : 'Ativar'}
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 transition shrink-0"
      >
        <X className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
}