import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Loader2, Sparkles, LifeBuoy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  if (!message.content) return null;
  return (
    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-foreground flex items-center justify-center shrink-0 mt-0.5">
          <LifeBuoy className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-foreground text-white rounded-br-md'
            : 'bg-white border border-slate-100 text-foreground rounded-bl-md prose prose-sm max-w-none'
        }`}
        style={{ boxShadow: isUser ? 'none' : '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function Support() {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initConversation = async () => {
    setLoading(true);
    const conv = await base44.agents.createConversation({
      agent_name: 'suporte',
      metadata: { name: 'Suporte Nexfy' },
    });
    setConversation(conv);

    base44.agents.subscribeToConversation(conv.id, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg?.role === 'assistant') {
        setLoading(false);
      }
    });

    await base44.agents.addMessage(conv, {
      role: 'user',
      content: '__init__',
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !conversation) return;
    const text = input.trim();
    setInput('');
    setLoading(true);
    await base44.agents.addMessage(conversation, { role: 'user', content: text });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const visibleMessages = messages.filter(m => m.content && m.content !== '__init__');

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="shrink-0 px-4 pt-12 pb-3 flex items-center gap-3 bg-background border-b border-slate-100">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center shrink-0">
          <LifeBuoy className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">Suporte Nexfy</h1>
          <p className="text-[11px] text-muted-foreground">Assistente de ajuda</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {visibleMessages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-xl bg-foreground flex items-center justify-center shrink-0">
              <LifeBuoy className="w-3.5 h-3.5 text-white" />
            </div>
            <div
              className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-2.5"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-8 pt-3 border-t border-slate-100 bg-background">
        <div
          className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 px-4 py-2.5"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva seu problema..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-8 h-8 bg-foreground text-white rounded-xl flex items-center justify-center disabled:opacity-40 transition hover:opacity-80 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}