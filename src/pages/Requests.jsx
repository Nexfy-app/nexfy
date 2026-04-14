import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, Zap, Star, MessageSquare, Shield, ChevronRight, Briefcase } from 'lucide-react';
import { createNotification, sendEmailIfEnabled } from '@/lib/notifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const STATUS_STEPS = [
  { key: 'pending', label: 'Aguardando', icon: Clock },
  { key: 'accepted', label: 'Aceito', icon: CheckCircle2 },
  { key: 'in_progress', label: 'Em Andamento', icon: Zap },
  { key: 'completed', label: 'Concluído', icon: CheckCircle2 },
];

function ConfirmationCode({ code }) {
  return (
    <div className="rounded-2xl p-4 mb-3" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-3.5 h-3.5 text-white/70" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Código de Confirmação</p>
      </div>
      <div className="flex gap-2">
        {code?.split('').map((digit, i) => (
          <div key={i} className="w-12 h-14 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-2xl font-black text-white">{digit}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-white/40 mt-2.5">Informe este código ao profissional para iniciar o serviço</p>
    </div>
  );
}

function TrackingSteps({ status }) {
  const steps = STATUS_STEPS;
  const currentIdx = steps.findIndex(s => s.key === status);

  return (
    <div className="flex items-center justify-between py-3 px-1 mb-2">
      {steps.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        const Icon = step.icon;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                done ? 'bg-foreground text-white' : 'bg-slate-100 text-muted-foreground'
              } ${active ? 'ring-4 ring-foreground/15 scale-110' : ''}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className={`text-[9px] font-semibold ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1.5 mb-4 rounded-full transition-all ${i < currentIdx ? 'bg-foreground' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SafetyBanner() {
  return (
    <div className="rounded-2xl p-3.5 mb-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
      <div className="flex gap-2.5">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
          <Shield className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
        </div>
        <div>
          <p className="text-xs font-bold mb-0.5" style={{ color: '#fbbf24' }}>Dica de Segurança</p>
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(251,191,36,0.7)' }}>
            Sempre pague <strong>após</strong> o serviço concluído. Nunca envie dinheiro antecipado.
          </p>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ request, isProvider, onAction, onRefetch }) {
  const navigate = useNavigate();
  const isCancelled = request.status === 'cancelled';
  const isCompleted = request.status === 'completed';

  const handleAction = async (newStatus) => {
    await onAction(request, newStatus);
    if (newStatus === 'accepted') {
      createNotification({
        user_email: request.client_email,
        title: `Pedido aceito por ${request.professional_name}`,
        body: `Seu código de confirmação é ${request.confirmation_code}`,
        type: 'request_accepted',
        link: '/requests',
      });
      sendEmailIfEnabled(request.client_email, 'request_accepted', {
        to: request.client_email,
        subject: `✅ Pedido aceito — ${request.professional_name}`,
        emailBody: `Boa notícia! ${request.professional_name} aceitou seu pedido de ${request.category?.replace(/_/g, ' ')}.\n\nSeu código de confirmação: ${request.confirmation_code}\n\nAcompanhe no ServiçosJá.`,
      });
    }
    if (newStatus === 'in_progress') {
      createNotification({
        user_email: request.client_email,
        title: `Serviço iniciado por ${request.professional_name}`,
        body: 'O profissional está a caminho ou já iniciou o trabalho.',
        type: 'request_in_progress',
        link: '/requests',
      });
      sendEmailIfEnabled(request.client_email, 'request_in_progress', {
        to: request.client_email,
        subject: `🔧 Serviço iniciado — ${request.professional_name}`,
        emailBody: `${request.professional_name} iniciou o serviço!\n\nAcompanhe o andamento no ServiçosJá.`,
      });
    }
    if (newStatus === 'completed') {
      createNotification({
        user_email: request.client_email,
        title: 'Serviço concluído! 🎉',
        body: `${request.professional_name} finalizou o serviço. Avalie sua experiência!`,
        type: 'request_completed',
        link: `/review/${request.id}`,
      });
      sendEmailIfEnabled(request.client_email, 'request_completed', {
        to: request.client_email,
        subject: `🎉 Serviço concluído!`,
        emailBody: `${request.professional_name} concluiu o serviço. Avalie sua experiência no ServiçosJá!`,
      });
    }
    if (newStatus === 'cancelled') {
      createNotification({
        user_email: request.client_email,
        title: 'Pedido recusado',
        body: `${request.professional_name} não pôde atender seu pedido.`,
        type: 'request_cancelled',
        link: '/requests',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden mb-3"
      style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="font-bold text-sm text-foreground">
            {isProvider ? request.client_name : request.professional_name}
          </p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">
            {request.category?.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {request.is_urgent && (
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" /> Urgente
            </span>
          )}
          <span className="text-[10px] text-muted-foreground font-medium">
            {request.created_date && format(new Date(request.created_date), "dd MMM", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Tracking */}
      {!isCancelled && (
        <div className="px-4">
          <TrackingSteps status={request.status} />
        </div>
      )}

      {isCancelled && (
        <div className="mx-4 mb-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#f87171' }}>
            <XCircle className="w-3.5 h-3.5" /> Pedido Cancelado
          </p>
        </div>
      )}

      {!isProvider && request.confirmation_code && request.status === 'accepted' && (
        <div className="px-4">
          <ConfirmationCode code={request.confirmation_code} />
        </div>
      )}

      {request.description && (
        <div className="mx-4 mb-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs text-muted-foreground leading-relaxed">{request.description}</p>
        </div>
      )}

      {request.address && (
        <div className="mx-4 mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>📍</span> {request.address}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <button
          onClick={() => navigate(`/chat/${request.id}`)}
          className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition active:opacity-70"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'hsl(var(--foreground))' }}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Chat
        </button>

        {isProvider && request.status === 'pending' && (
          <>
            <button
              onClick={() => handleAction('cancelled')}
              className="h-9 px-4 rounded-xl text-sm font-medium transition active:opacity-70"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              Recusar
            </button>
            <button
              onClick={() => handleAction('accepted')}
              className="flex-1 h-9 rounded-xl text-white text-sm font-bold transition active:opacity-80"
              style={{ background: 'hsl(var(--primary))', boxShadow: '0 2px 12px rgba(59,130,246,0.3)' }}
            >
              Aceitar ✓
            </button>
          </>
        )}
        {isProvider && request.status === 'accepted' && (
          <button
            onClick={() => handleAction('in_progress')}
            className="flex-1 h-9 rounded-xl text-white text-sm font-bold transition active:opacity-80"
            style={{ background: 'hsl(var(--primary))', boxShadow: '0 2px 12px rgba(59,130,246,0.3)' }}
          >
            Iniciar Serviço
          </button>
        )}
        {isProvider && request.status === 'in_progress' && (
          <button
            onClick={() => handleAction('completed')}
            className="flex-1 h-9 rounded-xl text-white text-sm font-bold transition active:opacity-80"
            style={{ background: 'rgba(34,197,94,0.8)', boxShadow: '0 2px 12px rgba(34,197,94,0.25)' }}
          >
            Concluir ✓
          </button>
        )}
        {!isProvider && isCompleted && (
          <button
            onClick={() => navigate(`/review/${request.id}`)}
            className="flex-1 h-9 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-1.5 transition active:opacity-80"
            style={{ background: 'hsl(var(--primary))', boxShadow: '0 2px 12px rgba(59,130,246,0.3)' }}
          >
            <Star className="w-3.5 h-3.5" /> Avaliar
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Requests() {
  const [user, setUser] = useState(null);
  const [professional, setProfessional] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: myPro } = useQuery({
    queryKey: ['my-professional', user?.email],
    queryFn: () => base44.entities.Professional.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (myPro?.length > 0) setProfessional(myPro[0]);
  }, [myPro]);

  const { data: clientRequests = [], refetch: refetchClient } = useQuery({
    queryKey: ['client-requests', user?.email],
    queryFn: () => base44.entities.ServiceRequest.filter({ client_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: proRequests = [], refetch: refetchPro } = useQuery({
    queryKey: ['pro-requests', professional?.id],
    queryFn: () => base44.entities.ServiceRequest.filter({ professional_id: professional.id }, '-created_date'),
    enabled: !!professional?.id,
  });

  const handleAction = async (request, newStatus) => {
    await base44.entities.ServiceRequest.update(request.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['client-requests'] });
    queryClient.invalidateQueries({ queryKey: ['pro-requests'] });
    if (newStatus === 'accepted') toast.success('Pedido aceito! Cliente notificado.');
    if (newStatus === 'in_progress') toast.success('Serviço iniciado!');
    if (newStatus === 'completed') toast.success('Serviço concluído! Aguarde avaliação.');
  };

  const pendingCount = proRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4" style={{ background: 'rgba(14,16,22,0.85)', backdropFilter: 'blur(32px) saturate(180%)', WebkitBackdropFilter: 'blur(32px) saturate(180%)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="pt-12 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          {pendingCount > 0 && (
            <span className="bg-foreground text-white text-xs font-bold px-3 py-1 rounded-full">
              {pendingCount} novo{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-6">
        <SafetyBanner />

        <Tabs defaultValue="client">
          <TabsList className="w-full rounded-2xl h-11 mb-4 p-1" style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.06)' }}>
            <TabsTrigger value="client" className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
              Como Cliente
            </TabsTrigger>
            {professional && (
              <TabsTrigger value="provider" className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
                Profissional {pendingCount > 0 && `(${pendingCount})`}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="client">
            {clientRequests.length > 0 ? clientRequests.map(r => (
              <RequestCard key={r.id} request={r} isProvider={false} onAction={handleAction} />
            )) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="font-bold text-foreground">Nenhum pedido ainda</p>
                <p className="text-sm text-muted-foreground mt-1">Explore profissionais e solicite um serviço</p>
              </div>
            )}
          </TabsContent>

          {professional && (
            <TabsContent value="provider">
              {proRequests.length > 0 ? proRequests.map(r => (
                <RequestCard key={r.id} request={r} isProvider={true} onAction={handleAction} />
              )) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="font-bold text-foreground">Nenhum pedido recebido</p>
                  <p className="text-sm text-muted-foreground mt-1">Fique online para receber pedidos</p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}