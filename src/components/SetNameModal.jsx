import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';


export default function SetNameModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) return;
    setLoading(true);
    try {
      await base44.auth.updateMe({ display_name: trimmed });
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
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="w-full max-w-[320px] flex flex-col gap-5 rounded-[28px] bg-white px-6 py-7"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)' }}
          >
            {/* Text */}
            <div className="space-y-1.5">
              <h2 className="text-[20px] font-bold text-slate-900 leading-snug tracking-tight">
                Bem-vindo
              </h2>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Como você quer ser chamado? Esse nome será exibido para outros usuários na plataforma.
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
                className="w-full focus:outline-none transition-all"
                style={{
                  height: 48,
                  borderRadius: 14,
                  border: '1px solid rgba(0,0,0,0.10)',
                  background: 'rgba(0,0,0,0.03)',
                  padding: '0 14px',
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#0f1729',
                  letterSpacing: '-0.01em',
                }}
              />
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Você pode alterar isso a qualquer momento no seu perfil.
              </p>
            </div>

            {/* Buttons */}
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={handleSave}
                disabled={loading || name.trim().length < 2}
                className="w-full text-white font-bold text-[15px] transition-all active:scale-[0.97] disabled:opacity-30"
                style={{
                  height: 50,
                  borderRadius: 14,
                  background: 'hsl(224 32% 8%)',
                  letterSpacing: '-0.02em',
                }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : 'Continuar'}
              </button>
              <button
                onClick={onClose}
                className="w-full h-10 text-[13px] text-slate-400 font-medium transition-colors"
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