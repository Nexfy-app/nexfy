import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Map, Search, Briefcase, MessageSquare, User, ToggleRight, Camera, Star, Zap, Shield } from 'lucide-react';

const steps = [
  {
    icon: Map,
    emoji: '🗺️',
    title: 'Mapa em Tempo Real',
    description: 'Veja todos os profissionais disponíveis perto de você no mapa. Os pins verdes são profissionais online agora, prontos para te atender.',
    tip: 'Toque num pin para ver o perfil do profissional.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Search,
    emoji: '🔍',
    title: 'Explorar Profissionais',
    description: 'Na aba "Explorar", você encontra todos os profissionais cadastrados. Filtre por categoria (elétrica, limpeza, encanamento...) ou pesquise pelo nome.',
    tip: 'Use os filtros de categoria para encontrar o serviço que precisa.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: ChevronRight,
    emoji: '📋',
    title: 'Contratar um Profissional',
    description: 'Toque no card de um profissional, descreva o que precisa, informe o endereço e confirme. O profissional receberá uma notificação imediatamente.',
    tip: 'Ative "Serviço Urgente" se precisar de atendimento rápido.',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: Camera,
    emoji: '📸',
    title: 'Envie Fotos no Chat',
    description: 'No chat com o profissional, você pode enviar fotos do problema. Isso ajuda o profissional a dar um orçamento mais preciso antes de aceitar.',
    tip: 'Toque no ícone de clipe no chat para enviar fotos ou arquivos.',
    color: 'from-pink-500 to-pink-600',
  },
  {
    icon: Briefcase,
    emoji: '⚡',
    title: 'Acompanhe seus Pedidos',
    description: 'Em "Pedidos" você acompanha o status de cada serviço: Aguardando → Aceito → Em andamento → Concluído. O profissional atualiza conforme avança.',
    tip: 'Ao final, você recebe um código de confirmação para validar o serviço.',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: Star,
    emoji: '⭐',
    title: 'Avalie o Profissional',
    description: 'Após o serviço ser concluído, avalie o profissional com 1 a 5 estrelas e deixe um comentário. Isso ajuda outros clientes a escolherem bem.',
    tip: 'Avaliações honestas fortalecem a comunidade do Serfy.',
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    icon: ToggleRight,
    emoji: '🟢',
    title: 'Profissional: Fique Online',
    description: 'Se você é profissional, acesse seu Perfil e ative o botão "Disponível agora". Você aparecerá no mapa para clientes próximos.',
    tip: 'Mantenha seu perfil atualizado com foto, bio e categorias de serviço.',
    color: 'from-teal-500 to-teal-600',
  },
  {
    icon: Shield,
    emoji: '🔒',
    title: 'Pagamento Direto & Seguro',
    description: 'O Serfy não processa pagamentos. Clientes e profissionais combinam o valor e a forma de pagamento diretamente (Pix, dinheiro, etc.).',
    tip: 'Combine tudo pelo chat antes de começar o serviço.',
    color: 'from-slate-500 to-slate-700',
  },
];

export default function AppTutorial() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  const handleClose = () => {
    setOpen(false);
    setStep(0);
  };

  return (
    <>
      {/* Trigger button — small and unobtrusive */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-white/80 border border-slate-200 rounded-full px-2.5 py-1 text-[10px] text-slate-500 hover:text-foreground hover:border-slate-400 transition-all shadow-sm font-medium"
        title="Como usar o Serfy"
      >
        <span className="text-[11px]">📖</span>
        Como usar
      </button>

      {/* Overlay via portal para cobrir tudo */}
      {open && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              style={{ width: '100%', maxWidth: '384px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', background: 'white' }}
            >
              {/* Header gradient */}
              <div className={`bg-gradient-to-br ${current.color} p-6 pb-8 relative`}>
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                <div className="text-5xl mb-3">{current.emoji}</div>
                <h2 className="text-xl font-bold text-white">{current.title}</h2>
                {/* Step dots */}
                <div className="flex gap-1.5 mt-3">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === step ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="px-5 pt-5 pb-5 -mt-4 bg-white rounded-t-3xl relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-sm text-foreground leading-relaxed">{current.description}</p>
                    <div className="mt-3 bg-slate-50 border border-slate-100 rounded-2xl px-3.5 py-2.5 flex items-start gap-2">
                      <span className="text-base shrink-0">💡</span>
                      <p className="text-xs text-slate-600 leading-relaxed">{current.tip}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-5">
                  <button
                    onClick={() => setStep(s => s - 1)}
                    disabled={isFirst}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition disabled:opacity-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>
                  <span className="text-xs text-muted-foreground">{step + 1} / {steps.length}</span>
                  {isLast ? (
                    <button
                      onClick={handleClose}
                      className="flex items-center gap-1.5 bg-foreground text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition"
                    >
                      Começar!
                    </button>
                  ) : (
                    <button
                      onClick={() => setStep(s => s + 1)}
                      className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:opacity-70 transition"
                    >
                      Próximo
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}