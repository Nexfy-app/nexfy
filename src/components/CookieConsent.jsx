import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieConsent({ onAccept }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookies_accepted');
    if (!accepted) setShow(true);
  }, []);

  const handleAccept = async () => {
    localStorage.setItem('cookies_accepted', 'true');
    setShow(false);
    if (onAccept) onAccept();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-lg mx-auto bg-card rounded-2xl shadow-2xl border p-5 md:p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Cookies e Termos de Uso</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Utilizamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossos{' '}
                  <a href="/about" className="text-primary underline">Termos de Uso</a> e{' '}
                  <a href="/about" className="text-primary underline">Política de Privacidade</a>.
                  Coletamos dados de IP conforme a LGPD.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAccept} className="flex-1 rounded-xl h-10 text-sm font-semibold">
                Aceitar e Continuar
              </Button>
              <Button variant="outline" onClick={handleAccept} className="rounded-xl h-10 text-sm">
                Apenas essenciais
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}