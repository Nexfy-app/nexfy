import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Preencha todos os campos.');
      return;
    }
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: 'spage.suporte@gmail.com',
      subject: `[Nexfy Contato] ${form.name}`,
      body: `Nome: ${form.name}\nEmail: ${form.email}\n\nMensagem:\n${form.message}`,
    });
    toast.success('Mensagem enviada! Responderemos em breve.');
    setForm({ name: '', email: '', message: '' });
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 max-w-lg mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <h1 className="text-3xl font-black text-foreground mb-2">Fale Conosco</h1>
      <p className="text-muted-foreground text-sm mb-8">Tem dúvidas, sugestões ou precisa de suporte? Entre em contato:</p>

      <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-slate-100 shadow-sm mb-6">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <Mail className="w-4 h-4 text-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">E-mail</p>
          <a href="mailto:spage.suporte@gmail.com" className="text-sm font-semibold text-foreground hover:underline">
            spage.suporte@gmail.com
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Seu nome</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="João Silva"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-foreground/40 focus:bg-white transition"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Seu e-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="joao@email.com"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-foreground/40 focus:bg-white transition"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Mensagem</label>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="Como podemos ajudar?"
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-foreground/40 focus:bg-white transition resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="w-full h-12 bg-foreground text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
        >
          {sending ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Enviar mensagem</>}
        </button>
      </form>
    </div>
  );
}