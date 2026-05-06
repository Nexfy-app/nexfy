import React, { useState } from 'react';
import { Zap, TrendingUp, Users, Star, BarChart2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TurboNexfyCard({ professional, subscription, active: activeProp, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isActive = activeProp || (subscription && (subscription.status === 'active' || subscription.status === 'trial' || subscription.status === 'cancelled'));
  const periodEnd = subscription?.current_period_end
    ? format(new Date(subscription.current_period_end), "dd 'de' MMMM", { locale: ptBR })
    : null;

  const handleActivate = async () => {
    if (!professional?.id) return;
    setLoading(true);
    const res = await base44.functions.invoke('turboCheckout', {
      action: 'create_checkout',
      professional_id: professional.id,
    });
    setLoading(false);
    if (res?.data?.url) window.location.href = res.data.url;
  };

  const handleCancel = async () => {
    if (!subscription?.stripe_subscription_id) return;
    setCancelling(true);
    setShowConfirm(false);
    const res = await base44.functions.invoke('turboCheckout', {
      action: 'cancel',
      subscription_id: subscription.stripe_subscription_id,
    });
    setCancelling(false);
    if (res?.data?.cancelled) {
      toast.success('Assinatura cancelada.');
      onRefresh?.();
    } else {
      toast.error('Erro ao cancelar. Tente novamente.');
    }
  };

  // ── ACTIVE ──
  if (isActive) {
    return (
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 100%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.28)'
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />

        <div className="px-4 pt-4 pb-3 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Zap className="w-4 h-4" style={{ color: '#e2e8f0' }} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#f1f5f9', letterSpacing: '-0.01em' }}>Turbo Nexfy</p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {subscription.plan === 'weekly' ? 'Plano Semanal' : 'Plano Mensal'}
                  {periodEnd ? ` · renova ${periodEnd}` : ''}
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
              <span className="text-[10px] font-semibold" style={{ color: '#e2e8f0', letterSpacing: '0.02em' }}>
                {subscription.status === 'trial' ? 'Trial' : 'Ativo'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-medium mb-1" style={{ color: 'rgba(255,255,255,0.32)' }}>Visualizações</p>
              <p className="text-xl font-bold" style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}>{subscription.profile_views || 0}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-medium mb-1" style={{ color: 'rgba(255,255,255,0.32)' }}>Impressões</p>
              <p className="text-xl font-bold" style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}>{subscription.search_impressions || 0}</p>
            </div>
          </div>

          <p className="text-[11px] flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
            <TrendingUp className="w-3 h-3" />
            Perfil em destaque nas buscas
          </p>
        </div>

        <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {subscription.status === 'cancelled' ? (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</span>
              <div>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Assinatura cancelada</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>Benefícios removidos</p>
              </div>
            </div>
          ) : showConfirm ? (
            <div className="space-y-2">
              <p className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>Cancelamento imediato e irreversível.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 h-9 rounded-xl text-xs font-medium transition"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}
                >
                  Voltar
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-40"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
                >
                  {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={cancelling}
              className="w-full h-9 rounded-xl text-xs font-medium transition disabled:opacity-40"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.28)' }}
            >
              Cancelar assinatura
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── INACTIVE ──
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#0d0d0d' }}
          >
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground" style={{ letterSpacing: '-0.01em' }}>Turbo Nexfy</p>
            <p className="text-xs text-muted-foreground">Destaque premium na plataforma</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { icon: TrendingUp, label: 'Topo dos resultados' },
            { icon: Users, label: 'Mais visibilidade' },
            { icon: Star, label: 'Selo de destaque' },
            { icon: BarChart2, label: 'Métricas do perfil' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: '#f8f9fa', border: '1px solid rgba(0,0,0,0.06)' }}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: '#6b7280' }} />
              <span className="text-[11px] font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleActivate}
          disabled={loading || !professional?.id}
          className="w-full h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50"
          style={{
            background: 'linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 100%)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 4px 16px rgba(0,0,0,0.2)'
          }}
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><Zap className="w-4 h-4" strokeWidth={2.5} /> Assinar — R$ 12,90/mês</>
          }
        </button>
        <p className="text-center text-[10px] mt-2" style={{ color: '#9ca3af' }}>Cancele quando quiser</p>
      </div>
    </div>
  );
}