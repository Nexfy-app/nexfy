import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, Zap, Star, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700", icon: Clock },
  accepted: { label: "Aceito", color: "bg-blue-500/10 text-blue-700", icon: CheckCircle2 },
  in_progress: { label: "Em Andamento", color: "bg-primary/10 text-primary", icon: ArrowRight },
  completed: { label: "Concluído", color: "bg-green-500/10 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-red-500/10 text-red-700", icon: XCircle },
};

function RequestCard({ request, isProvider, onAction }) {
  const config = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border p-4 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm">
            {isProvider ? request.client_name : request.professional_name}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {request.category?.replace(/_/g, ' ')}
          </p>
        </div>
        <Badge className={`${config.color} border-0 text-[10px] gap-1`}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </Badge>
      </div>

      {request.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{request.description}</p>
      )}

      {request.is_urgent && (
        <Badge className="bg-orange-500/10 text-orange-700 border-0 text-[10px] gap-1">
          <Zap className="w-3 h-3" /> Urgente
        </Badge>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          {request.created_date && format(new Date(request.created_date), "dd MMM, HH:mm", { locale: ptBR })}
        </p>
        <div className="flex gap-2">
          {isProvider && request.status === 'pending' && (
            <>
              <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => onAction(request, 'cancelled')}>
                Recusar
              </Button>
              <Button size="sm" className="h-7 text-xs rounded-lg" onClick={() => onAction(request, 'accepted')}>
                Aceitar
              </Button>
            </>
          )}
          {isProvider && request.status === 'accepted' && (
            <Button size="sm" className="h-7 text-xs rounded-lg" onClick={() => onAction(request, 'in_progress')}>
              Iniciar
            </Button>
          )}
          {isProvider && request.status === 'in_progress' && (
            <Button size="sm" className="h-7 text-xs rounded-lg bg-green-600 hover:bg-green-700" onClick={() => onAction(request, 'completed')}>
              Concluir
            </Button>
          )}
          {!isProvider && request.status === 'completed' && !request._reviewed && (
            <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg gap-1" onClick={() => navigate(`/review/${request.id}`)}>
              <Star className="w-3 h-3" /> Avaliar
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg" onClick={() => navigate(`/chat/${request.id}`)}>
            Chat
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Requests() {
  const [user, setUser] = useState(null);
  const [professional, setProfessional] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

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
    refetchClient();
    refetchPro();
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b px-4 pt-safe">
        <div className="pt-4 pb-3">
          <h1 className="text-xl font-bold">Meus Pedidos</h1>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="client">
          <TabsList className="w-full rounded-xl bg-secondary h-10 mb-4">
            <TabsTrigger value="client" className="flex-1 rounded-lg text-xs">Como Cliente</TabsTrigger>
            {professional && (
              <TabsTrigger value="provider" className="flex-1 rounded-lg text-xs">Como Profissional</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="client" className="space-y-2">
            {clientRequests.length > 0 ? clientRequests.map(r => (
              <RequestCard key={r.id} request={r} isProvider={false} onAction={handleAction} />
            )) : (
              <p className="text-center text-muted-foreground text-sm py-12">Nenhum pedido ainda</p>
            )}
          </TabsContent>

          {professional && (
            <TabsContent value="provider" className="space-y-2">
              {proRequests.length > 0 ? proRequests.map(r => (
                <RequestCard key={r.id} request={r} isProvider={true} onAction={handleAction} />
              )) : (
                <p className="text-center text-muted-foreground text-sm py-12">Nenhum pedido recebido</p>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}