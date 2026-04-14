import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import CookieConsent from '../CookieConsent';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
      <CookieConsent />
    </div>
  );
}