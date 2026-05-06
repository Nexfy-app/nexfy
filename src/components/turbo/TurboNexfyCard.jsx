import React, { useState } from 'react';
import { Zap, TrendingUp, Users, Star, BarChart2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TurboNexfyCard({ professional, subscription, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isActive = subscription && (subscription.status === 'active' || subscription.status === 'trial' || subscription.status === 'cancelled');
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
    if (res?.data?.url) {
      window.location.href = res.data.url;
    }
  };

  const handleCancel = async () => {
    if (!subscription?.stripe_subscription_id) return;
    setCancelling(true);
    await base44.functions.invoke('turboCheckout', {
      action: 'cancel',
      subscription_id: subscription.stripe_subscription_id,
    });
    setCancelling(false);
    toast.success('Assinatura cancelada. Ativa até o fim do período.');
    onRefresh?.();
  };

  // ── ACTIVE ──
  if (isActive) {
    return (
      <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
        {/* Shine sweep animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="turbo-shine" />
        </div>

        <div className="px-4 pt-4 pb-3 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">Turbo Nexfy</p>
                <p className="text-xs text-white/60">
                  {subscription.plan === 'weekly' ? 'Plano Semanal' : 'Plano Mensal'}
                  {periodEnd ? ` · renova ${periodEnd}` : ''}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-400/30">
              {subscription.status === 'trial' ? '⚡ Trial' : '⚡ Ativo'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-white/60 font-medium mb-0.5">Visualizações de perfil</p>
              <p className="text-xl font-bold text-white">{subscription.profile_views || 0}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-white/60 font-medium mb-0.5">Impressões na busca</p>
              <p className="text-xl font-bold text-white">{subscription.search_impressions || 0}</p>
            </div>
          </div>

          <p className="text-[11px] text-white/50 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Perfil em destaque para clientes próximos
          </p>
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          {subscription.status === 'cancelled' ? (
            <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2.5">
              <span className="text-base">⏳</span>
              <div>
                <p className="text-xs font-semibold text-amber-300">Cancelamento agendado</p>
                <p className="text-[10px] text-white/40">Acesso ativo até {periodEnd || 'o fim do período'}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full h-10 rounded-xl border border-red-500/40 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-red-500/10 transition disabled:opacity-40"
            >
              {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '🚫 Cancelar assinatura'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── INACTIVE ──
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)' }}>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Turbo Nexfy</p>
            <p className="text-xs text-muted-foreground">Apareça primeiro e receba mais clientes</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { icon: TrendingUp, label: 'Topo dos resultados' },
            { icon: Users, label: 'Mais visibilidade' },
            { icon: Star, label: 'Selo de destaque' },
            { icon: BarChart2, label: 'Métricas do perfil' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
              <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[11px] font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleActivate}
          disabled={loading || !professional?.id}
          className="w-full h-11 rounded-xl font-semibold text-sm text-white bg-black flex items-center justify-center gap-2 transition hover:bg-black/80 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Assinar — R$ 12,90/mês</>}
        </button>
        <p className="text-center text-[10px] text-muted-foreground mt-2">Cancele quando quiser</p>
      </div>
    </div>
  );
}