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

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
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

  // Fetch unread counts per request
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
        style={{ background: 'rgba(245,247,250,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <div className="pt-12 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Mensagens</h1>
            {totalUnread > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-medium">{requests.length} conversa{requests.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* List */}
      <div className="px-4 space-y-2 pt-2 pb-6">
        {requests.length > 0 ? requests.map((r, i) => {
          const otherName = r.client_email === user?.email ? r.professional_name : r.client_name;
          const initials = otherName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
          const dateLabel = r.updated_date
            ? format(new Date(r.updated_date), 'dd/MM', { locale: ptBR })
            : r.created_date
              ? format(new Date(r.created_date), 'dd/MM', { locale: ptBR })
              : '';
          const unread = unreadByRequest[r.id] || 0;

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/chat/${r.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 transition-all hover:shadow-md active:scale-[0.98]"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              >
                {/* Avatar with unread indicator */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {initials}
                  </div>
                  {unread > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-[9px] font-black text-white">{unread > 9 ? '9+' : unread}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn("text-sm truncate", unread > 0 ? "font-bold text-foreground" : "font-semibold text-foreground")}>
                      {otherName}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2 font-medium">{dateLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground capitalize truncate">
                      {r.category?.replace(/_/g, ' ')}
                    </p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 ${STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-bold text-foreground">Nenhuma conversa ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Contrate um profissional para iniciar uma conversa</p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}