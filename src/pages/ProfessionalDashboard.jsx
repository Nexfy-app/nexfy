import React, { useState, useEffect, useMemo } from 'react';
import ProfessionalSheet from '../components/home/ProfessionalSheet';
import CompleteServiceModal from '../components/dashboard/CompleteServiceModal';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, TrendingUp, CheckCircle2, Star, DollarSign,
  Clock, Briefcase, MessageSquare, XCircle, Zap, Bell, ChevronRight, RefreshCw, Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createNotification, sendEmailIfEnabled } from '@/lib/notifications';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const STATUS_PT = { pending: 'Aguardando', accepted: 'Aceito', in_progress: 'Em andamento', completed: 'Concluído', cancelled: 'Cancelado' };
const STATUS_BG = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

function StatCard({ icon: Icon, label, value, sub, color = 'bg-foreground' }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-black text-foreground leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-foreground text-white flex items-center justify-center font-bold text-sm shrink-0">
            {request.client_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-foreground">{request.client_name}</p>
            <p className="text-xs text-muted-foreground capitalize truncate">{catLabel}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BG[request.status]}`}>
            {STATUS_PT[request.status]}
          </span>
          {request.is_urgent && (
            <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-orange-100">
              <Zap className="w-2.5 h-2.5" /> Urgente
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {request.description && (
        <div className="mx-4 mb-3 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
          <p className="text-xs text-slate-600 leading-relaxed">{request.description}</p>
        </div>
      )}

      {request.address && (
        <p className="mx-4 mb-2 text-[11px] text-muted-foreground flex items-center gap-1">
          📍 {request.address}
        </p>
      )}



      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => navigate(`/chat/${request.id}`)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-100 text-xs font-semibold hover:bg-slate-200 transition"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Chat
        </button>

        {request.status === 'pending' && (
          <>
            <button
              onClick={() => handle('cancelled')}
              disabled={loading === 'cancelled'}
              className="h-9 px-3 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50"
            >
              {loading === 'cancelled' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Recusar'}
            </button>
            <button
              onClick={() => handle('accepted')}
              disabled={loading === 'accepted'}
              className="flex-1 h-9 rounded-xl bg-foreground text-white text-xs font-bold hover:bg-foreground/80 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading === 'accepted' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" /> Aceitar</>}
            </button>
          </>
        )}

        {request.status === 'accepted' && (
          <button
            onClick={() => handle('in_progress')}
            disabled={loading === 'in_progress'}
            className="flex-1 h-9 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading === 'in_progress' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Zap className="w-3.5 h-3.5" /> Iniciar Serviço</>}
          </button>
        )}

        {request.status === 'in_progress' && (
          <button
            onClick={() => handle('completed')}
            disabled={loading === 'completed'}
            className="flex-1 h-9 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
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

  const { data: requests = [], refetch } = useQuery({
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

  const handleAction = async (request, newStatus) => {
    // Intercept "completed" to open the price modal
    if (newStatus === 'completed') {
      setCompleteRequest(request);
      return;
    }
    await base44.entities.ServiceRequest.update(request.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['pro-requests-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['pro-requests'] });

    const msgs = {
      accepted: { title: `✅ Pedido aceito por ${professional?.name}`, body: `${professional?.name} aceitou seu pedido!`, type: 'request_accepted', subject: `✅ Pedido aceito — ${professional?.name}`, emailBody: `${professional?.name} aceitou seu pedido!` },
      in_progress: { title: `🔧 Serviço iniciado`, body: `${professional?.name} está a caminho.`, type: 'request_in_progress', subject: `🔧 Serviço iniciado`, emailBody: `${professional?.name} iniciou o serviço!` },
      cancelled: { title: `❌ Pedido recusado`, body: `${professional?.name} não pôde atender.`, type: 'request_cancelled', subject: `Pedido recusado`, emailBody: `Infelizmente ${professional?.name} não pôde atender seu pedido.` },
    };

    const m = msgs[newStatus];
    if (m) {
      createNotification({ user_email: request.client_email, title: m.title, body: m.body, type: m.type, link: `/chat/${request.id}` });
      sendEmailIfEnabled(request.client_email, m.type, { to: request.client_email, subject: m.subject, emailBody: m.emailBody });
    }

    const toastMsgs = { accepted: '✅ Pedido aceito! Cliente notificado.', in_progress: '🔧 Serviço iniciado!', cancelled: 'Pedido recusado.' };
    toast.success(toastMsgs[newStatus] || 'Atualizado!');
  };

  const handleComplete = async (request, price) => {
    await base44.entities.ServiceRequest.update(request.id, {
      status: 'completed',
      price_agreed: price,
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
    createNotification({
      user_email: request.client_email,
      title: '🎉 Serviço concluído!',
      body: `${professional?.name} finalizou o serviço. Avalie sua experiência!`,
      type: 'request_completed',
      link: `/review/${request.id}`,
    });
    sendEmailIfEnabled(request.client_email, 'request_completed', {
      to: request.client_email,
      subject: '🎉 Serviço concluído!',
      emailBody: `${professional?.name} concluiu o serviço. Acesse o app para avaliar!`,
    });
    toast.success(`🎉 Concluído!${price > 0 ? ` R$ ${price.toFixed(2)} registrado nos seus ganhos.` : ''}`);
  };

  // Stats
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const thisMonthReqs = useMemo(() => requests.filter(r => {
    const d = new Date(r.created_date);
    return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
  }), [requests]);

  const completedAll = requests.filter(r => r.status === 'completed');
  const earningsThisMonth = thisMonthReqs.filter(r => r.status === 'completed').reduce((s, r) => s + (r.price_agreed || 0), 0);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  const last6Months = useMemo(() => Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(now, 5 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const completed = requests.filter(r => r.status === 'completed' && isWithinInterval(new Date(r.created_date), { start, end }));
    return { mes: format(d, 'MMM', { locale: ptBR }), serviços: completed.length };
  }), [requests]);

  const pendingReqs = requests.filter(r => r.status === 'pending');
  const activeReqs = requests.filter(r => ['accepted', 'in_progress'].includes(r.status));
  const historyReqs = requests.filter(r => ['completed', 'cancelled'].includes(r.status));

  if (!professional && proData.length === 0 && user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center">
          <Briefcase className="w-10 h-10 text-muted-foreground" />
        </div>
        <p className="font-bold text-foreground text-lg">Você não tem perfil profissional</p>
        <p className="text-sm text-muted-foreground">Crie seu perfil para receber pedidos de clientes.</p>
        <button onClick={() => navigate('/professional/edit')} className="mt-2 px-8 py-3 bg-foreground text-white rounded-2xl font-bold text-sm shadow-lg">
          Criar Perfil Agora
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4" style={{ background: 'rgba(245,247,250,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="pt-12 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Painel Profissional</h1>
              <p className="text-xs text-muted-foreground">{professional?.name || '...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {professional && (
              <button
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-1.5 bg-white border border-slate-200 text-foreground px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-slate-50 transition shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                Ver perfil
              </button>
            )}
            {pendingReqs.length > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-full">
                <Bell className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{pendingReqs.length} novo{pendingReqs.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={DollarSign} label="Ganhos no mês" value={earningsThisMonth > 0 ? `R$ ${earningsThisMonth.toFixed(0)}` : 'R$ 0'} color="bg-green-600" />
          <StatCard icon={CheckCircle2} label="Concluídos" value={completedAll.length} sub="todos os tempos" color="bg-foreground" />
          <StatCard icon={Star} label="Avaliação" value={avgRating !== '—' ? `${avgRating} ★` : '—'} sub={`${reviews.length} avaliações`} color="bg-amber-500" />
          <StatCard icon={Clock} label="Aguardando" value={pendingReqs.length} sub="novos pedidos" color={pendingReqs.length > 0 ? 'bg-amber-500' : 'bg-slate-400'} />
        </div>

        {/* Chart */}
        {requests.length > 0 && (
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-bold text-foreground">Serviços — últimos 6 meses</p>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={last6Months} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} formatter={v => [v, 'Serviços']} />
                <Bar dataKey="serviços" fill="#0f172a" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabs de pedidos */}
        <Tabs defaultValue="pending">
          <TabsList className="w-full rounded-2xl bg-white border border-slate-200 h-11 p-1 shadow-sm grid grid-cols-3">
            <TabsTrigger value="pending" className="rounded-xl text-[11px] font-semibold data-[state=active]:bg-foreground data-[state=active]:text-white">
              Novos {pendingReqs.length > 0 && `(${pendingReqs.length})`}
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-xl text-[11px] font-semibold data-[state=active]:bg-foreground data-[state=active]:text-white">
              Ativos {activeReqs.length > 0 && `(${activeReqs.length})`}
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl text-[11px] font-semibold data-[state=active]:bg-foreground data-[state=active]:text-white">
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-3 space-y-3">
            {pendingReqs.length > 0 ? pendingReqs.map(r => (
              <RequestActionCard key={r.id} request={r} onAction={handleAction} navigate={navigate} />
            )) : (
              <div className="text-center py-12 bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-bold text-foreground">Nenhum pedido novo</p>
                <p className="text-xs text-muted-foreground mt-1">Fique online para receber solicitações</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-3 space-y-3">
            {activeReqs.length > 0 ? activeReqs.map(r => (
              <RequestActionCard key={r.id} request={r} onAction={handleAction} navigate={navigate} />
            )) : (
              <div className="text-center py-12 bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-bold text-foreground">Nenhum serviço ativo</p>
                <p className="text-xs text-muted-foreground mt-1">Aceite pedidos para começar</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-3 space-y-2">
            {historyReqs.length > 0 ? historyReqs.map(r => (
              <div key={r.id} className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  {r.client_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.client_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{r.category?.replace(/_/g, ' ')?.replace('outros:', '')}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BG[r.status]}`}>
                    {STATUS_PT[r.status]}
                  </span>
                  {r.price_agreed > 0 && <span className="text-[10px] font-bold text-green-700">R$ {r.price_agreed}</span>}
                </div>
                <button onClick={() => navigate(`/chat/${r.id}`)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            )) : (
              <div className="text-center py-12 bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <p className="font-bold text-foreground">Sem histórico ainda</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Recent reviews */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <p className="text-sm font-bold text-foreground">Avaliações recentes</p>
            </div>
            <div className="space-y-2.5">
              {reviews.slice(0, 3).map(r => (
                <div key={r.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {r.client_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">{r.client_name || 'Cliente'}</p>
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

      {/* Public profile preview */}
      <ProfessionalSheet
        professional={previewOpen ? professional : null}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      {/* Complete service modal */}
      {completeRequest && (
        <CompleteServiceModal
          request={completeRequest}
          onConfirm={handleComplete}
          onCancel={() => setCompleteRequest(null)}
        />
      )}
    </div>
  );
}