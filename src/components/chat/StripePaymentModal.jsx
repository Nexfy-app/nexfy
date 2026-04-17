import React, { useState } from 'react';
import { X, CreditCard, Loader2, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function StripePaymentModal({ professionalId, serviceRequestId, onClose }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    setLoading(true);
    const res = await base44.functions.invoke('stripeCreatePaymentLink', {
      professional_id: professionalId,
      amount: value,
      description: description.trim() || undefined,
      service_request_id: serviceRequestId,
    });
    setLoading(false);
    if (res.data?.payment_url) {
      window.open(res.data.payment_url, '_blank');
      toast.success('Link de pagamento aberto!');
      onClose();
    } else {
      toast.error(res.data?.error || 'Erro ao gerar link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-xl flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-base">Gerar link de pagamento</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Valor do serviço (R$)</label>
            <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-foreground/40 transition">
              <span className="text-sm text-muted-foreground mr-1">R$</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0,00"
                min="1"
                step="0.01"
                className="flex-1 text-sm outline-none bg-transparent font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Descrição (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Instalação elétrica..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-foreground/40 transition"
            />
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed">
          O cliente receberá um link Stripe Checkout seguro. O pagamento vai direto para sua conta Stripe (taxa de 5% da plataforma).
        </p>

        <button
          onClick={handleGenerate}
          disabled={loading || !amount}
          className="w-full h-12 rounded-2xl bg-foreground text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition hover:bg-foreground/80"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              Gerar e abrir link
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}