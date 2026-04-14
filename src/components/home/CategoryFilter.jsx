import React from 'react';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { cn } from "@/lib/utils";
import {
  Scissors, Zap, Droplets, Sparkles, Hammer, Paintbrush,
  Wrench, Leaf, Truck, Monitor, Wind, MoreHorizontal
} from 'lucide-react';

const iconMap = {
  Scissors, Zap, Droplets, Sparkles, Hammer, Paintbrush,
  Wrench, Leaf, Truck, Monitor, Wind, MoreHorizontal,
};

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200",
          !selected
            ? "bg-foreground text-white shadow-sm"
            : "bg-white/60 text-muted-foreground border border-border hover:bg-white"
        )}
      >
        Todos
      </button>
      {SERVICE_CATEGORIES.map((cat) => {
        const Icon = iconMap[cat.icon];
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(isActive ? null : cat.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 border",
              isActive
                ? "bg-foreground text-white border-foreground shadow-sm"
                : "bg-white/60 text-muted-foreground border-border hover:bg-white hover:border-foreground/30"
            )}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}