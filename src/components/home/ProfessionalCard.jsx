import React from 'react';
import { Star, Award, Clock } from 'lucide-react';
import { PRICE_TYPE_LABELS, SERVICE_CATEGORIES } from '@/lib/constants';
import { motion } from 'framer-motion';

const getCategoryLabel = (id) => {
  const cat = SERVICE_CATEGORIES.find(c => c.id === id);
  return cat ? cat.label : id.replace(/_/g, ' ');
};

export default function ProfessionalCard({ professional, onClick, distance }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(professional)}
      className="bg-card rounded-2xl p-4 shadow-sm border cursor-pointer active:shadow-none transition-shadow"
    >
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-xl bg-secondary overflow-hidden">
            {professional.photo_url ? (
              <img src={professional.photo_url} alt={professional.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-foreground">
                {professional.name?.charAt(0)}
              </div>
            )}
          </div>
          {professional.is_available && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm truncate">{professional.name}</h3>
            {professional.is_premium && <Award className="w-3.5 h-3.5 text-foreground shrink-0" />}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-semibold">{professional.rating_avg?.toFixed(1) || '0.0'}</span>
              <span className="text-xs text-muted-foreground">({professional.rating_count || 0})</span>
            </div>
            {distance && (
              <span className="text-xs text-muted-foreground">{distance}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {professional.categories?.slice(0, 2).map(cat => (
              <span key={cat} className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                {getCategoryLabel(cat)}
              </span>
            ))}
            {professional.is_available && (
              <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> Disponível
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          {professional.price_min && (
            <div>
              <p className="text-[9px] text-muted-foreground">{PRICE_TYPE_LABELS[professional.price_type] || 'A partir'}</p>
              <p className="text-sm font-bold">R$ {professional.price_min}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}