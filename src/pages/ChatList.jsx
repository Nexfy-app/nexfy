import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

const STATUS_LABELS = {
  pending: 'Aguardando',
  accepted: 'Aceito',
  in_progress: 'Em andamento',
  completed: 'Concluído',
};

export default function ChatList() {
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: requests = [] } = useQuery({
    queryKey: ['chat-requests', user?.email],
    queryFn: async () => {
      const asClient = await base44.entities.ServiceRequest.filter({ client_email: user.email });
      const proData = await base44.entities.Professional.filter({ user_email: user.email });
      let asProvider = [];
      if (proData.length > 0) {
        asProvider = await base44.entities.ServiceRequest.filter({ professional_id: proData[0].id });
      }
      const all = [...asClient, ...asProvider];
      const unique = all.reduce((acc, r) => { acc[r.id] = r; return acc; }, {});
      return Object.values(unique)
        .filter(r => r.status !== 'cancelled')
        .sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* WhatsApp-style header */}
      <div className="sticky top-0 z-10 bg-foreground text-background px-4 pt-safe">
        <div className="pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Conversas</h1>
          <span className="text-xs opacity-60">{requests.length} ativas</span>
        </div>
      </div>

      <div className="divide-y">
        {requests.length > 0 ? requests.map((r, i) => {
          const otherName = r.client_email === user?.email ? r.professional_name : r.client_name;
          const initials = otherName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
          const dateLabel = r.updated_date
            ? format(new Date(r.updated_date), 'dd/MM', { locale: ptBR })
            : r.created_date
              ? format(new Date(r.created_date), 'dd/MM', { locale: ptBR })
              : '';

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                to={`/chat/${r.id}`}
                className="flex items-center gap-3 bg-card hover:bg-secondary px-4 py-3 transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center text-background font-bold text-sm shrink-0">
                  {initials || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">{otherName}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{dateLabel}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground capitalize truncate">
                      {r.category?.replace(/_/g, ' ')}
                    </p>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-2 shrink-0 ${
                      r.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      r.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      r.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="text-5xl mb-4">💬</div>
            <p className="font-semibold text-foreground">Nenhuma conversa ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Contrate um profissional para iniciar uma conversa
            </p>
          </div>
        )}
      </div>
    </div>
  );
}