import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

const STEPS = [1, 2, 5, 10, 20, 50];

export default function RadiusControl({ radiusKm, onChange }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-[11px] text-muted-foreground whitespace-nowrap font-medium">Raio:</span>
      <div className="flex gap-1 flex-wrap">
        {STEPS.map((km) => (
          <button
            key={km}
            onClick={() => onChange(km)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all duration-200 ${
              radiusKm === km
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground bg-slate-100 hover:bg-slate-200'
            }`}
          >
            {km}km
          </button>
        ))}
      </div>
    </div>
  );
}