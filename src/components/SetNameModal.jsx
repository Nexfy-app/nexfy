import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7 flex flex-col items-center gap-5"
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <User className="w-8 h-8 text-slate-700" />
            </div>

            {/* Text */}
            <div className="text-center">
              <h2 className="text-xl font-black text-foreground leading-tight">Como quer ser chamado?</h2>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Esse é o nome que as pessoas irão ver quando você fizer pedidos no app.
              </p>
            </div>

            {/* Input */}
            <input
              type="text"
              placeholder="Seu nome..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              maxLength={50}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
            />

            {/* Buttons */}
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={handleSave}
                disabled={loading || name.trim().length < 2}
                className="w-full h-12 bg-foreground text-white rounded-xl font-bold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mx-auto" />
                ) : 'Salvar nome'}
              </button>
              <button
                onClick={onClose}
                className="w-full h-10 text-sm text-muted-foreground hover:text-foreground transition"
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