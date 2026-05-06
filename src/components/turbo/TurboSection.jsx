import React, { useState } from 'react';
import { Zap, ChevronDown, MapPin, Search, TrendingUp, Shield, BarChart2, Eye, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BENEFITS = [
{ icon: Zap, label: 'Selo Turbo no perfil', sub: 'Autoridade visual imediata' },
{ icon: MapPin, label: 'Destaque premium no mapa', sub: 'Apareça em primeiro lugar' },
{ icon: Search, label: 'Topo das pesquisas', sub: 'Antes dos profissionais comuns' },
{ icon: Shield, label: 'Mais confiança e autoridade', sub: 'Clientes preferem Turbo' },
{ icon: Eye, label: 'Visualizações do perfil', sub: 'Métricas em tempo real' },
{ icon: BarChart2, label: 'Buscas pelo seu serviço', sub: 'Veja seu alcance crescer' },
{ icon: TrendingUp, label: 'Mais alcance na plataforma', sub: 'Maior exposição orgânica' },
{ icon: Users, label: 'Mais chances de fechar clientes', sub: 'Visibilidade = mais pedidos' }];


export default function TurboSection({ onActivate, loading }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-3xl overflow-hidden w-full"
      style={{
        background: 'linear-gradient(160deg, #111111 0%, #0a0a0a 100%)',
        boxShadow: 'none'
      }}>
      
      {/* Sheen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.05) 0%, transparent 60%)' }} />
      

      {/* Main content */}
      <div className="relative px-4 sm:px-5 pt-5 pb-4 space-y-3">

        {/* Header row */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            <Zap className="w-5 h-5" style={{ color: '#f1f5f9' }} strokeWidth={2.5} />
          </div>
          <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <p className="text-base font-bold leading-tight" style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                Turbo Nexfy
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Plano premium mensal</p>
            </div>
            <div
              className="shrink-0 flex flex-col items-end rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', padding: '5px 10px' }}>
              
              <span className="text-sm font-black leading-tight whitespace-nowrap" style={{ color: '#f1f5f9', letterSpacing: '-0.03em' }}>R$12,90<span className="text-[9px] font-medium ml-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>/mês</span></span>
            </div>
          </div>
        </div>

        {/* Headline */}
        <div>
          <p className="text-sm font-semibold leading-snug" style={{ color: 'rgba(255,255,255,0.90)', letterSpacing: '-0.02em' }}>
            Apareça primeiro para novos clientes
          </p>
          <p className="text-xs leading-relaxed mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
            Por menos de R$0,43/dia, acompanhe visitas no perfil e buscas pelo seu serviço em tempo real.
          </p>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onActivate}
          disabled={loading}
          className="turbo-cta-btn w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          style={{
            background: 'linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)',
            color: '#0d0d0d',
            boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset, 0 4px 20px rgba(0,0,0,0.3)'
          }}>
          
          {loading ?
          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /> :

          <>
              <Zap className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              <span>Ativar Turbo</span>
            </>
          }
        </motion.button>

        {/* Ver benefícios */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-1 transition-opacity hover:opacity-80">
          
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {expanded ? 'Recolher benefícios' : 'Ver benefícios'}
          </span>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.60)' }} />
          </motion.div>
        </button>
      </div>

      {/* Expandable benefits */}
      <AnimatePresence initial={false}>
        {expanded &&
        <motion.div
          key="benefits"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ overflow: 'hidden' }}>
          
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <div className="px-4 sm:px-5 py-4 space-y-2">
              {BENEFITS.map(({ icon: Icon, label, sub }, i) =>
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.22, ease: 'easeOut' }}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 w-full min-w-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              
                  <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                
                    <Icon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.55)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.78)', letterSpacing: '-0.01em' }}>
                      {label}
                    </p>
                    <p className="text-[10px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                      {sub}
                    </p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'rgba(52,211,153,0.6)' }} />
                </motion.div>
            )}
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Footer note */}
      <p className="text-center text-[10px] pb-4" style={{ color: 'rgba(255,255,255,0.18)' }}>
        Cancele a qualquer momento · Sem fidelidade
      </p>
    </motion.div>);

}