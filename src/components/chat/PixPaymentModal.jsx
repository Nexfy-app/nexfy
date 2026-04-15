import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Copy, CheckCircle2, X, QrCode, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function PixPaymentModal({ professional, request, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!professional?.pix_key) return null;

  const pixKeyTypeLabels = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    email: 'E-mail',
    phone: 'Telefone',
    random: 'Chave aleatória',
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(professional.pix_key);
    setCopied(true);
    // Track click
    base44.auth.me().then(user => {
      base44.entities.PixClick.create({
        client_email: user.email,
        professional_id: professional.id,
        professional_name: professional.name,
        service_request_id: request?.id || '',
        pix_key: professional.pix_key,
        amount: request?.price_agreed || 0,
      }).catch(() => {});
      base44.analytics.track({
        eventName: 'pix_key_copied',
        properties: { professional_id: professional.id, amount: request?.price_agreed || 0 },
      });
    });
    toast.success('Chave PIX copiada!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className="w-full max-w-md bg-white rounded-t-[2rem] pb-10 pt-3 px-6"
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Pagar via PIX</h2>
                <p className="text-xs text-muted-foreground">{professional.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Amount */}
          {request?.price_agreed > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4 text-center">
              <p className="text-xs text-green-700 font-medium">Valor combinado</p>
              <p className="text-3xl font-black text-green-800 mt-0.5">R$ {request.price_agreed}</p>
            </div>
          )}

          {/* PIX key */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
              {pixKeyTypeLabels[professional.pix_key_type] || 'Chave PIX'}
            </p>
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-foreground flex-1 break-all">{professional.pix_key}</p>
              <button
                onClick={handleCopy}
                className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  copied ? 'bg-green-500 text-white' : 'bg-foreground text-white hover:bg-foreground/90'
                }`}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* How to pay */}
          <div className="space-y-2 mb-5">
            {['Abra o app do seu banco', 'Escolha pagar com PIX', 'Cole a chave copiada', 'Confirme o valor e pague'].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-foreground text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground">{step}</p>
              </div>
            ))}
          </div>

          {/* Legal disclaimer */}
          <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Aviso importante:</strong> Este app <strong>não processa, intermedia nem garante pagamentos</strong>. Somos apenas uma plataforma de conexão entre clientes e profissionais. O pagamento é realizado <strong>diretamente entre as partes</strong>, sem qualquer participação ou responsabilidade do ServiçosJá.
            </p>
          </div>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              <strong>Atenção:</strong> Pague somente após o serviço ser concluído e aprovado por você. Verifique sempre os dados antes de transferir.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleCopy}
            className="w-full h-13 mt-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ height: 52 }}
          >
            {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Chave copiada!' : 'Copiar chave PIX'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}