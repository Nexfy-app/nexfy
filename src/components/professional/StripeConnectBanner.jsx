import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function StripeConnectBanner() {
  const [status, setStatus] = useState(null); // null = loading
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.functions.invoke('stripeAccountStatus', {}).then(res => {
      setStatus(res.data);
    }).catch(() => setStatus({ connected: false }));
  }, []);

  const handleOnboard = async () => {
    setLoading(true);
    const returnUrl = window.location.href;
    const res = await base44.functions.invoke('stripeConnectOnboard', { return_url: returnUrl });
    setLoading(false);
    if (res.data?.already_onboarded) {
      toast.success('Sua conta já está conectada!');
      setStatus({ connected: true });
      return;
    }
    if (res.data?.url) {
      window.open(res.data.url, '_blank');
    } else {
      toast.error(res.data?.error || 'Erro ao iniciar onboarding');
    }
  };

  if (status === null) return null;

  if (status.connected) {
    return (
      <div className="flex items-center gap-2.5 bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-green-700">Stripe Connect ativo</p>
          <p className="text-[10px] text-green-600">Você pode receber pagamentos via cartão</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 bg-foreground rounded-xl flex items-center justify-center shrink-0">
          <CreditCard className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground">Receba por cartão de crédito</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
            Conecte sua conta Stripe para gerar links de pagamento para seus clientes.
          </p>
        </div>
      </div>
      <button
        onClick={handleOnboard}
        disabled={loading}
        className="w-full mt-3 h-9 rounded-xl bg-foreground text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-foreground/80 transition disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
        {loading ? 'Aguarde...' : 'Conectar conta Stripe'}
      </button>
    </div>
  );
}