import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function GoOnlineModal({ professional, open, onClose }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);

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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-12"
          >
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
              onClick={onClose}
              className="w-full h-11 mt-2 rounded-2xl text-sm text-muted-foreground hover:bg-slate-50 transition"
            >
              Agora não
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}