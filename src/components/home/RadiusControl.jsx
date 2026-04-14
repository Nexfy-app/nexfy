import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

const STEPS = [1, 2, 5, 10, 20, 50];

export default function RadiusControl({ radiusKm, onChange }) {
  return (
    <div className="flex items-center gap-2 bg-card border rounded-full px-3 py-1.5 shadow-sm">
      <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground whitespace-nowrap">Raio:</span>
      <div className="flex gap-1">
        {STEPS.map((km) => (
          <button
            key={km}
            onClick={() => onChange(km)}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
              radiusKm === km
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {km}km
          </button>
        ))}
      </div>
    </div>
  );
}