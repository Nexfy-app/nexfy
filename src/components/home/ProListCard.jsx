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
      whileTap={{ scale: 0.975 }}
      onClick={() => onClick(professional)}
      className={`cursor-pointer rounded-2xl px-3 py-3 transition-all ${
        isSelected
          ? 'bg-foreground text-white shadow-lg ring-2 ring-foreground/30'
          : 'bg-white text-foreground shadow-sm hover:shadow-md'
      }`}
      style={{ boxShadow: isSelected ? '0 4px 20px rgba(15,23,42,0.2)' : '0 2px 10px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100">
            {professional.photo_url ? (
              <img src={professional.photo_url} alt={professional.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-base font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {professional.name?.charAt(0)}
              </div>
            )}
          </div>
          {/* Online dot */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-foreground'}`}>{professional.name}</p>
            {professional.verified && <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-green-300' : 'text-green-600 fill-green-600'}`} />}
            {professional.is_premium && !isSelected && <TurboBadge size="xs" />}
          </div>
          <p className={`text-[11px] truncate ${isSelected ? 'text-white/70' : 'text-muted-foreground'}`}>{primaryCategory}</p>

          <div className={`flex items-center gap-2.5 mt-1 flex-wrap ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
            {distance && (
              <span className="flex items-center gap-0.5 text-[10px]">
                <Navigation className="w-2.5 h-2.5" />
                {distance}
              </span>
            )}
            {arrival && (
              <span className="flex items-center gap-0.5 text-[10px]">
                <Clock className="w-2.5 h-2.5" />
                Chega em {arrival}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[10px]">
              <Star className={`w-2.5 h-2.5 ${isSelected ? 'text-amber-300 fill-amber-300' : 'text-amber-400 fill-amber-400'}`} />
              {professional.rating_avg?.toFixed(1) || '0.0'}
            </span>
          </div>

          {!isSelected && <ProBadges badgeKeys={badges} />}
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          {professional.price_min ? (
            <>
              <p className={`text-[9px] leading-none ${isSelected ? 'text-white/60' : 'text-muted-foreground'}`}>a partir de</p>
              <p className={`text-sm font-black mt-0.5 ${isSelected ? 'text-white' : 'text-foreground'}`}>R${professional.price_min}</p>
            </>
          ) : (
            <p className={`text-[10px] font-semibold ${isSelected ? 'text-white/70' : 'text-muted-foreground'}`}>Orçamento</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}