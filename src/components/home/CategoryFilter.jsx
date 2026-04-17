import React, { useState, useRef, useMemo } from 'react';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { cn } from "@/lib/utils";
import { X, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function CategoryFilter({ selected, onSelect, otherText, onOtherText, professionals = [] }) {
  const [mode, setMode] = useState('all'); // 'all' | 'search'
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Build suggestions from professionals actually registered
  const suggestions = React.useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const results = [];
    const seen = new Set();

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
  };

  const handleClearAll = () => {
    onSelect(null);
    setQuery('');
    setShowSuggestions(false);
  };

  const switchToSearch = () => {
    setMode('search');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const switchToAll = () => {
    setMode('all');
    setQuery('');
    setShowSuggestions(false);
    onSelect(null);
  };

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1.5 overflow-x-auto py-2 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button
          onClick={switchToAll}
          className={cn(
            "shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 border whitespace-nowrap",
            mode === 'all'
              ? "bg-foreground text-white border-foreground shadow-sm"
              : "bg-white/70 text-muted-foreground border-border hover:bg-white"
          )}
        >
          Todos
        </button>

        <button
          onClick={switchToSearch}
          className={cn(
            "shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 border whitespace-nowrap",
            mode === 'search'
              ? "bg-foreground text-white border-foreground shadow-sm"
              : "bg-white/70 text-muted-foreground border-border hover:bg-white"
          )}
        >
          <Search className="w-3 h-3" />
          Pesquisar
        </button>

        {/* Active category pill */}
        {selected && (
          <button
            onClick={handleClearAll}
            className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-600 text-white border-blue-600 border whitespace-nowrap"
          >
            {selectedCat?.label || selected}
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* "Todos" mode — category pills */}
      <AnimatePresence>
        {mode === 'all' && (
          <motion.div
            key="all"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-1.5 flex-wrap px-4 pb-2.5 pt-0.5">
              {SERVICE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => selected === cat.id ? onSelect(null) : onSelect(cat.id)}
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
          </motion.div>
        )}

        {/* "Pesquisar" mode — search input + suggestions */}
        {mode === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden px-4 pb-2.5 pt-0.5"
          >
            <div className="relative">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2 focus-within:border-foreground/40 transition-colors">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Ex: Pedreiro, Eletricista..."
                  className="flex-1 text-xs outline-none bg-transparent placeholder:text-muted-foreground"
                />
                {query && (
                  <button onClick={() => { setQuery(''); setShowSuggestions(false); }} className="text-muted-foreground hover:text-foreground transition">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 overflow-hidden z-20"
                    style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  >
                    {suggestions.map(s => (
                      <button
                        key={s.id}
                        onMouseDown={() => handleSelectSuggestion(s.id)}
                        className="w-full px-4 py-2.5 text-left text-xs font-medium text-foreground hover:bg-slate-50 transition flex items-center gap-2 border-b border-slate-50 last:border-0"
                      >
                        <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                        {s.label}
                      </button>
                    ))}
                  </motion.div>
                )}
                {showSuggestions && query.length >= 2 && suggestions.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 px-4 py-3 z-20"
                    style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  >
                    <p className="text-xs text-muted-foreground">Nenhum profissional encontrado para "{query}"</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}