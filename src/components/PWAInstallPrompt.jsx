import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Não mostrar se já instalado
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (sessionStorage.getItem('pwa-dismissed')) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
    setIsIOS(ios);

    if (ios) {
      setTimeout(() => setShow(true), 3000);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('pwa-dismissed', '1');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-24 left-4 right-4 z-50 flex justify-center"
        >
          <div
            className="w-full max-w-sm bg-foreground text-white rounded-2xl px-4 py-3.5 flex items-center gap-3"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
          >
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">Instalar o Serfy</p>
              {isIOS ? (
                <p className="text-[11px] text-white/70 mt-0.5 leading-tight">
                  Toque em <strong>⎋ Compartilhar</strong> e depois <strong>"Adicionar à Tela de Início"</strong>
                </p>
              ) : (
                <p className="text-[11px] text-white/70 mt-0.5 leading-tight">
                  Adicione à tela inicial para acesso rápido
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="bg-white text-foreground text-xs font-bold px-3 py-1.5 rounded-xl hover:opacity-90 transition"
                >
                  Instalar
                </button>
              )}
              <button onClick={handleDismiss} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition">
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}