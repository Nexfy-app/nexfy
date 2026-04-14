import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from '../components/map/MapView';
import CategoryFilter from '../components/home/CategoryFilter';
import ProfessionalCard from '../components/home/ProfessionalCard';
import ProfessionalSheet from '../components/home/ProfessionalSheet';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPro, setSelectedPro] = useState(null);
  const [listExpanded, setListExpanded] = useState(false);

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => base44.entities.Professional.filter({ status: 'active' }),
    refetchInterval: 15000,
  });

  const filtered = selectedCategory
    ? professionals.filter(p => p.categories?.includes(selectedCategory))
    : professionals;

  const available = filtered.filter(p => p.is_available);

  return (
    <div className="h-screen flex flex-col relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-safe">
        <div className="px-4 pt-3 pb-2">
          <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-lg border p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sua localização</p>
                <p className="text-sm font-semibold">Santa Maria, RS</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-green-500/10 text-green-700 px-2 py-1 rounded-full font-medium">
                  {available.length} online
                </span>
              </div>
            </div>
            <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapView
          professionals={available}
          onMarkerClick={(pro) => setSelectedPro(pro)}
        />
      </div>

      {/* Bottom List Panel */}
      <motion.div
        className="absolute bottom-20 left-0 right-0 z-10"
        animate={{ height: listExpanded ? '50vh' : 'auto' }}
      >
        <div className="bg-card/95 backdrop-blur-xl rounded-t-3xl shadow-2xl border-t mx-2">
          <button
            onClick={() => setListExpanded(!listExpanded)}
            className="w-full flex items-center justify-center pt-3 pb-1"
          >
            <div className="w-10 h-1 bg-border rounded-full" />
          </button>
          
          <div className="px-4 pb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {available.length} profissionais disponíveis
            </h2>
            <button onClick={() => setListExpanded(!listExpanded)} className="text-muted-foreground">
              {listExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          <div className={`overflow-y-auto px-4 pb-4 space-y-2 ${listExpanded ? 'max-h-[40vh]' : 'max-h-40'}`}>
            <AnimatePresence>
              {available.length > 0 ? available.map(pro => (
                <ProfessionalCard
                  key={pro.id}
                  professional={pro}
                  onClick={(p) => setSelectedPro(p)}
                />
              )) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">Nenhum profissional disponível no momento</p>
                  <p className="text-xs text-muted-foreground mt-1">Tente mudar a categoria ou volte mais tarde</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <ProfessionalSheet
        professional={selectedPro}
        open={!!selectedPro}
        onClose={() => setSelectedPro(null)}
      />
    </div>
  );
}