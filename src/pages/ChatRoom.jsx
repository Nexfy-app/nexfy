import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Paperclip, Image, Phone, X, CheckCheck, Check, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import PixPaymentModal from '../components/chat/PixPaymentModal';

function MessageBubble({ msg, isMe }) {
  const time = msg.created_date
    ? new Date(msg.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn("flex mb-1.5", isMe ? "justify-end" : "justify-start")}
    >
      <div className={cn(
        "max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm",
        isMe
          ? "bg-foreground text-white rounded-br-md"
          : "bg-white text-foreground rounded-bl-md border border-slate-100"
      )}>
        {msg.message_type === 'image' && msg.file_url && (
          <img src={msg.file_url} alt="imagem" className="rounded-xl max-w-full max-h-52 object-cover mb-1.5" />
        )}
        {msg.message_type === 'file' && msg.file_url && (
          <a href={msg.file_url} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 py-1 hover:opacity-80">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", isMe ? "bg-white/15" : "bg-slate-100")}>
              <Paperclip className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium underline truncate max-w-[140px]">{msg.file_name || 'arquivo'}</span>
          </a>
        )}
        {msg.message && (
          <p className="text-sm leading-relaxed">{msg.message}</p>
        )}
        <div className={cn("flex items-center justify-end gap-1 mt-1", isMe ? "text-white/40" : "text-muted-foreground")}>
          <span className="text-[10px]">{time}</span>
          {isMe && (
            msg.is_read
              ? <CheckCheck className="w-3 h-3 text-blue-400" />
              : <Check className="w-3 h-3 opacity-60" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DateDivider({ label }) {
  return (
    <div className="flex items-center gap-2 my-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[10px] text-muted-foreground font-medium bg-transparent px-2">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function groupMessagesByDate(messages) {
  const groups = [];
  let lastDate = null;
  messages.forEach(msg => {
    if (!msg.created_date) return;
    const d = new Date(msg.created_date);
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    if (label !== lastDate) {
      groups.push({ type: 'divider', label });
      lastDate = label;
    }
    groups.push({ type: 'msg', msg });
  });
  return groups;
}

export default function ChatRoom() {
  const requestId = window.location.pathname.split('/chat/')[1];
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', requestId],
    queryFn: () => base44.entities.ChatMessage.filter({ service_request_id: requestId }, 'created_date'),
    enabled: !!requestId,
    refetchInterval: 3000,
  });

  const { data: request } = useQuery({
    queryKey: ['chat-request', requestId],
    queryFn: async () => {
      const r = await base44.entities.ServiceRequest.filter({ id: requestId });
      return r[0];
    },
    enabled: !!requestId,
  });

  const { data: proData } = useQuery({
    queryKey: ['pro-for-chat', request?.professional_id],
    queryFn: () => base44.entities.Professional.filter({ id: request.professional_id }),
    enabled: !!request?.professional_id,
  });

  const otherPro = proData?.[0];

  // Mark received messages as read
  useEffect(() => {
    if (!user || !messages.length) return;
    const unread = messages.filter(m => m.receiver_email === user.email && !m.is_read);
    unread.forEach(m => {
      base44.entities.ChatMessage.update(m.id, { is_read: true }).catch(() => {});
    });
  }, [messages, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getReceiverEmail = () => {
    if (!request || !user) return '';
    if (request.client_email === user.email) return otherPro?.user_email || '';
    return request.client_email;
  };

  const sendMessage = async (content, type = 'text', fileUrl = null, fileName = null) => {
    setSending(true);
    await base44.entities.ChatMessage.create({
      service_request_id: requestId,
      sender_email: user.email,
      receiver_email: getReceiverEmail(),
      message: content || '',
      message_type: type,
      file_url: fileUrl,
      file_name: fileName,
      is_read: false,
    });
    const receiverEmail = getReceiverEmail();
    if (receiverEmail && type === 'text') {
      base44.integrations.Core.SendEmail({
        to: receiverEmail,
        subject: `💬 Nova mensagem de ${user.full_name || user.email}`,
        body: `"${content}"\n\nAbra o ServiçosJá para responder.`,
      }).catch(() => {});
    }
    queryClient.invalidateQueries({ queryKey: ['chat-messages', requestId] });
    setSending(false);
  };

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    const text = message.trim();
    setMessage('');
    await sendMessage(text, 'text');
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowAttach(false);
    toast.loading('Enviando...');
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    toast.dismiss();
    await sendMessage('', type, file_url, file.name);
  };

  const otherName = request
    ? (request.client_email === user?.email ? request.professional_name : request.client_name)
    : 'Chat';

  const otherPhone = request?.client_email === user?.email ? otherPro?.phone : null;
  const grouped = groupMessagesByDate(messages);

  const unreadCount = messages.filter(m => m.receiver_email === user?.email && !m.is_read).length;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div
        className="px-4 pt-safe shrink-0"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-3 py-3">
          <button
            onClick={() => navigate('/chat')}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-sm">
            {otherName?.charAt(0)?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate text-foreground">{otherName}</p>
            <p className="text-[10px] text-muted-foreground capitalize">
              {request?.category?.startsWith('outros:') ? request.category.replace('outros:', '') : request?.category?.replace(/_/g, ' ')} · {request?.status === 'in_progress' ? '🟢 Em andamento' : request?.status === 'completed' ? '✅ Concluído' : '⏳ Aguardando'}
            </p>
          </div>

          {otherPhone && (
            <a
              href={`tel:${otherPhone}`}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
            >
              <Phone className="w-4 h-4 text-foreground" />
            </a>
          )}
        </div>
      </div>

      {/* Security notice + PIX CTA */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2 shrink-0">
        <span className="text-xs">ℹ️</span>
        <p className="text-[10px] text-slate-600 flex-1">
          Este app <strong>não processa pagamentos</strong>. Pagamentos são realizados diretamente entre as partes.
        </p>
        {otherPro?.pix_key && request?.client_email === user?.email && (
          <button
            onClick={() => setShowPix(true)}
            className="shrink-0 flex items-center gap-1 bg-green-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full hover:bg-green-700 transition"
          >
            <QrCode className="w-3 h-3" />
            Pagar PIX
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {grouped.map((item, i) =>
          item.type === 'divider'
            ? <DateDivider key={`d-${i}`} label={item.label} />
            : <MessageBubble key={item.msg.id} msg={item.msg} isMe={item.msg.sender_email === user?.email} />
        )}
        <div ref={scrollRef} />
      </div>

      {/* PIX Modal */}
      {showPix && otherPro && (
        <PixPaymentModal
          professional={otherPro}
          request={request}
          onClose={() => setShowPix(false)}
        />
      )}

      {/* Attach panel */}
      <AnimatePresence>
        {showAttach && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="bg-white border-t border-slate-100 px-4 py-3 flex gap-4 shrink-0"
          >
            <label className="flex flex-col items-center gap-1.5 cursor-pointer">
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                <Image className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Foto</span>
            </label>
            <label className="flex flex-col items-center gap-1.5 cursor-pointer">
              <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Paperclip className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Arquivo</span>
            </label>
            <button onClick={() => setShowAttach(false)} className="ml-auto text-muted-foreground self-center">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="bg-white border-t border-slate-100 px-3 py-2 pb-safe shrink-0" style={{ boxShadow: '0 -1px 12px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAttach(!showAttach)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition text-muted-foreground"
          >
            <Paperclip className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
          </button>

          <div className="flex-1 bg-slate-100 rounded-full px-4 py-2 min-h-[40px] flex items-center">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Mensagem..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="w-9 h-9 bg-foreground text-white rounded-full flex items-center justify-center transition disabled:opacity-30 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}