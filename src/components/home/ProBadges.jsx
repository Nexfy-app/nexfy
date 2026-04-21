import React from 'react';

const BADGE_CONFIG = {
  fastest: { label: 'Mais rápido', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  cheapest: { label: 'Mais barato', color: 'bg-green-50 text-green-700 border-green-200' },
  nearest: { label: 'Mais próximo', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  top_rated: { label: 'Mais bem avaliado', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  most_requested: { label: 'Mais solicitado', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export function computeBadges(professionals) {
  if (!professionals || professionals.length < 2) return {};
  const badges = {};

  const nearest = [...professionals].filter(p => p._dist != null).sort((a, b) => a._dist - b._dist)[0];
  const cheapest = [...professionals].filter(p => p.price_min).sort((a, b) => a.price_min - b.price_min)[0];
  const topRated = [...professionals].filter(p => p.rating_avg).sort((a, b) => b.rating_avg - a.rating_avg)[0];
  const mostRequested = [...professionals].sort((a, b) => (b.services_completed || 0) - (a.services_completed || 0))[0];
  // "fastest" = nearest as proxy for arrival time
  const fastest = nearest;

  if (nearest) badges[nearest.id] = [...(badges[nearest.id] || []), 'nearest'];
  if (cheapest && cheapest.id !== nearest?.id) badges[cheapest.id] = [...(badges[cheapest.id] || []), 'cheapest'];
  if (topRated && !badges[topRated.id]?.length) badges[topRated.id] = [...(badges[topRated.id] || []), 'top_rated'];
  if (mostRequested && !badges[mostRequested.id]?.length && mostRequested.services_completed > 0) badges[mostRequested.id] = [...(badges[mostRequested.id] || []), 'most_requested'];

  // Cap at 2 badges per professional
  Object.keys(badges).forEach(id => { badges[id] = badges[id].slice(0, 2); });

  return badges;
}

export default function ProBadges({ badgeKeys = [] }) {
  if (!badgeKeys.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {badgeKeys.map(key => {
        const cfg = BADGE_CONFIG[key];
        if (!cfg) return null;
        return (
          <span key={key} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
            {cfg.label}
          </span>
        );
      })}
    </div>
  );
}