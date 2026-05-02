import React, { useState } from 'react';
import { Zap, TrendingUp, Users, Star, BarChart2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TurboSerfyCard({ professional, subscription, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isActive = subscription && (subscription.status === 'active' || subscription.status === 'trial');
  const periodEnd = subscription?.current_period_end
    ? format(new Date(subscription.current_period_end), "dd 'de' MMMM", { locale: ptBR })
    : null;

  const handleActivate = async () => {
    if (!professional?.id) { toast.error('Perfil não encontrado'); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('turboCheckout', {
        action: 'create_checkout',
        professional_id: professional.id,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error('Erro ao iniciar checkout. Tente novamente.');
      }
    } catch {
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
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
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">Turbo Serfy</p>
                <p className="text-xs text-muted-foreground">
                  {subscription.plan === 'weekly' ? 'Plano Semanal' : 'Plano Mensal'}
                  {periodEnd ? ` · renova ${periodEnd}` : ''}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
              {subscription.status === 'trial' ? 'Trial' : 'Ativo'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Visualizações</p>
              <p className="text-xl font-bold text-foreground">{subscription.profile_views || 0}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Impressões</p>
              <p className="text-xl font-bold text-foreground">{subscription.search_impressions || 0}</p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Perfil em destaque para clientes próximos
          </p>
        </div>

        <div className="border-t border-slate-100 px-4 py-3">
          <button
            onClick={handleCancel}
            disabled={cancelling || subscription.status === 'cancelled'}
            className="text-xs text-muted-foreground hover:text-red-500 transition disabled:opacity-40 flex items-center gap-1.5"
          >
            {cancelling && <Loader2 className="w-3 h-3 animate-spin" />}
            {subscription.status === 'cancelled' ? 'Cancelamento agendado' : 'Cancelar assinatura'}
          </button>
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
            <p className="text-sm font-semibold text-foreground">Turbo Serfy</p>
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
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Ativar — R$ 4,90/mês</>}
        </button>
        <p className="text-center text-[10px] text-muted-foreground mt-2">Cancele quando quiser</p>
      </div>
    </div>
  );
}