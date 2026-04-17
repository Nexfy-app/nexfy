import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Navigation2 } from 'lucide-react';

export default function EtaOverlay({ eta, professional, onClose }) {
  if (!eta || !professional) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="eta-overlay"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="absolute left-3 right-3 z-[999]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 106px)' }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(28px)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.16), 0 1px 6px rgba(0,0,0,0.06)',
          }}
        >
          {/* Blue accent bar */}
          <div className="h-[3px] bg-gradient-to-r from-blue-700 via-blue-500 to-blue-300" />

          <div className="px-4 py-3 flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-150">
              {professional.photo_url ? (
                <img src={professional.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-base">
                  {professional.name?.charAt(0)}
                </div>
              )}
            </div>

            {/* Name + label */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide">Rota calculada</p>
              <p className="font-bold text-sm text-foreground truncate leading-tight">{professional.name}</p>
            </div>

            {/* ETA badges */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-xl px-2.5 py-1.5">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-sm font-black text-foreground">{eta.minutes}<span className="text-[10px] font-semibold text-muted-foreground ml-0.5">min</span></span>
              </div>
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <Navigation2 className="w-3 h-3 text-slate-500" />
                <span className="text-sm font-black text-foreground">{eta.distKm}<span className="text-[10px] font-semibold text-muted-foreground ml-0.5">km</span></span>
              </div>

              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition ml-0.5"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}