import React, { useState, useRef, useMemo, useEffect } from 'react';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { cn } from "@/lib/utils";
import { X, Search, ChevronDown, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const FEATURED_IDS = ['eletricista', 'encanador', 'limpeza', 'pedreiro', 'pintura'];

// Hook para calcular posição de um elemento
function useAnchoredPosition(ref, visible) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!visible || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  }, [visible, ref]);

  return pos;
}

export default function CategoryFilter({ selected, onSelect, professionals = [] }) {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showAllDropdown, setShowAllDropdown] = useState(false);
  const [showOtherSearch, setShowOtherSearch] = useState(false);
  const [otherQuery, setOtherQuery] = useState('');
  const inputRef = useRef(null);
  const otherInputRef = useRef(null);
  const todosButtonRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Posição do dropdown "Todos"
  const todosPos = useAnchoredPosition(todosButtonRef, showAllDropdown);
  // Posição do dropdown de busca
  const searchPos = useAnchoredPosition(searchContainerRef, searchResult !== null || (query.length >= 2 && !searchResult));

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      const clickedTodos = todosButtonRef.current?.contains(e.target);
      const clickedSearch = searchContainerRef.current?.contains(e.target);
      const isDropdown = e.target.closest('[data-dropdown]');

      if (!clickedTodos && !isDropdown) {
        setShowAllDropdown(false);
        setShowOtherSearch(false);
      }
      if (!clickedSearch && !isDropdown) {
        setSearchResult(null);
        if (!clickedTodos) setShowAllDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const liveSuggestions = useMemo(() => {
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

  const otherSuggestions = useMemo(() => {
    if (otherQuery.length < 2) return [];
    const q = otherQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
    return results.slice(0, 4);
  }, [otherQuery, professionals]);

  const selectedCat = SERVICE_CATEGORIES.find(c => c.id === selected);
  const featuredCats = SERVICE_CATEGORIES.filter(c => FEATURED_IDS.includes(c.id));

  const handleSelectCategory = (catId) => {
    onSelect(catId);
    setShowAllDropdown(false);
    setShowOtherSearch(false);
    setOtherQuery('');
    setQuery('');
    setSearchResult(null);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
    setSearchResult(null);
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    if (liveSuggestions.length === 1) {
      handleSelectCategory(liveSuggestions[0].id);
      return;
    }
    setSearchResult(liveSuggestions);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const showLiveSuggestions = query.length >= 2 && !searchResult && liveSuggestions.length > 0;
  const showSearchResult = searchResult !== null;

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2">

        {/* Botão "Todos" */}
        <div className="shrink-0" ref={todosButtonRef}>
          <button
            onClick={() => { setShowAllDropdown(v => !v); setShowOtherSearch(false); setOtherQuery(''); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border bg-foreground text-white border-foreground whitespace-nowrap"
          >
            {selected ? (selectedCat?.label || selected) : 'Todos'}
            {selected
              ? <X className="w-3 h-3" onClick={e => { e.stopPropagation(); handleClear(); }} />
              : <ChevronDown className={cn("w-3 h-3 transition-transform", showAllDropdown && "rotate-180")} />
            }
          </button>
        </div>

        {/* Campo de busca */}
        <div className="flex-1" ref={searchContainerRef}>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-foreground/50 focus-within:shadow-sm transition-all">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSearchResult(null); }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar serviço..."
              className="flex-1 text-xs outline-none bg-transparent placeholder:text-muted-foreground min-w-0"
            />
            {query && (
              <button onClick={() => { setQuery(''); setSearchResult(null); }} className="text-muted-foreground hover:text-foreground transition shrink-0">
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="shrink-0 flex items-center justify-center w-6 h-6 bg-foreground text-white rounded-lg disabled:opacity-30 transition hover:bg-foreground/80"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown "Todos" — fixado na tela, fora do card */}
      <AnimatePresence>
        {showAllDropdown && todosPos && (
          <motion.div
            data-dropdown
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed bg-white rounded-2xl border border-slate-200 z-[100] min-w-[180px]"
            style={{ top: todosPos.top, left: todosPos.left, boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}
          >
            {featuredCats.map(cat => (
              <button
                key={cat.id}
                onMouseDown={() => handleSelectCategory(cat.id)}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-xs font-medium transition flex items-center gap-2 border-b border-slate-50",
                  selected === cat.id ? "bg-foreground text-white" : "text-foreground hover:bg-slate-50"
                )}
              >
                {cat.label}
              </button>
            ))}

            {!showOtherSearch ? (
              <button
                onMouseDown={() => { setShowOtherSearch(true); setTimeout(() => otherInputRef.current?.focus(), 80); }}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50 transition flex items-center gap-2 rounded-b-2xl"
              >
                <Search className="w-3 h-3" /> Outros serviços...
              </button>
            ) : (
              <div className="p-2 border-t border-slate-100">
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5">
                  <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                  <input
                    ref={otherInputRef}
                    type="text"
                    value={otherQuery}
                    onChange={e => setOtherQuery(e.target.value)}
                    placeholder="Buscar serviço..."
                    className="flex-1 text-xs outline-none bg-transparent placeholder:text-muted-foreground min-w-0"
                  />
                </div>
                {otherSuggestions.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {otherSuggestions.map(s => (
                      <button
                        key={s.id}
                        onMouseDown={() => handleSelectCategory(s.id)}
                        className="w-full px-2 py-1.5 text-left text-xs font-medium text-foreground hover:bg-slate-100 rounded-lg transition"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
                {otherQuery.length >= 2 && otherSuggestions.length === 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 px-1">Nenhum profissional para "{otherQuery}"</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown de sugestões live — fixado na tela */}
      <AnimatePresence>
        {showLiveSuggestions && searchPos && (
          <motion.div
            data-dropdown
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="fixed bg-white rounded-2xl border border-slate-200 z-[100]"
            style={{ top: searchPos.top, left: searchPos.left, width: searchPos.width, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
          >
            {liveSuggestions.map(s => (
              <button
                key={s.id}
                onMouseDown={() => handleSelectCategory(s.id)}
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-foreground hover:bg-slate-50 transition flex items-center gap-2 border-b border-slate-50 last:border-0"
              >
                <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                {s.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultado da pesquisa — fixado na tela */}
      <AnimatePresence>
        {showSearchResult && searchPos && (
          <motion.div
            data-dropdown
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="fixed bg-white rounded-2xl border border-slate-200 z-[100]"
            style={{ top: searchPos.top, left: searchPos.left, width: searchPos.width, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
          >
            {searchResult.length > 0 ? searchResult.map(s => (
              <button
                key={s.id}
                onMouseDown={() => handleSelectCategory(s.id)}
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-foreground hover:bg-slate-50 transition flex items-center gap-2 border-b border-slate-50 last:border-0"
              >
                <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                {s.label}
              </button>
            )) : (
              <div className="px-4 py-4 flex flex-col items-center gap-1 text-center">
                <p className="text-xs font-semibold text-foreground">Nenhum profissional encontrado</p>
                <p className="text-[10px] text-muted-foreground">Não há profissionais de "{query}" disponíveis agora</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}