import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import CategoryFilter from '../components/home/CategoryFilter';
import ProfessionalCard from '../components/home/ProfessionalCard';
import ProfessionalSheet from '../components/home/ProfessionalSheet';
import NotificationCenter from '../components/notifications/NotificationCenter';
import { motion, AnimatePresence } from 'framer-motion';

export default function Explore() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPro, setSelectedPro] = useState(null);
  const [userEmail, setUserEmail] = React.useState(null);
  React.useEffect(() => { base44.auth.me().then(u => setUserEmail(u?.email)).catch(() => {}); }, []);

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals-all'],
    queryFn: () => base44.entities.Professional.filter({ status: 'active' }),
  });

  const filtered = professionals.filter(p => {
    const matchCategory = !selectedCategory || p.categories?.includes(selectedCategory);
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.bio?.toLowerCase().includes(search.toLowerCase());
    const isNotCurrentUser = p.user_email !== userEmail;
    return matchCategory && matchSearch && isNotCurrentUser;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-10" style={{ background: 'rgba(245,247,250,0.88)', backdropFilter: 'blur(20px)' }}>
        <div className="px-4 pt-12 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Encontrar</h1>
            {userEmail && <NotificationCenter userEmail={userEmail} />}
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <Search className="w-4 h-4 text-muted-foreground" />
            </div>
            <input
              placeholder="Buscar profissional ou serviço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition shadow-sm"
            />
          </div>

          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>
      </div>

      {/* Results */}
      <div className="px-4 pt-2 pb-6 space-y-2.5">
        {/* Count badge */}
        {!isLoading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground font-medium px-1 py-1"
          >
            {filtered.length} profissional{filtered.length !== 1 ? 'is' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </motion.p>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-2.5 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm" style={{ height: 86 }}>
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded-full w-32 animate-pulse" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-24 animate-pulse" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-16 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <AnimatedList>
            {filtered.map(pro => (
              <ProfessionalCard key={pro.id} professional={pro} onClick={setSelectedPro} />
            ))}
          </AnimatedList>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">Nenhum resultado</p>
            <p className="text-sm text-muted-foreground mt-1">Tente outro nome ou categoria</p>
          </div>
        )}
      </div>

      <ProfessionalSheet professional={selectedPro} open={!!selectedPro} onClose={() => setSelectedPro(null)} />
    </div>
  );
}

function AnimatedList({ children }) {
  return (
    <motion.div className="space-y-2.5" initial="hidden" animate="show" variants={{
      hidden: {},
      show: { transition: { staggerChildren: 0.04 } }
    }}>
      {React.Children.map(children, (child, i) => (
        <motion.div key={i} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}