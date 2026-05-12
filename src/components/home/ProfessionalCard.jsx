import React, { useState, useEffect } from 'react';
import { Star, Award, Clock, Navigation, CheckCircle } from 'lucide-react';
import { PRICE_TYPE_LABELS, SERVICE_CATEGORIES } from '@/lib/constants';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TurboBadge from '../turbo/TurboBadge';

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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.982 }}
      onClick={() => onClick(professional)}
      className="cursor-pointer"
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '14px 16px',
        border: '1px solid rgba(0,0,0,0.04)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex gap-3.5 items-center">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="overflow-hidden"
            style={{ width: 54, height: 54, borderRadius: 16, background: '#f1f5f9' }}
          >
            {professional.photo_url ? (
              <img src={professional.photo_url} alt={professional.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-500">
                {professional.name?.charAt(0)}
              </div>
            )}
          </div>
          {professional.is_available && (
            <div
              className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white"
              style={{ width: 14, height: 14, background: '#22c55e' }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-[14px] text-foreground truncate tracking-tight">{professional.name}</h3>
            {isVerified && <CheckCircle style={{ width: 13, height: 13, color: '#16a34a', fill: '#16a34a', flexShrink: 0 }} />}
            {professional.is_premium && <TurboBadge size="xs" />}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-0.5">
              <Star style={{ width: 11, height: 11, fill: '#fbbf24', color: '#fbbf24' }} />
              <span className="text-[12px] font-semibold text-foreground">{professional.rating_avg?.toFixed(1) || '0.0'}</span>
              <span className="text-[11px] text-muted-foreground ml-0.5">({professional.rating_count || 0})</span>
            </div>
            {distance && (
              <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Navigation style={{ width: 10, height: 10 }} />
                {distance}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {professional.categories?.slice(0, 2).map(cat => (
              <span
                key={cat}
                className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.05)', color: '#475569' }}
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
              <p className="text-[9px] text-muted-foreground leading-none font-medium">{PRICE_TYPE_LABELS[professional.price_type] || 'A partir'}</p>
              <p className="text-[14px] font-black text-foreground mt-0.5 tracking-tight">R${professional.price_min}</p>
            </div>
          )}
          <span
            className="text-[11px] font-bold px-3.5 py-1.5 rounded-full"
            style={{ background: 'hsl(224 32% 8%)', color: '#ffffff' }}
          >
            Contratar
          </span>
        </div>
      </div>
    </motion.div>
  );
}