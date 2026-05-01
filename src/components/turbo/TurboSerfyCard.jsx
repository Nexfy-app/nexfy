import React, { useState, useEffect } from 'react';
import { Zap, Star, TrendingUp, Users, BarChart2, X, Loader2, CheckCircle2, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PLANS = [
  {
    key: 'weekly',
    label: 'Turbo Semanal',
    price: 'R$ 19,90',
    period: '/semana',
    trial: '3 dias grátis',
    highlight: false,
    perks: ['Aparece primeiro nos resultados', 'Selo Turbo no perfil', 'Notificações de buscas'],
  },
  {
    key: 'monthly',
    label: 'Turbo Mensal',
    price: 'R$ 59,90',
    period: '/mês',
    trial: '7 dias grátis',
    highlight: true,
    badge: 'Mais popular',
    perks: ['Aparece primeiro nos resultados', 'Selo Turbo no perfil', 'Notificações de buscas', 'Métricas de visualizações', 'Prioridade máxima no mapa'],
  },
];

function PlanCard({ plan, onSelect, loading }) {
  return (
    <div
      className={`relative rounded-2xl p-4 border-2 transition-all ${
        plan.highlight
          ? 'border-[#0d4f47] bg-gradient-to-br from-[#0d4f47] to-[#021a14] text-white'
          : 'border-slate-200 bg-white text-foreground'
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-[10px] font-black px-3 py-0.5 rounded-full">
          {plan.badge}
        </div>
      )}

      <div className="mb-3">
        <p className={`text-xs font-semibold mb-0.5 ${plan.highlight ? 'text-white/70' : 'text-muted-foreground'}`}>
          {plan.label}
        </p>
        <div className="flex items-end gap-1">
          <span className="text-2xl font-black">{plan.price}</span>
          <span className={`text-sm mb-0.5 ${plan.highlight ? 'text-white/60' : 'text-muted-foreground'}`}>{plan.period}</span>
        </div>
        <div className={`text-[11px] font-bold mt-1 ${plan.highlight ? 'text-emerald-300' : 'text-emerald-600'}`}>
          ✨ {plan.trial}
        </div>
      </div>

      <ul className="space-y-1.5 mb-4">
        {plan.perks.map((perk, i) => (
          <li key={i} className={`flex items-center gap-2 text-xs ${plan.highlight ? 'text-white/80' : 'text-muted-foreground'}`}>
            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${plan.highlight ? 'text-emerald-300' : 'text-emerald-500'}`} />
            {perk}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan.key)}
        disabled={loading === plan.key}
        className={`w-full h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
          plan.highlight
            ? 'bg-white text-[#0d4f47] hover:bg-white/90'
            : 'bg-[#0d4f47] text-white hover:bg-[#0d4f47]/90'
        } disabled:opacity-60`}
      >
        {loading === plan.key ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Ativar {plan.trial}
          </>
        )}
      </button>
    </div>
  );
}

export default function TurboSerfyCard({ professional, subscription, onRefresh }) {
  const [loading, setLoading] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  const isActive = subscription && (subscription.status === 'active' || subscription.status === 'trial');
  const periodEnd = subscription?.current_period_end
    ? format(new Date(subscription.current_period_end), "dd 'de' MMMM", { locale: ptBR })
    : null;

  const handleSelect = async (plan) => {
    setLoading(plan);
    const res = await base44.functions.invoke('turboCheckout', {
      action: 'create_checkout',
      plan,
      professional_id: professional.id,
    });
    setLoading(null);
    if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      toast.error('Erro ao iniciar checkout');
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
      {/* Trigger banner */}
      <AnimatePresence mode="wait">
        {!showPlans ? (
          <motion.div
            key="banner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
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
                  Apareça primeiro no mapa e receba mais clientes. Comece grátis, sem compromisso.
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
              onClick={() => setShowPlans(true)}
              className="w-full h-11 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #0d4f47, #021a14)' }}
            >
              <Zap className="w-4 h-4" /> Ver planos — começa grátis
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-black text-sm text-foreground">Escolha seu plano</p>
              <button onClick={() => setShowPlans(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 transition">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              {PLANS.map(plan => (
                <PlanCard key={plan.key} plan={plan} onSelect={handleSelect} loading={loading} />
              ))}
            </div>

            <p className="text-center text-[10px] text-muted-foreground mt-3">
              Cancele quando quiser. Sem multas.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}