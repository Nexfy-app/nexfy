import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function ChatList() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

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
      return Object.values(unique).filter(r => r.status !== 'cancelled');
    },
    enabled: !!user?.email,
  });

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b px-4 pt-safe">
        <div className="pt-4 pb-3">
          <h1 className="text-xl font-bold">Mensagens</h1>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {requests.length > 0 ? requests.map(r => (
          <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Link
              to={`/chat/${r.id}`}
              className="flex items-center gap-3 bg-card rounded-2xl border p-4 hover:shadow-sm transition"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {r.client_email === user?.email ? r.professional_name : r.client_name}
                </p>
                <p className="text-xs text-muted-foreground capitalize truncate">
                  {r.category?.replace(/_/g, ' ')} · {r.status?.replace(/_/g, ' ')}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {r.created_date && format(new Date(r.created_date), 'dd/MM')}
              </span>
            </Link>
          </motion.div>
        )) : (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}