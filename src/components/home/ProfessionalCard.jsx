import React, { useState, useEffect } from 'react';
import { Star, Award, Clock, Navigation, CheckCircle } from 'lucide-react';
import { PRICE_TYPE_LABELS, SERVICE_CATEGORIES } from '@/lib/constants';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const getCategoryLabel = (id) => {
  const cat = SERVICE_CATEGORIES.find(c => c.id === id);
  return cat ? cat.label : id.replace(/_/g, ' ');
};

export default function ProfessionalCard({ professional, onClick, distance }) {
  const { data: approvedDocs = [] } = useQuery({
    queryKey: ['pro-approved-docs', professional.id],
    queryFn: () => base44.entities.VerificationDocument.filter({
      professional_id: professional.id,
      status: 'approved'
    }),
  });

  const isVerified = approvedDocs.length > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onClick(professional)}
      className="bg-white rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md active:scale-[0.985]"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex gap-3 items-center">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full bg-muted overflow-hidden ring-2 ring-white shadow-sm">
            {professional.photo_url ? (
              <img src={professional.photo_url} alt={professional.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-foreground bg-gradient-to-br from-slate-100 to-slate-200">
                {professional.name?.charAt(0)}
              </div>
            )}
          </div>
          {professional.is_available && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white online-dot" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-sm text-foreground truncate">{professional.name}</h3>
            {isVerified && <CheckCircle className="w-3.5 h-3.5 text-green-600 fill-green-600 shrink-0" />}
            {professional.is_premium && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
          </div>

          <div className="flex items-center gap-2.5 mt-0.5">
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-foreground">{professional.rating_avg?.toFixed(1) || '0.0'}</span>
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
              <span key={cat} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
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
              <p className="text-sm font-bold text-foreground mt-0.5">R$ {professional.price_min}</p>
            </div>
          )}
          <span className="text-[10px] font-semibold bg-foreground text-white px-3 py-1 rounded-full">
            Contratar
          </span>
        </div>
      </div>
    </motion.div>
  );
}