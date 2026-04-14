import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

export default function ChatRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  const requestId = window.location.pathname.split('/chat/')[1];
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', requestId],
    queryFn: () => base44.entities.ChatMessage.filter({ service_request_id: requestId }, 'created_date'),
    enabled: !!requestId,
    refetchInterval: 3000,
  });

  const { data: request } = useQuery({
    queryKey: ['chat-request', requestId],
    queryFn: async () => {
      const results = await base44.entities.ServiceRequest.filter({ id: requestId });
      return results[0];
    },
    enabled: !!requestId,
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    const receiverEmail = request.client_email === user.email
      ? (await base44.entities.Professional.filter({ id: request.professional_id }))?.[0]?.user_email
      : request.client_email;

    await base44.entities.ChatMessage.create({
      service_request_id: requestId,
      sender_email: user.email,
      receiver_email: receiverEmail || '',
      message: message.trim(),
    });
    setMessage('');
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ['chat-messages', requestId] });
  };

  const otherName = request
    ? (request.client_email === user?.email ? request.professional_name : request.client_name)
    : 'Chat';

  return (
    <div className="h-screen flex flex-col bg-secondary/30">
      {/* Header */}
      <div className="bg-card border-b px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate('/chat')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="font-semibold text-sm">{otherName}</p>
            <p className="text-[10px] text-muted-foreground capitalize">
              {request?.category?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => {
          const isMe = msg.sender_email === user?.email;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", isMe ? "justify-end" : "justify-start")}
            >
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5",
                isMe
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border rounded-bl-md"
              )}>
                <p className="text-sm">{msg.message}</p>
                <p className={cn(
                  "text-[9px] mt-1",
                  isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                )}>
                  {msg.created_date && new Date(msg.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="bg-card border-t p-3 pb-safe">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua mensagem..."
            className="rounded-xl bg-secondary border-0 h-11"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="rounded-xl h-11 w-11 shrink-0 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}