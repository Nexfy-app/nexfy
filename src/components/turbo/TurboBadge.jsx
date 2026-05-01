import React from 'react';
import { Zap } from 'lucide-react';

/**
 * Small badge to show "Turbo" status on professional cards.
 */
export default function TurboBadge({ size = 'sm' }) {
  if (size === 'xs') {
    return (
      <span className="inline-flex items-center gap-0.5 bg-amber-400 text-amber-900 text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">
        <Zap className="w-2 h-2" /> TURBO
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full leading-none shadow-sm">
      <Zap className="w-2.5 h-2.5" /> TURBO
    </span>
  );
}