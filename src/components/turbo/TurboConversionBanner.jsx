import React, { useState } from 'react';
import { Zap, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * TurboConversionBanner
 * Shows a contextual nudge to activate Turbo Serfy.
 * Usage: <TurboConversionBanner searchCount={3} category="eletricista" />
 */
export default function TurboConversionBanner({ searchCount = 0, category = '', onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed || searchCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d4f47 0%, #021a14 100%)', boxShadow: '0 4px 24px rgba(13,79,71,0.3)' }}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-sm leading-snug">
                {searchCount} {searchCount === 1 ? 'pessoa está procurando' : 'pessoas estão procurando'} por esse serviço agora
              </p>
              {category && (
                <p className="text-white/60 text-[11px] mt-0.5 capitalize">
                  Categoria: {category}
                </p>
              )}
              <p className="text-white/70 text-xs mt-1.5 leading-relaxed">
                Destaque seu perfil para aparecer primeiro e aumentar suas chances.
              </p>
            </div>
            <button onClick={handleDismiss} className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition shrink-0">
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          <button
            onClick={() => navigate('/professional/dashboard')}
            className="mt-3 w-full h-9 bg-white text-[#0d4f47] rounded-xl font-black text-xs flex items-center justify-center gap-1.5 hover:bg-white/90 transition"
          >
            <Zap className="w-3.5 h-3.5" />
            Ativar Turbo Serfy — começa grátis
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}