import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProListCard from './ProListCard';
import SortSelector from './SortSelector';
import { computeBadges } from './ProBadges';

function formatDistance(km) {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function sortProfessionals(list, sortBy) {
  const copy = [...list];
  switch (sortBy) {
    case 'nearest': return copy.sort((a, b) => (a._dist ?? 999) - (b._dist ?? 999));
    case 'fastest': return copy.sort((a, b) => (a._dist ?? 999) - (b._dist ?? 999));
    case 'cheapest': return copy.sort((a, b) => (a.price_min || 9999) - (b.price_min || 9999));
    case 'priciest': return copy.sort((a, b) => (b.price_min || 0) - (a.price_min || 0));
    case 'top_rated': return copy.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
    default: return copy;
  }
}

// ─── Mobile Bottom Sheet ───────────────────────────────────────────────────────
function MobilePanel({ professionals, onSelect, selectedId }) {
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState('nearest');

  const badges = useMemo(() => computeBadges(professionals), [professionals]);
  const sorted = useMemo(() => sortProfessionals(professionals, sortBy), [professionals, sortBy]);

  if (!professionals.length) return null;

  return (
    <div
      className="fixed left-0 right-0 z-40 flex justify-center px-3"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
    >
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {!expanded ? (
            <motion.button
              key="pill"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={() => setExpanded(true)}
              className="w-full flex items-center justify-between px-5 py-3.5 active:scale-[0.98] transition-all"
              style={{
                background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                borderRadius: 24,
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04), 0 10px 36px rgba(0,0,0,0.09)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 bg-green-500 rounded-full" style={{ boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }} />
                <span className="text-[14px] font-bold text-foreground tracking-tight">
                  {professionals.length} profissional{professionals.length > 1 ? 'is' : ''} disponíve{professionals.length > 1 ? 'is' : 'l'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-medium">Ver todos</span>
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.button>
          ) : (
            <motion.div
              key="sheet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              style={{
                background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                borderRadius: 24,
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.12)',
                maxHeight: '54vh',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" style={{ boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }} />
                  <span className="text-[13px] font-bold text-foreground tracking-tight">
                    {professionals.length} disponíveis
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <SortSelector value={sortBy} onChange={setSortBy} />
                  <button
                    onClick={() => setExpanded(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-full transition"
                    style={{ background: 'rgba(0,0,0,0.05)' }}
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Cards list */}
              <div className="overflow-y-auto px-3 py-2.5 space-y-2" style={{ maxHeight: 'calc(54vh - 52px)' }}>
                <AnimatePresence>
                  {sorted.map(pro => (
                    <ProListCard
                      key={pro.id}
                      professional={pro}
                      onClick={(p) => { onSelect(p); setExpanded(false); }}
                      distance={formatDistance(pro._dist)}
                      badges={badges[pro.id] || []}
                      isSelected={selectedId === pro.id}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Desktop Sidebar ───────────────────────────────────────────────────────────
function DesktopSidebar({ professionals, onSelect, selectedId }) {
  const [sortBy, setSortBy] = useState('nearest');

  const badges = useMemo(() => computeBadges(professionals), [professionals]);
  const sorted = useMemo(() => sortProfessionals(professionals, sortBy), [professionals, sortBy]);

  if (!professionals.length) return null;

  return (
    <div className="absolute right-4 top-4 bottom-4 z-20 w-80 flex flex-col glass-strong rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-foreground">{professionals.length} disponíveis</span>
        </div>
        <SortSelector value={sortBy} onChange={setSortBy} />
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2">
        <AnimatePresence>
          {sorted.map(pro => (
            <ProListCard
              key={pro.id}
              professional={pro}
              onClick={onSelect}
              distance={formatDistance(pro._dist)}
              badges={badges[pro.id] || []}
              isSelected={selectedId === pro.id}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Responsive Wrapper ────────────────────────────────────────────────────────
export default function ProListPanel({ professionals, onSelect, selectedId }) {
  return (
    <>
      {/* Mobile / Tablet */}
      <div className="lg:hidden">
        <MobilePanel professionals={professionals} onSelect={onSelect} selectedId={selectedId} />
      </div>
      {/* Desktop */}
      <div className="hidden lg:block">
        <DesktopSidebar professionals={professionals} onSelect={onSelect} selectedId={selectedId} />
      </div>
    </>
  );
}