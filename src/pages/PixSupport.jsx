import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Shield, Paperclip } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isThinking = message.role === 'assistant' && !message.content && message.tool_calls?.length > 0;

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-foreground flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-foreground text-white rounded-br-sm'
              : 'bg-white border border-slate-100 text-foreground rounded-bl-sm'
          }`} style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {isUser ? (
              <p>{message.content}</p>
            ) : (
              <ReactMarkdown
                className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {isThinking && (
          <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PixSupport() {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: 'pix_support',
          metadata: { name: 'Suporte PIX' }
        });
        setConversation(conv);
        setMessages(conv.messages || []);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending || !conversation) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: text });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const visibleMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 px-4 pt-12 pb-3 flex items-center gap-3 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-9 h-9 rounded-2xl bg-foreground flex items-center justify-center">
          <Shield className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground">Suporte SERV</p>
          <p className="text-[11px] text-muted-foreground">Assistente de pedidos</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : visibleMessages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-4 text-center px-6"
          >
            <div className="w-16 h-16 rounded-3xl bg-foreground flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground text-base">Suporte SERV</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Problemas com algum pedido de serviço? Estou aqui para ajudar!
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {['Meu código de confirmação não funciona', 'Quero cancelar meu pedido', 'Tenho um problema com o profissional'].map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm text-foreground font-medium hover:border-foreground/30 transition text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {visibleMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageBubble message={msg} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="shrink-0 px-4 py-3 bg-white border-t border-slate-100"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 focus-within:border-foreground/30 transition">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva o problema..."
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground max-h-32"
              style={{ lineHeight: '1.5' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || !conversation}
            className="w-10 h-10 rounded-2xl bg-foreground flex items-center justify-center shrink-0 disabled:opacity-40 transition active:scale-95"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}