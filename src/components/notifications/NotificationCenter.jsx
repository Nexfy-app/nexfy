import React, { useState } from 'react';
import { Bell, X, CheckCheck, Inbox } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const TYPE_ICONS = {
  new_request: '📋',
  request_accepted: '✅',
  request_in_progress: '🔧',
  request_completed: '🎉',
  new_message: '💬',
  request_cancelled: '❌'
};

export default function NotificationCenter({ userEmail }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail }, '-created_date', 30),
    enabled: !!userEmail,
    refetchInterval: 8000
  });

  const unread = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    const unreadItems = notifications.filter((n) => !n.is_read);
    await Promise.all(unreadItems.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
  };

  const handleClick = async (notif) => {
    if (!notif.is_read) {
      await base44.entities.Notification.update(notif.id, { is_read: true });
      queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
    }
    if (notif.link) {
      navigate(notif.link);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition">
        
        <Bell className="lucide lucide-bell w-5 h-5 hidden" />
        {unread > 0 &&
        <span className="absolute top-1 right-1 w-4 h-4 bg-foreground text-background text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        }
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full max-w-sm p-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <h2 className="font-bold text-base">Notificações</h2>
              {unread > 0 &&
              <span className="bg-foreground text-background text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unread}
                </span>
              }
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 &&
              <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition">
                  <CheckCheck className="w-3.5 h-3.5" /> Marcar lidas
                </button>
              }
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ?
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-16">
                <Inbox className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">Nenhuma notificação</p>
              </div> :

            <AnimatePresence>
                {notifications.map((notif) =>
              <motion.button
                key={notif.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => handleClick(notif)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b transition hover:bg-secondary/50 ${!notif.is_read ? 'bg-secondary/30' : ''}`}>
                
                    <span className="text-xl shrink-0 mt-0.5">{TYPE_ICONS[notif.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read &&
                    <span className="w-2 h-2 bg-foreground rounded-full shrink-0 mt-1.5" />
                    }
                      </div>
                      {notif.body &&
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
                  }
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {notif.created_date && formatDistanceToNow(new Date(notif.created_date), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </motion.button>
              )}
              </AnimatePresence>
            }
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-3">
            <Link
              to="/notifications/settings"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1.5">
              
              ⚙️ Configurar notificações por e-mail
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>);

}