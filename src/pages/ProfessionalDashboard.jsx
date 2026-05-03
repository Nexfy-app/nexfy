import React, { useState, useEffect, useMemo } from 'react';
import ProfessionalSheet from '../components/home/ProfessionalSheet';
import CompleteServiceModal from '../components/dashboard/CompleteServiceModal';
import TurboSerfyCard from '../components/turbo/TurboSerfyCard';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Star, DollarSign,
  Clock, Briefcase, MessageSquare, Zap, Bell, RefreshCw, Eye, TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createNotification, sendEmailIfEnabled } from '@/lib/notifications';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const STATUS_PT = { pending: 'Aguardando', accepted: 'Aceito', in_progress: 'Em andamento', completed: 'Concluído', cancelled: 'Cancelado' };
const STATUS_COLOR = {
  pending: 'text-amber-600 bg-amber-50',
  accepted: 'text-blue-600 bg-blue-50',
  in_progress: 'text-blue-700 bg-blue-50',
  completed: 'text-green-700 bg-green-50',
  cancelled: 'text-red-500 bg-red-50',
};

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
      <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
        <Icon className="w-4 h-4 text-foreground" />
      </div>
      <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  );
}

function RequestActionCard({ request, onAction, navigate }) {
  const [loading, setLoading] = useState(null);

  const handle = async (status) => {
    setLoading(status);
    await onAction(request, status);
    setLoading(null);
  };

  const catLabel = request.category?.startsWith('outros:')
    ? request.category.replace('outros:', '')
    : request.category?.replace(/_/g, ' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}
    >
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-sm text-foreground shrink-0">
            {request.client_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground">{request.client_name}</p>
            <p className="text-xs text-muted-foreground capitalize truncate">{catLabel}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[request.status]}`}>
            {STATUS_PT[request.status]}
          </span>
          {request.is_urgent && (
            <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" /> Urgente
            </span>
          )}
        </div>
      </div>

      {request.description && (
        <div className="mx-4 mb-3 bg-slate-50 rounded-xl px-3 py-2.5">
          <p className="text-xs text-slate-600 leading-relaxed">{request.description}</p>
        </div>
      )}

      {request.address && (
        <p className="mx-4 mb-3 text-[11px] text-muted-foreground">📍 {request.address}</p>
      )}

      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => navigate(`/chat/${request.id}`)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-100 text-xs font-medium hover:bg-slate-200 transition text-foreground"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Chat
        </button>

        {request.status === 'pending' && (
          <>
            <button
              onClick={() => handle('cancelled')}
              disabled={loading === 'cancelled'}
              className="h-9 px-3 rounded-xl text-red-500 text-xs font-medium hover:bg-red-50 transition disabled:opacity-50"
            >
              {loading === 'cancelled' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Recusar'}
            </button>
            <button
              onClick={() => handle('accepted')}
              disabled={loading === 'accepted'}
              className="flex-1 h-9 rounded-xl bg-black text-white text-xs font-semibold hover:bg-black/80 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading === 'accepted' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" /> Aceitar</>}
            </button>
          </>
        )}

        {request.status === 'accepted' && (
          <button
            onClick={() => handle('in_progress')}
            disabled={loading === 'in_progress'}
            className="flex-1 h-9 rounded-xl bg-black text-white text-xs font-semibold hover:bg-black/80 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading === 'in_progress' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Zap className="w-3.5 h-3.5" /> Iniciar Serviço</>}
          </button>
        )}

        {request.status === 'in_progress' && (
          <button
            onClick={() => handle('completed')}
            disabled={loading === 'completed'}
            className="flex-1 h-9 rounded-xl bg-black text-white text-xs font-semibold hover:bg-black/80 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading === 'completed' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" /> Concluir</>}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function ProfessionalDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [completeRequest, setCompleteRequest] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: proData = [] } = useQuery({
    queryKey: ['my-pro-dashboard', user?.email],
    queryFn: () => base44.entities.Professional.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const professional = proData[0] || null;

  const { data: requests = [] } = useQuery({
    queryKey: ['pro-requests-dashboard', professional?.id],
    queryFn: () => base44.entities.ServiceRequest.filter({ professional_id: professional.id }, '-created_date', 100),
    enabled: !!professional?.id,
    refetchInterval: 8000,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['pro-reviews-dashboard', professional?.id],
    queryFn: () => base44.entities.Review.filter({ professional_id: professional.id }, '-created_date', 50),
    enabled: !!professional?.id,
  });

  const { data: turboData, refetch: refetchTurbo } = useQuery({
    queryKey: ['turbo-subscription', user?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke('turboCheckout', { action: 'get_status' });
      return res.data;
    },
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('turbo') === 'success') {
      window.history.replaceState({}, '', '/professional/dashboard');
      toast.success('Pagamento confirmado! Ativando Turbo Nexfy...');
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const res = await base44.functions.invoke('turboCheckout', { action: 'get_status' });
        if (res.data?.active) {
          clearInterval(interval);
          queryClient.invalidateQueries({ queryKey: ['turbo-subscription'] });
          queryClient.invalidateQueries({ queryKey: ['my-pro-dashboard'] });
          toast.success('Turbo Nexfy ativo! Seu perfil está em destaque.');
        } else if (attempts >= 10) {
          clearInterval(interval);
          refetchTurbo();
        }
      }, 3000);
      return () => clearInterval(interval);
    }
    if (params.get('turbo') === 'cancel') {
      window.history.replaceState({}, '', '/professional/dashboard');
    }
  }, []);

  const handleAction = async (request, newStatus) => {
    if (newStatus === 'completed') { setCompleteRequest(request); return; }
    await base44.entities.ServiceRequest.update(request.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['pro-requests-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['pro-requests'] });

    const msgs = {
      accepted: { title: `Pedido aceito por ${professional?.name}`, body: `${professional?.name} aceitou seu pedido!`, type: 'request_accepted', subject: `Pedido aceito — ${professional?.name}`, emailBody: `${professional?.name} aceitou seu pedido!` },
      in_progress: { title: `Serviço iniciado`, body: `${professional?.name} está a caminho.`, type: 'request_in_progress', subject: `Serviço iniciado`, emailBody: `${professional?.name} iniciou o serviço!` },
      cancelled: { title: `Pedido recusado`, body: `${professional?.name} não pôde atender.`, type: 'request_cancelled', subject: `Pedido recusado`, emailBody: `Infelizmente ${professional?.name} não pôde atender seu pedido.` },
    };
    const m = msgs[newStatus];
    if (m) {
      createNotification({ user_email: request.client_email, title: m.title, body: m.body, type: m.type, link: `/chat/${request.id}` });
      sendEmailIfEnabled(request.client_email, m.type, { to: request.client_email, subject: m.subject, emailBody: m.emailBody });
    }
    const toastMsgs = { accepted: 'Pedido aceito! Cliente notificado.', in_progress: 'Serviço iniciado!', cancelled: 'Pedido recusado.' };
    toast.success(toastMsgs[newStatus] || 'Atualizado!');
  };

  const handleComplete = async (request, price) => {
    await base44.entities.ServiceRequest.update(request.id, {
      status: 'completed', price_agreed: price,
      completed_date: new Date().toISOString().split('T')[0],
    });
    if (professional) {
      await base44.entities.Professional.update(professional.id, {
        services_completed: (professional.services_completed || 0) + 1,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['pro-requests-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['pro-requests'] });
    queryClient.invalidateQueries({ queryKey: ['my-pro'] });
    queryClient.invalidateQueries({ queryKey: ['my-pro-dashboard'] });
    setCompleteRequest(null);
    createNotification({ user_email: request.client_email, title: 'Serviço concluído!', body: `${professional?.name} finalizou. Avalie sua experiência!`, type: 'request_completed', link: `/review/${request.id}` });
    sendEmailIfEnabled(request.client_email, 'request_completed', { to: request.client_email, subject: 'Serviço concluído!', emailBody: `${professional?.name} concluiu. Acesse o app para avaliar!` });
    toast.success(price > 0 ? `Concluído! R$ ${price.toFixed(2)} registrado.` : 'Serviço concluído!');
  };

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const thisMonthReqs = useMemo(() => requests.filter(r => isWithinInterval(new Date(r.created_date), { start: thisMonthStart, end: thisMonthEnd })), [requests]);
  const completedAll = requests.filter(r => r.status === 'completed');
  const earningsThisMonth = thisMonthReqs.filter(r => r.status === 'completed').reduce((s, r) => s + (r.price_agreed || 0), 0);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  const last6Months = useMemo(() => Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(now, 5 - i);
    const start = startOfMonth(d); const end = endOfMonth(d);
    const completed = requests.filter(r => r.status === 'completed' && isWithinInterval(new Date(r.created_date), { start, end }));
    return { mes: format(d, 'MMM', { locale: ptBR }), serviços: completed.length };
  }), [requests]);

  const pendingReqs = requests.filter(r => r.status === 'pending');
  const activeReqs = requests.filter(r => ['accepted', 'in_progress'].includes(r.status));
  const historyReqs = requests.filter(r => ['completed', 'cancelled'].includes(r.status));

  if (!professional && proData.length === 0 && user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="font-semibold text-foreground text-lg">Sem perfil profissional</p>
        <p className="text-sm text-muted-foreground">Crie seu perfil para receber pedidos.</p>
        <button onClick={() => navigate('/professional/edit')} className="mt-2 px-6 py-3 bg-black text-white rounded-2xl font-semibold text-sm">
          Criar Perfil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-slate-100">
        <div className="pt-12 pb-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Painel</h1>
              <p className="text-xs text-muted-foreground">{professional?.name || '...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {professional && (
              <button
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-1.5 bg-slate-100 text-foreground px-3 py-1.5 rounded-full text-xs font-medium hover:bg-slate-200 transition"
              >
                <Eye className="w-3.5 h-3.5" /> Ver perfil
              </button>
            )}
            {pendingReqs.length > 0 && (
              <div className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full">
                <Bell className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{pendingReqs.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-3 pt-4">

        {/* Turbo */}
        <TurboSerfyCard
          professional={professional}
          subscription={turboData?.subscription || null}
          onRefresh={refetchTurbo}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={DollarSign} label="Ganhos no mês" value={earningsThisMonth > 0 ? `R$ ${earningsThisMonth.toFixed(0)}` : 'R$ 0'} />
          <StatCard icon={CheckCircle2} label="Serviços feitos" value={completedAll.length} sub="todos os tempos" />
          <StatCard icon={Star} label="Avaliação" value={avgRating !== '—' ? `${avgRating} ★` : '—'} sub={`${reviews.length} avaliações`} />
          <StatCard icon={Clock} label="Aguardando" value={pendingReqs.length} sub="novos pedidos" />
        </div>

        {/* Chart */}
        {requests.length > 0 && (
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Últimos 6 meses</p>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={last6Months} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 }} formatter={v => [v, 'Serviços']} />
                <Bar dataKey="serviços" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList className="w-full rounded-2xl bg-slate-100 h-11 p-1 grid grid-cols-3">
            <TabsTrigger value="pending" className="rounded-xl text-[11px] font-medium data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Novos {pendingReqs.length > 0 && `(${pendingReqs.length})`}
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-xl text-[11px] font-medium data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Ativos {activeReqs.length > 0 && `(${activeReqs.length})`}
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl text-[11px] font-medium data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-3 space-y-3">
            {pendingReqs.length > 0 ? pendingReqs.map(r => (
              <RequestActionCard key={r.id} request={r} onAction={handleAction} navigate={navigate} />
            )) : (
              <div className="text-center py-12 bg-white rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <Bell className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="font-semibold text-foreground text-sm">Nenhum pedido novo</p>
                <p className="text-xs text-muted-foreground mt-1">Fique online para receber solicitações</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-3 space-y-3">
            {activeReqs.length > 0 ? activeReqs.map(r => (
              <RequestActionCard key={r.id} request={r} onAction={handleAction} navigate={navigate} />
            )) : (
              <div className="text-center py-12 bg-white rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <Zap className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="font-semibold text-foreground text-sm">Nenhum serviço ativo</p>
                <p className="text-xs text-muted-foreground mt-1">Aceite pedidos para começar</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-3 space-y-2">
            {historyReqs.length > 0 ? historyReqs.map(r => (
              <div key={r.id} className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0">
                  {r.client_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.client_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{r.category?.replace(/_/g, ' ')?.replace('outros:', '')}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status]}`}>
                    {STATUS_PT[r.status]}
                  </span>
                  {r.price_agreed > 0 && <span className="text-[10px] font-semibold text-foreground">R$ {r.price_agreed}</span>}
                </div>
                <button onClick={() => navigate(`/chat/${r.id}`)} className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-slate-100 transition">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            )) : (
              <div className="text-center py-12 bg-white rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p className="text-sm font-semibold text-foreground">Sem histórico ainda</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Avaliações recentes</p>
            </div>
            <div className="space-y-2.5">
              {reviews.slice(0, 3).map(r => (
                <div key={r.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                    {r.client_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{r.client_name || 'Cliente'}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{r.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ProfessionalSheet professional={previewOpen ? professional : null} open={previewOpen} onClose={() => setPreviewOpen(false)} />
      {completeRequest && <CompleteServiceModal request={completeRequest} onConfirm={handleComplete} onCancel={() => setCompleteRequest(null)} />}
    </div>
  );
}