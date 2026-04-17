import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function ChatSearchBar({ userEmail }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: allMessages = [] } = useQuery({
    queryKey: ['all-chat-messages', userEmail],
    queryFn: () => base44.entities.ChatMessage.filter({}, '-created_date', 100),
    enabled: !!userEmail,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['search-requests', userEmail],
    queryFn: async () => {
      const asClient = await base44.entities.ServiceRequest.filter({ client_email: userEmail });
      const proData = await base44.entities.Professional.filter({ user_email: userEmail });
      let asProvider = [];
      if (proData.length > 0) {
        asProvider = await base44.entities.ServiceRequest.filter({ professional_id: proData[0].id });
      }
      const all = [...asClient, ...asProvider];
      const unique = all.reduce((acc, r) => { acc[r.id] = r; return acc; }, {});
      return Object.values(unique).filter(r => r.status !== 'cancelled');
    },
    enabled: !!userEmail,
  });

  const results = query.trim() ? requests.filter(r => {
    const otherName = r.client_email === userEmail ? r.professional_name : r.client_name;
    const category = r.category?.replace(/_/g, ' ');
    return (
      otherName?.toLowerCase().includes(query.toLowerCase()) ||
      category?.toLowerCase().includes(query.toLowerCase()) ||
      r.description?.toLowerCase().includes(query.toLowerCase())
    );
  }).slice(0, 5) : [];

  return (
    <div className="px-4 pb-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar conversa..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full h-10 pl-10 pr-3 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full mt-1 left-4 right-4 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden z-50"
          >
            {results.map((r) => {
              const otherName = r.client_email === userEmail ? r.professional_name : r.client_name;
              return (
                <Link
                  key={r.id}
                  to={`/chat/${r.id}`}
                  onClick={() => { setQuery(''); setIsOpen(false); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {otherName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{otherName}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize">{r.category?.replace(/_/g, ' ')}</p>
                  </div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && !query && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40"
        />
      )}
    </div>
  );
}