import React from 'react';
import { Star, Award, Navigation } from 'lucide-react';
import { PRICE_TYPE_LABELS, SERVICE_CATEGORIES } from '@/lib/constants';
import { motion } from 'framer-motion';

const getCategoryLabel = (id) => {
  const cat = SERVICE_CATEGORIES.find(c => c.id === id);
  return cat ? cat.label : id.replace(/_/g, ' ');
};

export default function ProfessionalCard({ professional, onClick, distance }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(professional)}
      className="rounded-2xl p-4 cursor-pointer transition-all active:opacity-80"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex gap-3 items-center">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))', border: '2px solid rgba(255,255,255,0.08)' }}>
            {professional.photo_url ? (
              <img src={professional.photo_url} alt={professional.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-black text-muted-foreground">
                {professional.name?.charAt(0)}
              </div>
            )}
          </div>
          {professional.is_available && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background online-dot" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm text-foreground truncate">{professional.name}</h3>
            {professional.is_premium && <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          </div>

          <div className="flex items-center gap-2.5 mt-0.5">
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-foreground">{professional.rating_avg?.toFixed(1) || '0.0'}</span>
              <span className="text-xs text-muted-foreground">({professional.rating_count || 0})</span>
            </div>
            {distance && (
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Navigation className="w-2.5 h-2.5" />
                {distance}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {professional.categories?.slice(0, 2).map(cat => (
              <span
                key={cat}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(59,130,246,0.12)', color: 'rgba(147,197,253,0.9)', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                {getCategoryLabel(cat)}
              </span>
            ))}
          </div>
        </div>

        {/* Price + CTA */}
        <div className="text-right shrink-0 flex flex-col items-end gap-2">
          {professional.price_min && (
            <div>
              <p className="text-[9px] text-muted-foreground leading-none">{PRICE_TYPE_LABELS[professional.price_type] || 'A partir'}</p>
              <p className="text-sm font-black text-foreground mt-0.5">R$ {professional.price_min}</p>
            </div>
          )}
          <span
            className="text-[10px] font-bold px-3 py-1 rounded-full"
            style={{ background: 'hsl(var(--primary))', color: 'white' }}
          >
            Contratar
          </span>
        </div>
      </div>
    </motion.div>
  );
}