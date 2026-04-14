import React from 'react';
import { Star, MapPin, Award, Clock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { PRICE_TYPE_LABELS } from '@/lib/constants';
import { motion } from 'framer-motion';

export default function ProfessionalCard({ professional, onClick, distance }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(professional)}
      className="bg-card rounded-2xl p-4 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex gap-3">
        <div className="relative">
          <div className="w-14 h-14 rounded-xl bg-secondary overflow-hidden">
            {professional.photo_url ? (
              <img src={professional.photo_url} alt={professional.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                {professional.name?.charAt(0)}
              </div>
            )}
          </div>
          {professional.is_available && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{professional.name}</h3>
            {professional.is_premium && (
              <Award className="w-4 h-4 text-primary shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-medium">{professional.rating_avg?.toFixed(1) || '0.0'}</span>
              <span className="text-xs text-muted-foreground">({professional.rating_count || 0})</span>
            </div>
            {distance && (
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{distance}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {professional.categories?.slice(0, 2).map(cat => (
              <Badge key={cat} variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">
                {cat.replace(/_/g, ' ')}
              </Badge>
            ))}
            {professional.is_available && (
              <Badge className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-700 border-0 font-medium">
                <Clock className="w-2.5 h-2.5 mr-0.5" /> Disponível
              </Badge>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          {professional.price_min && (
            <div>
              <p className="text-xs text-muted-foreground">{PRICE_TYPE_LABELS[professional.price_type] || 'A partir de'}</p>
              <p className="text-sm font-bold text-primary">R$ {professional.price_min}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}