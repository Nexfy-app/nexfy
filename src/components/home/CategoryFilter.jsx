import React, { useState } from 'react';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { cn } from "@/lib/utils";
import { ChevronDown, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Group categories into tabs
const GROUPS = [
  { label: 'Todos', ids: null },
  { label: 'Serviços', ids: ['limpeza', 'informatica', 'mudanca', 'outros'] },
  { label: 'Reformas', ids: ['eletricista', 'encanador', 'pintura', 'pedreiro', 'montador', 'ar_condicionado'] },
  { label: 'Jardim', ids: ['corte_grama', 'jardinagem'] },
];

export default function CategoryFilter({ selected, onSelect, otherText, onOtherText }) {
  const [activeGroup, setActiveGroup] = useState(null);

  const visibleCats = activeGroup
    ? SERVICE_CATEGORIES.filter(c => activeGroup.ids?.includes(c.id))
    : [];

  const handleCatSelect = (catId) => {
    if (selected === catId) {
      onSelect(null);
    } else {
      onSelect(catId);
    }
  };

  const handleGroupClick = (group) => {
    if (group.ids === null) {
      // "Todos" — clear filter
      onSelect(null);
      setActiveGroup(null);
    } else if (activeGroup?.label === group.label) {
      setActiveGroup(null);
    } else {
      setActiveGroup(group);
    }
  };

  const selectedCat = SERVICE_CATEGORIES.find(c => c.id === selected);

  return (
    <div>
      {/* Group tabs */}
      <div className="flex gap-1.5 overflow-x-auto py-2 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {GROUPS.map((group) => {
          const isOpen = activeGroup?.label === group.label;
          const hasActiveInGroup = group.ids && selected && group.ids.includes(selected);
          return (
            <button
              key={group.label}
              onClick={() => handleGroupClick(group)}
              className={cn(
                "shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 border whitespace-nowrap",
                (isOpen || hasActiveInGroup || (group.ids === null && !selected))
                  ? "bg-foreground text-white border-foreground shadow-sm"
                  : "bg-white/70 text-muted-foreground border-border hover:bg-white"
              )}
            >
              {group.label}
              {group.ids && <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />}
            </button>
          );
        })}
        {/* Show active category pill with X */}
        {selected && (
          <button
            onClick={() => { onSelect(null); setActiveGroup(null); }}
            className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-600 text-white border-blue-600 border whitespace-nowrap"
          >
            {selectedCat?.label || selected}
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Expanded category list */}
      <AnimatePresence>
        {activeGroup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-1.5 flex-wrap px-4 pb-2.5 pt-0.5">
              {visibleCats.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCatSelect(cat.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-medium border transition-all whitespace-nowrap",
                    selected === cat.id
                      ? "bg-foreground text-white border-foreground shadow-sm"
                      : "bg-white/80 text-slate-600 border-slate-200 hover:bg-white hover:border-slate-400"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {/* "Outros" free text */}
            {selected === 'outros' && (
              <div className="px-4 pb-3">
                <input
                  type="text"
                  value={otherText || ''}
                  onChange={e => onOtherText?.(e.target.value)}
                  placeholder="Qual serviço você precisa?"
                  className="w-full text-xs bg-white border border-slate-200 rounded-full px-3 py-1.5 outline-none focus:border-foreground/40 placeholder:text-muted-foreground"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show outros text input even when group is closed */}
      {selected === 'outros' && !activeGroup && (
        <div className="px-4 pb-2.5">
          <input
            type="text"
            value={otherText || ''}
            onChange={e => onOtherText?.(e.target.value)}
            placeholder="Qual serviço você procura?"
            className="w-full text-xs bg-white border border-slate-200 rounded-full px-3 py-1.5 outline-none focus:border-foreground/40 placeholder:text-muted-foreground"
          />
        </div>
      )}
    </div>
  );
}