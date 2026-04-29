import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Não mostrar se já está instalado (modo standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (navigator.standalone) return; // iOS standalone
    if (localStorage.getItem('pwa-dismissed')) return;

    // Detecta iOS (Safari não suporta beforeinstallprompt)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
    if (ios) {
      setIsIOS(true);
      const timer = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(timer);
    }

    // Android / Chrome: verifica se o prompt já foi capturado antes do mount
    const tryPrompt = () => {
      if (window.__pwaInstallPrompt) {
        setDeferredPrompt(window.__pwaInstallPrompt);
        setShow(true);
      }
    };

    // Tenta imediatamente (caso o evento já disparou antes do mount)
    if (window.__pwaInstallPrompt) {
      const timer = setTimeout(tryPrompt, 2500);
      return () => clearTimeout(timer);
    }

    // Caso contrário, escuta o evento customizado
    const handler = () => {
      setTimeout(tryPrompt, 2500);
    };
    window.addEventListener('pwa-prompt-ready', handler);
    return () => window.removeEventListener('pwa-prompt-ready', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    window.__pwaInstallPrompt = null;
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-dismissed', '1');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-24 left-4 right-4 z-50 flex justify-center pointer-events-none"
        >
          <div
            className="w-full max-w-sm bg-foreground text-white rounded-2xl px-4 py-3.5 flex items-center gap-3 pointer-events-auto"
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
              {!isIOS && deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="bg-white text-foreground text-xs font-bold px-3 py-1.5 rounded-xl hover:opacity-90 transition"
                >
                  Instalar
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}