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
    <div className="flex gap-2 overflow-x-auto py-1 px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200",
          !selected
            ? "text-white"
            : "text-muted-foreground"
        )}
        style={!selected
          ? { background: 'hsl(var(--primary))', boxShadow: '0 2px 12px rgba(59,130,246,0.3)' }
          : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }
        }
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
              "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200"
            )}
            style={isActive
              ? { background: 'hsl(var(--primary))', color: 'white', boxShadow: '0 2px 12px rgba(59,130,246,0.3)' }
              : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(var(--muted-foreground))' }
            }
          >
            {Icon && <Icon className="w-3 h-3" />}
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}