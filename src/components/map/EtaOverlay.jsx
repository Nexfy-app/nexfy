import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Navigation } from 'lucide-react';

export default function EtaOverlay({ eta, professional, onClose }) {
  if (!eta || !professional) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="absolute left-4 right-4 z-[999]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 110px)' }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {/* Blue top accent */}
          <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400" />

          <div className="px-4 py-3.5 flex items-center gap-3">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
              {professional.photo_url ? (
                <img src={professional.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-500">
                  {professional.name?.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium">A caminho</p>
              <p className="font-bold text-sm text-foreground truncate">{professional.name}</p>
            </div>

            {/* ETA */}
            <div className="flex gap-3 items-center shrink-0">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xl font-black text-foreground">{eta.minutes}</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium -mt-0.5">min</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xl font-black text-foreground">{eta.distKm}</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium -mt-0.5">km</p>
              </div>

              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center ml-1 hover:bg-slate-200 transition"
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