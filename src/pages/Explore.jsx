import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from "@/components/ui/input";
import CategoryFilter from '../components/home/CategoryFilter';
import ProfessionalCard from '../components/home/ProfessionalCard';
import ProfessionalSheet from '../components/home/ProfessionalSheet';

export default function Explore() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPro, setSelectedPro] = useState(null);

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals-all'],
    queryFn: () => base44.entities.Professional.filter({ status: 'active' }),
  });

  const filtered = professionals.filter(p => {
    const matchCategory = !selectedCategory || p.categories?.includes(selectedCategory);
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.bio?.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b">
        <div className="px-4 pt-safe">
          <div className="pt-4 pb-3">
            <h1 className="text-xl font-bold mb-3">Encontre um Profissional</h1>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar profissional ou serviço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-full bg-secondary border-0 h-11 font-medium"
              />
            </div>
            <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(pro => (
            <ProfessionalCard key={pro.id} professional={pro} onClick={setSelectedPro} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum profissional encontrado</p>
          </div>
        )}
      </div>

      <ProfessionalSheet professional={selectedPro} open={!!selectedPro} onClose={() => setSelectedPro(null)} />
    </div>
  );
}