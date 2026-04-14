import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import CookieConsent from '../CookieConsent';
import NotificationCenter from '../notifications/NotificationCenter';
import { base44 } from '@/api/base44Client';

export default function AppLayout() {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {userEmail && (
        <div className="fixed top-4 right-4 z-50">
          <NotificationCenter userEmail={userEmail} />
        </div>
      )}
      <main className="pb-28">
        <Outlet />
      </main>
      <BottomNav />
      <CookieConsent />
    </div>
  );
}