import React, { useState } from 'react';
import { Zap, Star, TrendingUp, Users, BarChart2, Loader2, Crown } from 'lucide-react';
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
    if (!professional?.id) {
      toast.error('Perfil profissional não encontrado');
      return;
    }
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
    } catch (err) {
      toast.error('Erro ao conectar com o servidor. Tente novamente.');
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

  // ── ACTIVE STATE ──
  if (isActive) {
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d4f47 0%, #021a14 100%)', boxShadow: '0 4px 24px rgba(13,79,71,0.35)' }}
      >
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-black text-sm">Turbo Serfy</p>
                  <span className="bg-amber-400 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">ATIVO</span>
                  {subscription.status === 'trial' && (
                    <span className="bg-emerald-400/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-400/30">TRIAL</span>
                  )}
                </div>
                <p className="text-white/60 text-[10px]">
                  {subscription.plan === 'weekly' ? 'Plano Semanal' : 'Plano Mensal'}
                  {periodEnd ? ` · até ${periodEnd}` : ''}
                </p>
              </div>
            </div>
            <Crown className="w-5 h-5 text-amber-400" />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/60 text-[10px] font-medium">Visualizações</p>
              <p className="text-white font-black text-lg">{subscription.profile_views || 0}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/60 text-[10px] font-medium">Impressões em buscas</p>
              <p className="text-white font-black text-lg">{subscription.search_impressions || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/60 text-[10px] mb-3">
            <TrendingUp className="w-3 h-3" />
            <span>Seu perfil aparece primeiro para clientes próximos</span>
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <button
            onClick={handleCancel}
            disabled={cancelling || subscription.status === 'cancelled'}
            className="text-white/40 text-xs hover:text-white/70 transition disabled:opacity-40 flex items-center gap-1.5"
          >
            {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {subscription.status === 'cancelled' ? '✓ Cancelamento agendado' : 'Cancelar assinatura'}
          </button>
        </div>
      </div>
    );
  }

  // ── INACTIVE STATE ──
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #0d4f47, #021a14)' }}
          >
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-foreground">Ative o Turbo Serfy ⚡</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Apareça primeiro no mapa e receba mais clientes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { icon: TrendingUp, label: 'Topo dos resultados' },
            { icon: Users, label: 'Mais visibilidade' },
            { icon: Star, label: 'Selo de destaque' },
            { icon: BarChart2, label: 'Métricas do perfil' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
              <Icon className="w-3.5 h-3.5 text-[#0d4f47] shrink-0" />
              <span className="text-[11px] font-semibold text-foreground">{label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleActivate}
          disabled={loading || !professional?.id}
          className="w-full h-11 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #0d4f47, #021a14)' }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <><Zap className="w-4 h-4" /> Ativar por R$ 4,90/mês</>
          )}
        </button>
        <p className="text-center text-[10px] text-muted-foreground mt-2">Cancele quando quiser. Sem multas.</p>
      </div>
    </div>
  );
}