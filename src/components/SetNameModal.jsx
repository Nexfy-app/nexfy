import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function SetNameModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) return;
    setLoading(true);
    try {
      await base44.auth.updateMe({ full_name: trimmed });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-5"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="w-full max-w-[340px] flex flex-col items-center gap-6 rounded-[32px] bg-white px-7 py-8"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)' }}
          >
            {/* Icon */}
            <div
              className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            {/* Text */}
            <div className="text-center space-y-2">
              <h2 className="text-[22px] font-black text-slate-900 leading-snug tracking-tight">
                Bem-vindo! 👋
              </h2>
              <p className="text-[14px] text-slate-500 leading-relaxed">
                Como você quer ser chamado? Esse nome será exibido para outros usuários.
              </p>
            </div>

            {/* Input */}
            <div className="w-full">
              <input
                type="text"
                placeholder="Seu nome..."
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
                maxLength={50}
                className="w-full h-[50px] px-4 rounded-2xl border border-slate-200 bg-slate-50 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent focus:bg-white transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-2 text-center leading-relaxed">
                Você poderá alterar seu nome a qualquer momento nas configurações do perfil.
              </p>
            </div>

            {/* Buttons */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={handleSave}
                disabled={loading || name.trim().length < 2}
                className="w-full h-[50px] rounded-2xl bg-slate-900 text-white font-bold text-[15px] tracking-tight disabled:opacity-30 active:scale-[0.97] transition-all"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : 'Continuar'}
              </button>
              <button
                onClick={onClose}
                className="w-full h-10 text-[13px] text-slate-400 hover:text-slate-600 transition-colors font-medium"
              >
                Pular por enquanto
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}