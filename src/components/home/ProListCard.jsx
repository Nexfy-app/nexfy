import React from 'react';
import { Star, Navigation, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import ProBadges from './ProBadges';
import TurboBadge from '../turbo/TurboBadge';

const getCategoryLabel = (id) => {
  if (!id) return '';
  const cat = SERVICE_CATEGORIES.find(c => c.id === id);
  return cat ? cat.label : id.replace(/_/g, ' ');
};

function estimateArrival(distKm) {
  if (distKm == null) return null;
  // ~30 km/h average urban speed
  const minutes = Math.round((distKm / 30) * 60);
  return minutes <= 1 ? '1 min' : `${minutes} min`;
}

export default function ProListCard({ professional, onClick, distance, badges = [], isSelected }) {
  const arrival = professional._dist != null ? estimateArrival(professional._dist) : null;
  const primaryCategory = getCategoryLabel(professional.categories?.[0]);

  return (
    <motion.div
      whileTap={{ scale: 0.972 }}
      onClick={() => onClick(professional)}
      className="cursor-pointer transition-all"
      style={{
        borderRadius: 18,
        padding: '12px 14px',
        background: isSelected ? 'hsl(224 32% 8%)' : '#ffffff',
        boxShadow: isSelected
          ? '0 4px 20px rgba(15,20,40,0.22)'
          : '0 1px 3px rgba(0,0,0,0.04), 0 2px 10px rgba(0,0,0,0.05)',
        border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="overflow-hidden"
            style={{ width: 46, height: 46, borderRadius: 14, background: '#f1f5f9' }}
          >
            {professional.photo_url ? (
              <img src={professional.photo_url} alt={professional.name} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-base font-bold"
                style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : '#64748b' }}
              >
                {professional.name?.charAt(0)}
              </div>
            )}
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 rounded-full border-2"
            style={{ width: 13, height: 13, background: '#22c55e', borderColor: isSelected ? 'hsl(224 32% 8%)' : '#ffffff' }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[13px] font-bold truncate" style={{ color: isSelected ? '#ffffff' : 'hsl(224 32% 8%)' }}>
              {professional.name}
            </p>
            {professional.verified && (
              <CheckCircle style={{ width: 13, height: 13, flexShrink: 0, color: isSelected ? '#86efac' : '#16a34a', fill: isSelected ? '#86efac' : '#16a34a' }} />
            )}
            {professional.is_premium && !isSelected && <TurboBadge size="xs" />}
          </div>
          <p className="text-[11px] truncate mt-0.5" style={{ color: isSelected ? 'rgba(255,255,255,0.55)' : '#94a3b8' }}>
            {primaryCategory}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="flex items-center gap-0.5 text-[10px] font-medium" style={{ color: isSelected ? 'rgba(255,255,255,0.65)' : '#94a3b8' }}>
              <Star style={{ width: 10, height: 10, fill: isSelected ? '#fbbf24' : '#fbbf24', color: isSelected ? '#fbbf24' : '#fbbf24' }} />
              {professional.rating_avg?.toFixed(1) || '0.0'}
            </span>
            {distance && (
              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: isSelected ? 'rgba(255,255,255,0.55)' : '#94a3b8' }}>
                <Navigation style={{ width: 9, height: 9 }} />
                {distance}
              </span>
            )}
            {arrival && (
              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: isSelected ? 'rgba(255,255,255,0.55)' : '#94a3b8' }}>
                <Clock style={{ width: 9, height: 9 }} />
                {arrival}
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          {professional.price_min ? (
            <>
              <p className="text-[9px] leading-none font-medium" style={{ color: isSelected ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}>
                a partir de
              </p>
              <p className="text-[14px] font-black mt-0.5 tracking-tight" style={{ color: isSelected ? '#ffffff' : 'hsl(224 32% 8%)' }}>
                R${professional.price_min}
              </p>
            </>
          ) : (
            <p className="text-[10px] font-semibold" style={{ color: isSelected ? 'rgba(255,255,255,0.55)' : '#94a3b8' }}>
              Orçamento
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}