import React from 'react';
import { LocateFixed } from 'lucide-react';

export default function LocateMeButton({ userLocation, onLocate }) {
  const handleClick = () => {
    if (userLocation && onLocate) {
      onLocate(userLocation);
    }
  };

  return (
    <button
      onClick={handleClick}
      title="Centralizar minha localização"
      className="absolute right-3 z-[999] w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 260px)', boxShadow: '0 4px 16px rgba(0,0,0,0.14)' }}
    >
      <LocateFixed className="w-5 h-5 text-blue-600" />
    </button>
  );
}