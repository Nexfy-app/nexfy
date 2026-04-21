import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OPTIONS = [
  { value: 'nearest', label: 'Mais próximo' },
  { value: 'fastest', label: 'Mais rápido' },
  { value: 'cheapest', label: 'Menor preço' },
  { value: 'priciest', label: 'Maior preço' },
  { value: 'top_rated', label: 'Mais bem avaliado' },
];

export default function SortSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = OPTIONS.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 bg-white/90 border border-slate-200 rounded-full px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm hover:border-slate-400 transition-all"
      >
        <SlidersHorizontal className="w-3 h-3" />
        {current?.label || 'Ordenar'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
          >
            {OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] font-medium text-foreground hover:bg-slate-50 transition"
              >
                {opt.label}
                {value === opt.value && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}