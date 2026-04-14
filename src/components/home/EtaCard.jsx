import React from 'react';
import { Navigation, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EtaCard({ eta, professionalName, onClose }) {
  return (
    <AnimatePresence>
      {eta && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            {/* Big time bubble */}
            <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center shrink-0 min-w-[56px]">
              <p className="text-3xl font-black text-white leading-none">{eta.minutes}</p>
              <p className="text-[10px] font-semibold text-white/60 mt-0.5 uppercase tracking-wide">min</p>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{professionalName}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Navigation className="w-3 h-3 text-white/50" />
                <p className="text-xs text-white/60">{eta.distKm} km · ~{eta.minutes} min de viagem</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition shrink-0"
            >
              <X className="w-3.5 h-3.5 text-white/80" />
            </button>
          </div>

          {/* Progress bar decoration */}
          <div className="h-0.5 bg-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}