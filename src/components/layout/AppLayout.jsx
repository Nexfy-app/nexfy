import React, { useState, useEffect } from 'react';
import SetNameModal from '../SetNameModal';
import { Outlet, Link } from 'react-router-dom';
import BottomNav from './BottomNav';
import CookieConsent from '../CookieConsent';
import { base44 } from '@/api/base44Client';

export default function AppLayout() {
  const [userEmail, setUserEmail] = useState(null);
  const [showSetName, setShowSetName] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u) return;
      setUserEmail(u?.email);
      const needsName = !u.display_name || u.display_name.trim().length < 2;
      const sessionKey = `name_modal_shown_${u.email}`;
      const alreadyShown = sessionStorage.getItem(sessionKey);
      if (needsName && !alreadyShown) {
        sessionStorage.setItem(sessionKey, '1');
        setShowSetName(true);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SetNameModal open={showSetName} onClose={() => setShowSetName(false)} />
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav />
      <CookieConsent />
      <footer className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="flex justify-center gap-4 pb-1 opacity-0 select-none" aria-hidden="false" style={{ opacity: 0, pointerEvents: 'none' }}>
          <Link to="/about" className="text-xs text-muted-foreground pointer-events-auto" style={{ pointerEvents: 'auto', opacity: 1 }}>Sobre</Link>
          <Link to="/contact" className="text-xs text-muted-foreground pointer-events-auto" style={{ pointerEvents: 'auto', opacity: 1 }}>Contato</Link>
        </div>
      </footer>
    </div>
  );
}