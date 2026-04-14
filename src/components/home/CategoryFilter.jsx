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
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all",
          !selected
            ? "bg-foreground text-background shadow-sm"
            : "bg-secondary text-muted-foreground hover:bg-border"
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
              "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all border",
              isActive
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-foreground"
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}