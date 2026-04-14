import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

const STATUS_LABELS = {
  pending: 'Aguardando',
  accepted: 'Aceito',
  in_progress: 'Em andamento',
  completed: 'Concluído',
};

const STATUS_STYLES = {
  pending: { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' },
  accepted: { background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' },
  in_progress: { background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' },
  completed: { background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' },
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

  const { data: allMessages = [] } = useQuery({
    queryKey: ['all-unread-messages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.ChatMessage.filter({ receiver_email: user.email, is_read: false });
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  const unreadByRequest = allMessages.reduce((acc, msg) => {
    acc[msg.service_request_id] = (acc[msg.service_request_id] || 0) + 1;
    return acc;
  }, {});

  const totalUnread = allMessages.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4"
        style={{
          background: 'rgba(14,16,22,0.85)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="pt-14 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-foreground tracking-tight">Mensagens</h1>
            {totalUnread > 0 && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                style={{ background: 'hsl(var(--primary))', boxShadow: '0 0 10px rgba(59,130,246,0.4)' }}
              >
                {totalUnread > 9 ? '9+' : totalUnread}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {requests.length} conversa{requests.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="px-4 space-y-2 pt-3 pb-6">
        {requests.length > 0 ? requests.map((r, i) => {
          const otherName = r.client_email === user?.email ? r.professional_name : r.client_name;
          const initials = otherName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
          const dateLabel = r.updated_date
            ? format(new Date(r.updated_date), 'dd/MM', { locale: ptBR })
            : r.created_date ? format(new Date(r.created_date), 'dd/MM', { locale: ptBR }) : '';
          const unread = unreadByRequest[r.id] || 0;
          const statusStyle = STATUS_STYLES[r.status] || { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' };

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/chat/${r.id}`}
                className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all active:opacity-70"
                style={{
                  background: unread > 0 ? 'rgba(59,130,246,0.06)' : 'hsl(var(--card))',
                  border: unread > 0 ? '1px solid rgba(59,130,246,0.15)' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
                }}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.6), rgba(59,130,246,0.3))', border: '1px solid rgba(59,130,246,0.3)' }}
                  >
                    {initials}
                  </div>
                  {unread > 0 && (
                    <div
                      className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white border-2 border-background"
                      style={{ background: 'hsl(var(--primary))', boxShadow: '0 0 8px rgba(59,130,246,0.5)' }}
                    >
                      {unread > 9 ? '9+' : unread}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm truncate ${unread > 0 ? 'font-black text-foreground' : 'font-semibold text-foreground'}`}>
                      {otherName}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2 font-medium">{dateLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground capitalize truncate">
                      {r.category?.replace(/_/g, ' ')}
                    </p>
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0"
                      style={statusStyle}
                    >
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.06)' }}>
              <MessageSquare className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-black text-foreground">Nenhuma conversa ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Contrate um profissional para iniciar uma conversa</p>
          </div>
        )}
      </div>
    </div>
  );
}