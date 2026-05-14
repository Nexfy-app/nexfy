import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import LocationConfigModal from '../location/LocationConfigModal';

export default function GoOnlineModal({ professional, open, onClose }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);
  const [showLocationConfig, setShowLocationConfig] = useState(false);

  const handleGoOnline = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await base44.entities.Professional.update(professional.id, {
          is_available: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        queryClient.invalidateQueries({ queryKey: ['professionals'] });
        setLoading(false);
        onClose();
      },
      async () => {
        await base44.entities.Professional.update(professional.id, { is_available: true });
        queryClient.invalidateQueries({ queryKey: ['professionals'] });
        setLoading(false);
        onClose();
      },
      { timeout: 8000 }
    );
  };

  const handleConfigLocation = () => {
    setShowLocationConfig(true);
  };

  return (
    <>
      <AnimatePresence>
        {open && !showLocationConfig && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="bg-white rounded-t-3xl w-full max-w-md pb-12"
            >
              {/* Pull bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-slate-200" />
              </div>

              <div className="px-6 pb-2 pt-2">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h2 className="text-lg font-black text-foreground text-center mb-1">Perfil criado com sucesso! 🎉</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Deseja ficar <strong>online agora</strong> para aparecer no mapa e receber pedidos de clientes próximos?
                </p>

                <button
                  onClick={handleGoOnline}
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-green-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition active:scale-95 disabled:opacity-60"
                >
                  <MapPin className="w-4 h-4" />
                  {loading ? 'Ativando...' : 'Ficar online agora'}
                </button>

                <button
                  onClick={handleConfigLocation}
                  className="w-full h-11 mt-2 rounded-2xl text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Configurar localização no mapa
                </button>

                <button
                  onClick={onClose}
                  className="w-full h-11 mt-1 rounded-2xl text-sm text-muted-foreground hover:bg-slate-50 transition"
                >
                  Agora não
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LocationConfigModal
        professional={professional}
        open={showLocationConfig}
        onClose={() => { setShowLocationConfig(false); onClose(); }}
        onSaved={() => { queryClient.invalidateQueries({ queryKey: ['professionals'] }); }}
      />
    </>
  );
}