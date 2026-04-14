import React from 'react';
import { Navigation, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EtaCard({ eta, professionalName, onClose }) {
  return (
    <AnimatePresence>
      {eta && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="bg-foreground text-background rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3"
        >
          {/* Uber-style time bubble */}
          <div className="bg-background/15 rounded-xl px-3 py-2 text-center shrink-0">
            <p className="text-2xl font-black leading-none">{eta.minutes}</p>
            <p className="text-[10px] font-semibold opacity-70 mt-0.5">min</p>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{professionalName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Navigation className="w-3 h-3 opacity-60" />
              <p className="text-xs opacity-70">{eta.distKm} km de distância</p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3 h-3 opacity-60" />
              <p className="text-xs opacity-70">~{eta.minutes} min de viagem estimada</p>
            </div>
          </div>

          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-background/15 hover:bg-background/25 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}