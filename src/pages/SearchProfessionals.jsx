import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Search, Send, Loader2, Bot, User, Star, MapPin, Briefcase, CheckCircle2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProfessionalSheet from '../components/home/ProfessionalSheet';
import { SERVICE_CATEGORIES } from '@/lib/constants';

const CONNECTOR_ID = 'busca_profissional';

function ProfessionalCard({ pro, onSelect, index }) {
  const getCategoryLabel = (id) => {
    const cat = SERVICE_CATEGORIES.find(c => c.id === id);
    return cat ? cat.label : id;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={() => onSelect(pro)}
      className="bg-white rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100">
            {pro.photo_url ? (
              <img src={pro.photo_url} alt={pro.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-xl font-bold text-slate-600">
                {pro.name?.charAt(0)}
              </div>
            )}
          </div>
          {pro.is_available && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm text-foreground truncate">{pro.name}</h3>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-foreground">{pro.rating_avg?.toFixed(1) || '0.0'}</span>
              <span className="text-[10px] text-muted-foreground">({pro.rating_count || 0})</span>
            </div>
            <span className="text-slate-200">·</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              {pro.services_completed || 0} serviços
            </span>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {pro.categories?.slice(0, 3).map(cat => (
              <span key={cat} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {getCategoryLabel(cat)}
              </span>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="shrink-0 text-right">
          {pro.price_min ? (
            <>
              <p className="text-[10px] text-muted-foreground">a partir de</p>
              <p className="text-sm font-black text-foreground">R$ {pro.price_min}</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Sob consulta</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-foreground flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isUser
          ? 'bg-foreground text-white rounded-br-md'
          : 'bg-white border border-slate-100 text-foreground rounded-bl-md'
      }`}
        style={{ boxShadow: isUser ? 'none' : '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        {message.content}
      </div>
    </div>
  );
}

export default function SearchProfessionals() {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState([]);
  const [selectedPro, setSelectedPro] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const initialQuery = new URLSearchParams(window.location.search).get('q') || '';

  useEffect(() => {
    initConversation(initialQuery);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, professionals]);

  const initConversation = async (query = '') => {
    const conv = await base44.agents.createConversation({
      agent_name: 'busca_profissional',
      metadata: { name: 'Busca de Profissional' },
    });
    setConversation(conv);

    base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages(data.messages || []);
      extractProfessionals(data.messages || []);
    });

    if (query) {
      // Send the query directly
      setLoading(true);
      await base44.agents.addMessage(conv, { role: 'user', content: query });
      setLoading(false);
    } else {
      // Generic greeting
      setLoading(true);
      await base44.agents.addMessage(conv, { role: 'user', content: '__init__' });
      setLoading(false);
    }
  };

  const extractProfessionals = async (msgs) => {
    // After agent responds, fetch professionals based on last user query
    // We'll search after each assistant response
    const lastUser = [...msgs].reverse().find(m => m.role === 'user' && m.content !== '__init__');
    if (!lastUser) return;
    const query = lastUser.content.toLowerCase();

    const allPros = await base44.entities.Professional.filter({ status: 'active', is_available: true });

    // Find matching category
    const { SERVICE_CATEGORIES: cats } = await import('@/lib/constants');
    const matchedCat = cats.find(c =>
      query.includes(c.label.toLowerCase()) ||
      query.includes(c.id.toLowerCase()) ||
      c.label.toLowerCase().split(' ').some(w => w.length > 3 && query.includes(w))
    );

    let filtered = matchedCat
      ? allPros.filter(p => p.categories?.includes(matchedCat.id))
      : allPros;

    // Sort by rating descending
    filtered = filtered.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
    setProfessionals(filtered.slice(0, 8));
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !conversation) return;
    const text = input.trim();
    setInput('');
    setLoading(true);
    await base44.agents.addMessage(conversation, { role: 'user', content: text });
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSelectPro = (pro) => {
    setSelectedPro(pro);
    setSheetOpen(true);
  };

  const visibleMessages = messages.filter(m => m.content && m.content !== '__init__');

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="shrink-0 px-4 pt-12 pb-3 flex items-center gap-3 bg-background border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">Busca Inteligente</h1>
          <p className="text-[11px] text-muted-foreground">Diga o que você precisa</p>
        </div>
      </div>

      {/* Messages + Cards */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Chat messages */}
        {visibleMessages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-xl bg-foreground flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-2.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Professional Cards */}
        <AnimatePresence>
          {professionals.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2.5 pt-1"
            >
              <p className="text-xs font-semibold text-muted-foreground px-1">
                {professionals.length} profissional{professionals.length !== 1 ? 'is' : ''} encontrado{professionals.length !== 1 ? 's' : ''}
              </p>
              {professionals.map((pro, i) => (
                <ProfessionalCard
                  key={pro.id}
                  pro={pro}
                  onSelect={handleSelectPro}
                  index={i}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-8 pt-3 border-t border-slate-100 bg-background">
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 px-4 py-2.5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: preciso de um eletricista urgente..."
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

      <ProfessionalSheet
        professional={selectedPro}
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSelectedPro(null); }}
      />
    </div>
  );
}