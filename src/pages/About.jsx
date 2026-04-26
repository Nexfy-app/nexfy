import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, Star, Shield } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 max-w-2xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <h1 className="text-3xl font-black text-foreground mb-4">Sobre o SERV</h1>

      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
        O <strong>SERV</strong> é uma plataforma brasileira que conecta clientes a profissionais de serviços locais em tempo real. Nossa missão é simples: tornar a contratação de um eletricista, encanador, pintor, diarista ou qualquer outro profissional tão fácil quanto pedir uma pizza.
      </p>

      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
        Por meio de um mapa interativo, os clientes visualizam instantaneamente quais profissionais estão disponíveis nas proximidades, podem filtrar por categoria de serviço e entrar em contato diretamente pelo chat integrado. Toda a negociação — descrição do serviço, endereço e valor combinado — acontece dentro do próprio aplicativo, de forma rápida e transparente.
      </p>

      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
        Para os profissionais, o SERV oferece visibilidade gratuita no mapa da região, painel de desempenho com histórico de serviços e avaliações, além de um sistema de verificação de documentos e certificados que transmite mais confiança aos clientes. Basta ativar a disponibilidade e começar a receber pedidos.
      </p>

      <p className="text-muted-foreground text-sm leading-relaxed mb-8">
        O SERV é desenvolvido e mantido por uma equipe apaixonada por tecnologia e por melhorar a vida de trabalhadores autônomos e de quem precisa de serviços de qualidade no Brasil. Acreditamos que a tecnologia deve aproximar pessoas e criar oportunidades reais para profissionais qualificados em todo o país.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { icon: MapPin, label: 'Profissionais no mapa em tempo real' },
          { icon: Briefcase, label: 'Contratação rápida e simples' },
          { icon: Star, label: 'Avaliações verificadas' },
          { icon: Shield, label: 'Documentos e certificados validados' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="bg-white rounded-2xl p-4 flex items-start gap-3 shadow-sm border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-foreground" />
            </div>
            <p className="text-xs font-medium text-foreground leading-snug">{label}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link to="/contact" className="inline-flex items-center gap-2 bg-foreground text-white text-sm font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition">
          Fale Conosco
        </Link>
      </div>
    </div>
  );
}