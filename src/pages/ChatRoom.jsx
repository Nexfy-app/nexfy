import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Paperclip, Mic, Image, Phone, X, Play, StopCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

function MessageBubble({ msg, isMe }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const time = msg.created_date
    ? new Date(msg.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-end gap-1 mb-1", isMe ? "justify-end" : "justify-start")}
    >
      <div className={cn(
        "max-w-[78%] rounded-2xl px-3 py-2",
        isMe
          ? "bg-foreground text-background rounded-br-sm"
          : "bg-card border rounded-bl-sm"
      )}>
        {msg.message_type === 'image' && msg.file_url && (
          <img src={msg.file_url} alt="imagem" className="rounded-xl max-w-full max-h-52 object-cover mb-1" />
        )}
        {msg.message_type === 'audio' && msg.file_url && (
          <div className="flex items-center gap-2 py-1 min-w-[160px]">
            <audio ref={audioRef} src={msg.file_url} onEnded={() => setPlaying(false)} />
            <button onClick={toggleAudio} className={cn("w-8 h-8 rounded-full flex items-center justify-center", isMe ? "bg-white/20" : "bg-foreground/10")}>
              {playing ? <StopCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex-1 h-1 rounded-full bg-current opacity-20" />
            <span className="text-[10px] opacity-60">áudio</span>
          </div>
        )}
        {msg.message_type === 'file' && msg.file_url && (
          <a href={msg.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 py-1">
            <Paperclip className="w-4 h-4 shrink-0" />
            <span className="text-xs underline truncate max-w-[140px]">{msg.file_name || 'arquivo'}</span>
          </a>
        )}
        {msg.message && (
          <p className="text-sm leading-snug">{msg.message}</p>
        )}
        <div className={cn("flex items-center justify-end gap-1 mt-0.5", isMe ? "text-white/50" : "text-muted-foreground")}>
          <span className="text-[9px]">{time}</span>
          {isMe && (
            <span className="text-[9px]">{msg.is_read ? '✓✓' : '✓'}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatRoom() {
  const requestId = window.location.pathname.split('/chat/')[1];
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [showAttach, setShowAttach] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
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
    // email notification
    const receiverEmail = getReceiverEmail();
    if (receiverEmail && type === 'text') {
      base44.integrations.Core.SendEmail({
        to: receiverEmail,
        subject: `💬 Nova mensagem de ${user.full_name || user.email}`,
        body: `Você recebeu uma nova mensagem:\n\n"${content}"\n\nAbra o ServiçosJá para responder.`,
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
    toast.loading('Enviando arquivo...');
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    toast.dismiss();
    await sendMessage('', type, file_url, file.name);
  };

  const handleRecord = async () => {
    if (recording) {
      mediaRecorder?.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
      toast.loading('Enviando áudio...');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      toast.dismiss();
      await sendMessage('', 'audio', file_url, 'audio.webm');
    };
    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
  };

  const otherName = request
    ? (request.client_email === user?.email ? request.professional_name : request.client_name)
    : 'Chat';

  const otherPhone = request?.client_email === user?.email ? otherPro?.phone : null;

  const isOnline = true; // real-time presence could be added later

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#ece5dd' }}>
      {/* Header */}
      <div className="bg-foreground text-background px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate('/chat')} className="opacity-70 hover:opacity-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">
            {otherName?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{otherName}</p>
            <p className="text-[10px] opacity-60">{isOnline ? 'online' : 'offline'}</p>
          </div>
          {otherPhone && (
            <a
              href={`tel:${otherPhone}`}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-medium transition"
            >
              <Phone className="w-3.5 h-3.5" />
              Ligar
            </a>
          )}
          {otherPhone && (
            <a
              href={`https://wa.me/55${otherPhone?.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-full text-xs font-medium transition"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Safety banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start gap-2">
        <span className="text-sm">🔒</span>
        <p className="text-[10px] text-amber-800 leading-tight">
          <strong>Dica de segurança:</strong> Combine tudo pelo app para registros. Faça pagamentos apenas após o serviço concluído e somente a profissionais de confiança.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isMe={msg.sender_email === user?.email} />
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Attach panel */}
      <AnimatePresence>
        {showAttach && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-card border-t px-4 py-3 flex gap-4"
          >
            <label className="flex flex-col items-center gap-1 cursor-pointer">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Image className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-[10px] text-muted-foreground">Foto</span>
            </label>
            <label className="flex flex-col items-center gap-1 cursor-pointer">
              <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Paperclip className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-[10px] text-muted-foreground">Arquivo</span>
            </label>
            <button onClick={() => setShowAttach(false)} className="ml-auto text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="bg-card border-t p-2 pb-safe">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAttach(!showAttach)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition text-muted-foreground"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 bg-secondary rounded-full px-4 py-2 min-h-[40px] flex items-center">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Mensagem"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {message.trim() ? (
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-10 h-10 bg-foreground text-background rounded-full flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleRecord}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition",
                recording ? "bg-red-500 text-white" : "bg-foreground text-background"
              )}
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
        {recording && (
          <p className="text-xs text-red-500 text-center mt-1 animate-pulse">● Gravando... toque para parar</p>
        )}
      </div>
    </div>
  );
}