import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, DollarSign, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function CompleteServiceModal({ request, onConfirm, onCancel }) {
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const catLabel = request.category?.startsWith('outros:')
    ? request.category.replace('outros:', '')
    : request.category?.replace(/_/g, ' ');

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(request, parseFloat(price) || 0);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-foreground px-5 pt-6 pb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <h2 className="text-white font-bold text-lg">Concluir Serviço</h2>
            <p className="text-white/60 text-sm mt-0.5">{request.client_name} · {catLabel}</p>
          </div>

          {/* Body */}
          <div className="px-5 py-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground mb-2 block">Valor recebido pelo serviço</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">R$</span>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="pl-10 rounded-2xl bg-slate-50 border-slate-200 text-base font-bold focus:bg-white transition-colors"
                  autoFocus
                  min="0"
                  step="0.01"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Informe o valor combinado com o cliente. Isso alimenta seus ganhos mensais no painel.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-3.5 py-3 flex items-start gap-2.5">
              <span className="text-base shrink-0">💡</span>
              <p className="text-xs text-amber-800 leading-relaxed">
                O pagamento foi feito <strong>diretamente</strong> pelo cliente (Pix, dinheiro, etc.). O valor informado aqui é apenas para seu controle de ganhos.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={onCancel}
                className="flex-1 h-12 rounded-2xl border border-slate-200 text-sm font-semibold text-foreground hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 h-12 rounded-2xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}