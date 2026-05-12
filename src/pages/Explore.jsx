import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles } from 'lucide-react';
import CategoryFilter from '../components/home/CategoryFilter';
import ProfessionalCard from '../components/home/ProfessionalCard';
import ProfessionalSheet from '../components/home/ProfessionalSheet';
import NotificationCenter from '../components/notifications/NotificationCenter';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Explore() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPro, setSelectedPro] = useState(null);
  const [userEmail, setUserEmail] = React.useState(null);
  const navigate = useNavigate();
  React.useEffect(() => { base44.auth.me().then(u => setUserEmail(u?.email)).catch(() => {}); }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

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
      <div
        className="sticky top-0 z-10"
        style={{ background: 'rgba(245,246,249,0.92)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)' }}
      >
        <div className="px-4 pt-12 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[26px] font-bold text-foreground tracking-tight">Encontrar</h1>
            {userEmail && <NotificationCenter userEmail={userEmail} />}
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Search style={{ width: 16, height: 16, color: '#94a3b8' }} />
            </div>
            <input
              placeholder="Buscar serviço com IA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-11 pr-28 focus:outline-none transition"
              style={{
                height: 48,
                borderRadius: 16,
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                fontSize: 14,
                fontWeight: 500,
                color: 'hsl(224 32% 8%)',
              }}
            />
            <button
              onClick={() => search.trim() && navigate(`/search?q=${encodeURIComponent(search.trim())}`)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl transition active:scale-95"
              style={{ background: 'hsl(224 32% 8%)' }}
            >
              <Sparkles style={{ width: 11, height: 11 }} /> Buscar
            </button>
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
          <div className="flex flex-col gap-3 pt-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-4"
                style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <div className="flex gap-3.5 items-center">
                  <div className="shrink-0 animate-pulse bg-slate-100" style={{ width: 54, height: 54, borderRadius: 16 }} />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3 bg-slate-100 rounded-full w-36 animate-pulse" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-24 animate-pulse" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-20 animate-pulse" />
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
          <div className="text-center py-20">
            <div
              className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 22 }}
            >
              <Search style={{ width: 26, height: 26, color: '#94a3b8' }} />
            </div>
            <p className="font-bold text-foreground text-[15px] tracking-tight">Nenhum resultado</p>
            <p className="text-[13px] text-muted-foreground mt-1">Tente outro nome ou categoria</p>
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