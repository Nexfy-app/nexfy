import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, Zap, Star, MessageSquare, Shield, ChevronRight } from 'lucide-react';
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
    <div className="bg-foreground text-background rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4" />
        <p className="text-xs font-semibold uppercase tracking-wider">Código de Confirmação</p>
      </div>
      <div className="flex gap-2">
        {code?.split('').map((digit, i) => (
          <div key={i} className="w-10 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold">{digit}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] opacity-60 mt-2">Informe este código ao profissional para confirmar o serviço</p>
    </div>
  );
}

function TrackingSteps({ status }) {
  const steps = STATUS_STEPS;
  const currentIdx = steps.findIndex(s => s.key === status);

  return (
    <div className="flex items-center justify-between py-3 px-1 mb-3">
      {steps.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        const Icon = step.icon;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                done ? 'bg-foreground text-background' : 'bg-border text-muted-foreground'
              } ${active ? 'ring-4 ring-foreground/20' : ''}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className={`text-[9px] font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full ${i < currentIdx ? 'bg-foreground' : 'bg-border'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SafetyBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
      <div className="flex gap-2">
        <span className="text-base">🛡️</span>
        <div>
          <p className="text-xs font-semibold text-amber-900 mb-0.5">Dica de Segurança</p>
          <p className="text-[10px] text-amber-800 leading-relaxed">
            Recomendamos combinar todos os detalhes pelo app para manter registros. Pagamentos externos são aceitos, mas <strong>sempre pague após o serviço concluído</strong>. Não envie dinheiro antecipado a desconhecidos.
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
      // Send email notification to client
      base44.integrations.Core.SendEmail({
        to: request.client_email,
        subject: `✅ Pedido aceito — ${request.professional_name}`,
        body: `Boa notícia! ${request.professional_name} aceitou seu pedido de ${request.category?.replace(/_/g, ' ')}.\n\nSeu código de confirmação: ${request.confirmation_code}\n\nAcompanhe no ServiçosJá.`,
      }).catch(() => {});
    }
    if (newStatus === 'in_progress') {
      base44.integrations.Core.SendEmail({
        to: request.client_email,
        subject: `🔧 Serviço iniciado — ${request.professional_name}`,
        body: `${request.professional_name} iniciou o serviço!\n\nAcompanhe o andamento no ServiçosJá.`,
      }).catch(() => {});
    }
    if (newStatus === 'completed') {
      base44.integrations.Core.SendEmail({
        to: request.client_email,
        subject: `🎉 Serviço concluído!`,
        body: `${request.professional_name} concluiu o serviço. Avalie sua experiência no ServiçosJá!`,
      }).catch(() => {});
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border overflow-hidden mb-3 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="font-bold text-sm">
            {isProvider ? request.client_name : request.professional_name}
          </p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">
            {request.category?.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {request.is_urgent && (
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" /> Urgente
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
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
        <div className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <p className="text-xs text-red-700 font-medium flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Pedido Cancelado
          </p>
        </div>
      )}

      {/* Confirmation code - show to client when accepted */}
      {!isProvider && request.confirmation_code && request.status === 'accepted' && (
        <div className="px-4">
          <ConfirmationCode code={request.confirmation_code} />
        </div>
      )}

      {/* Description */}
      {request.description && (
        <div className="mx-4 mb-3 bg-secondary rounded-xl px-3 py-2">
          <p className="text-xs text-muted-foreground leading-relaxed">{request.description}</p>
        </div>
      )}

      {/* Address */}
      {request.address && (
        <div className="mx-4 mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>📍</span> {request.address}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <button
          onClick={() => navigate(`/chat/${request.id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-secondary text-sm font-medium hover:bg-border transition"
        >
          <MessageSquare className="w-4 h-4" /> Chat
        </button>

        {isProvider && request.status === 'pending' && (
          <>
            <button
              onClick={() => handleAction('cancelled')}
              className="h-9 px-4 rounded-xl border text-sm font-medium hover:bg-secondary transition"
            >
              Recusar
            </button>
            <button
              onClick={() => handleAction('accepted')}
              className="h-9 px-4 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/80 transition"
            >
              Aceitar
            </button>
          </>
        )}
        {isProvider && request.status === 'accepted' && (
          <button
            onClick={() => handleAction('in_progress')}
            className="h-9 px-4 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/80 transition"
          >
            Iniciar Serviço
          </button>
        )}
        {isProvider && request.status === 'in_progress' && (
          <button
            onClick={() => handleAction('completed')}
            className="h-9 px-4 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/80 transition"
          >
            Concluir ✓
          </button>
        )}
        {!isProvider && isCompleted && (
          <button
            onClick={() => navigate(`/review/${request.id}`)}
            className="h-9 px-4 rounded-xl bg-foreground text-background text-sm font-semibold flex items-center gap-1.5 hover:bg-foreground/80 transition"
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
    <div className="min-h-screen bg-secondary/30">
      <div className="sticky top-0 z-10 bg-background border-b px-4 pt-safe">
        <div className="pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Pedidos</h1>
          {pendingCount > 0 && (
            <span className="bg-foreground text-background text-xs font-bold px-2.5 py-0.5 rounded-full">
              {pendingCount} novo{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <SafetyBanner />

        <Tabs defaultValue="client">
          <TabsList className="w-full rounded-xl bg-secondary h-10 mb-4">
            <TabsTrigger value="client" className="flex-1 rounded-lg text-xs font-medium">
              Como Cliente
            </TabsTrigger>
            {professional && (
              <TabsTrigger value="provider" className="flex-1 rounded-lg text-xs font-medium">
                Como Profissional {pendingCount > 0 && `(${pendingCount})`}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="client">
            {clientRequests.length > 0 ? clientRequests.map(r => (
              <RequestCard key={r.id} request={r} isProvider={false} onAction={handleAction} />
            )) : (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📋</div>
                <p className="font-semibold text-foreground">Nenhum pedido ainda</p>
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
                  <div className="text-4xl mb-3">📭</div>
                  <p className="font-semibold text-foreground">Nenhum pedido recebido</p>
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