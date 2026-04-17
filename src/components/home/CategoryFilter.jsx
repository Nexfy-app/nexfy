import React, { useState, useRef, useMemo, useEffect } from 'react';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { cn } from "@/lib/utils";
import { X, Search, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function CategoryFilter({ selected, onSelect, professionals = [] }) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAllDropdown, setShowAllDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAllDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Autocomplete suggestions from registered professionals
  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const seen = new Set();
    const results = [];

    professionals.forEach(pro => {
      pro.categories?.forEach(catId => {
        const cat = SERVICE_CATEGORIES.find(c => c.id === catId);
        const label = cat?.label || catId;
        const normalized = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalized.includes(q) && !seen.has(catId)) {
          seen.add(catId);
          results.push({ id: catId, label });
        }
      });
    });

    return results.slice(0, 6);
  }, [query, professionals]);

  const selectedCat = SERVICE_CATEGORIES.find(c => c.id === selected);

  const handleSelectSuggestion = (catId) => {
    onSelect(catId);
    setQuery('');
    setShowSuggestions(false);
    setShowAllDropdown(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
    setShowSuggestions(false);
  };

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2">

        {/* "Todos" button with dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setShowAllDropdown(v => !v)}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border whitespace-nowrap",
              showAllDropdown || selected
                ? "bg-foreground text-white border-foreground"
                : "bg-foreground text-white border-foreground"
            )}
          >
            {selected ? (selectedCat?.label || selected) : 'Todos'}
            {selected
              ? <X className="w-3 h-3" onClick={e => { e.stopPropagation(); handleClear(); }} />
              : <ChevronDown className={cn("w-3 h-3 transition-transform", showAllDropdown && "rotate-180")} />
            }
          </button>

          {/* Category dropdown */}
          <AnimatePresence>
            {showAllDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl border border-slate-200 overflow-hidden z-30 min-w-[160px]"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
              >
                {SERVICE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onMouseDown={() => handleSelectSuggestion(cat.id)}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-xs font-medium transition flex items-center gap-2 border-b border-slate-50 last:border-0",
                      selected === cat.id
                        ? "bg-foreground text-white"
                        : "text-foreground hover:bg-slate-50"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search input — destaque principal */}
        <div className="flex-1 relative">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-foreground/50 focus-within:shadow-sm transition-all">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Buscar serviço..."
              className="flex-1 text-xs outline-none bg-transparent placeholder:text-muted-foreground min-w-0"
            />
            {query && (
              <button onClick={() => { setQuery(''); setShowSuggestions(false); }} className="text-muted-foreground hover:text-foreground transition shrink-0">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && query.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 overflow-hidden z-30"
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
              >
                {suggestions.length > 0 ? suggestions.map(s => (
                  <button
                    key={s.id}
                    onMouseDown={() => handleSelectSuggestion(s.id)}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-foreground hover:bg-slate-50 transition flex items-center gap-2 border-b border-slate-50 last:border-0"
                  >
                    <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                    {s.label}
                  </button>
                )) : (
                  <div className="px-4 py-3">
                    <p className="text-xs text-muted-foreground">Nenhum profissional para "{query}"</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}