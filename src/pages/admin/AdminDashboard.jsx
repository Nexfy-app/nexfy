import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, Briefcase, Star, ArrowLeft,
  TrendingUp, Activity, Shield, Trash2, UserX, UserCheck, ShieldCheck, ShieldOff,
  FileCheck, FileX, Clock, ExternalLink
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

function StatCard({ title, value, icon: Icon, colorClass, sub }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <p className="text-xl font-black text-foreground leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { action, label, onConfirm }

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== 'admin') navigate('/');
    });
  }, []);

  const enabled = user?.role === 'admin';

  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => base44.entities.User.list(), enabled });
  const { data: professionals = [] } = useQuery({ queryKey: ['admin-pros'], queryFn: () => base44.entities.Professional.list(), enabled });
  const { data: requests = [] } = useQuery({ queryKey: ['admin-requests'], queryFn: () => base44.entities.ServiceRequest.list('-created_date', 200), enabled });
  const { data: reviews = [] } = useQuery({ queryKey: ['admin-reviews'], queryFn: () => base44.entities.Review.list('-created_date', 50), enabled });
  const { data: documents = [] } = useQuery({ queryKey: ['admin-docs'], queryFn: () => base44.entities.VerificationDocument.list('-created_date', 100), enabled });
  const { data: turboSubs = [] } = useQuery({ queryKey: ['admin-turbo'], queryFn: () => base44.entities.TurboSubscription.list('-created_date', 200), enabled });
  const pendingDocs = documents.filter(d => d.status === 'pending');
  const onlinePros = professionals.filter(p => p.is_available).length;
  const activeTurbo = turboSubs.filter(s => s.status === 'active' || s.status === 'trial').length;
  const turboRevenue = activeTurbo * 12.90;
  const completedRequests = requests.filter(r => r.status === 'completed');
  const totalEarnings = completedRequests.reduce((s, r) => s + (r.price_agreed || 0), 0);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  // Last 7 days registrations
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const day = subDays(new Date(), 6 - i);
      const start = startOfDay(day);
      const end = new Date(start.getTime() + 86400000);
      return {
        dia: format(day, 'EEE', { locale: ptBR }),
        pedidos: requests.filter(r => r.created_date && new Date(r.created_date) >= start && new Date(r.created_date) < end).length,
      };
    });
  }, [requests]);

  const confirm = (label, onConfirm) => setConfirmDialog({ label, onConfirm });

  const handleSuspendPro = (proId) => confirm('Suspender este profissional?', async () => {
    await base44.entities.Professional.update(proId, { status: 'suspended', is_available: false });
    queryClient.invalidateQueries({ queryKey: ['admin-pros'] });
    toast.success('Profissional suspenso.');
  });

  const handleActivatePro = (proId) => confirm('Ativar este profissional?', async () => {
    await base44.entities.Professional.update(proId, { status: 'active' });
    queryClient.invalidateQueries({ queryKey: ['admin-pros'] });
    toast.success('Profissional ativado.');
  });

  const handleDeletePro = (proId) => confirm('Remover permanentemente este profissional?', async () => {
    await base44.entities.Professional.delete(proId);
    queryClient.invalidateQueries({ queryKey: ['admin-pros'] });
    toast.success('Profissional removido.');
  });

  const handleApproveDoc = (docId) => confirm('Aprovar este documento?', async () => {
    await base44.entities.VerificationDocument.update(docId, { status: 'approved' });
    queryClient.invalidateQueries({ queryKey: ['admin-docs'] });
    toast.success('Documento aprovado!');
  });

  const handleRejectDoc = (docId) => confirm('Rejeitar este documento?', async () => {
    await base44.entities.VerificationDocument.update(docId, { status: 'rejected' });
    queryClient.invalidateQueries({ queryKey: ['admin-docs'] });
    toast.success('Documento rejeitado.');
  });

  const handlePromoteUser = (userId) => confirm('Promover este usuário a admin?', async () => {
    await base44.entities.User.update(userId, { role: 'admin' });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    toast.success('Usuário promovido a admin.');
  });

  const handleDemoteUser = (userId) => confirm('Rebaixar este admin para usuário comum?', async () => {
    await base44.entities.User.update(userId, { role: 'user' });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    toast.success('Usuário rebaixado.');
  });

  const STATUS_PT = { pending: 'Pendente', accepted: 'Aceito', in_progress: 'Em andamento', completed: 'Concluído', cancelled: 'Cancelado' };
  const STATUS_COLOR = { pending: 'bg-amber-100 text-amber-700', accepted: 'bg-blue-100 text-blue-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

  if (user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDialog(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-foreground text-base mb-1">Confirmar ação</p>
            <p className="text-sm text-muted-foreground mb-5">{confirmDialog.label}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog(null)} className="flex-1 h-11 rounded-2xl border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition">Cancelar</button>
              <button
                onClick={async () => { await confirmDialog.onConfirm(); setConfirmDialog(null); }}
                className="flex-1 h-11 rounded-2xl bg-foreground text-white text-sm font-bold hover:bg-foreground/80 transition"
              >Confirmar</button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="sticky top-0 z-10 px-4" style={{ background: 'rgba(245,247,250,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-3 py-3 pt-12">
          <button onClick={() => navigate('/profile')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-foreground">Painel Administrativo</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Main stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Total de usuários" value={users.length} icon={Users} colorClass="bg-blue-600" />
          <StatCard title="Profissionais" value={professionals.length} icon={Briefcase} colorClass="bg-foreground" />
          <StatCard title="Online agora" value={onlinePros} icon={Activity} colorClass="bg-green-600" />
          <StatCard title="Avaliação média" value={avgRating !== '—' ? `${avgRating} ★` : '—'} icon={Star} colorClass="bg-amber-500" sub={`${reviews.length} avaliações`} />
          <StatCard title="Assinantes Turbo" value={activeTurbo} icon={TrendingUp} colorClass="bg-amber-500" sub={`${turboSubs.length} total`} />
          <StatCard title="MRR Turbo" value={`R$ ${turboRevenue.toFixed(0)}`} icon={TrendingUp} colorClass="bg-green-700" sub="receita mensal estimada" />
        </div>

        {/* Financial */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Financeiro</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-xl font-black text-green-700">R$ {totalEarnings.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Volume total</p>
            </div>
            <div className="text-center border-l border-slate-100">
              <p className="text-xl font-black text-foreground">{completedRequests.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Concluídos</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">Últimos 7 dias</p>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={last7Days} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Bar dataKey="pedidos" fill="#0f172a" radius={[5, 5, 0, 0]} name="Pedidos" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center mt-1">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-foreground" /><span className="text-[10px] text-muted-foreground">Pedidos</span></div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="docs">
          <TabsList className="w-full rounded-xl bg-secondary h-10 grid grid-cols-4">
            <TabsTrigger value="docs" className="rounded-lg text-[11px]">
              Documentos {pendingDocs.length > 0 && <span className="ml-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{pendingDocs.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg text-[11px]">Usuários</TabsTrigger>
            <TabsTrigger value="pros" className="rounded-lg text-[11px]">Profissionais</TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg text-[11px]">Pedidos</TabsTrigger>
          </TabsList>

          {/* Documents */}
          <TabsContent value="docs">
            <div className="space-y-2 mt-3">
              {documents.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nenhum documento enviado ainda</p>}
              {documents.map(doc => {
                const pro = professionals.find(p => p.id === doc.professional_id);
                return (
                  <div key={doc.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{doc.document_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{doc.professional_email}</p>
                        {pro && <p className="text-[11px] text-muted-foreground truncate">Profissional: {pro.name}</p>}
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full shrink-0 ${
                        doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                        doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {doc.status === 'approved' ? '✓ Aprovado' : doc.status === 'rejected' ? '✗ Rejeitado' : '⏳ Pendente'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <a href={doc.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <ExternalLink className="w-3 h-3" /> Ver arquivo
                      </a>
                      {doc.status === 'pending' && (
                        <>
                          <button onClick={() => handleApproveDoc(doc.id)} className="flex items-center gap-1 h-7 px-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-[10px] font-semibold hover:bg-green-100 transition">
                            <FileCheck className="w-3 h-3" /> Aprovar
                          </button>
                          <button onClick={() => handleRejectDoc(doc.id)} className="flex items-center gap-1 h-7 px-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[10px] font-semibold hover:bg-red-100 transition">
                            <FileX className="w-3 h-3" /> Rejeitar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <div className="space-y-2 mt-3">
              {users.map(u => (
                <div key={u.id} className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div className="w-10 h-10 rounded-full bg-foreground text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {u.full_name?.charAt(0) || u.email?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{u.full_name || '-'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-foreground text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{u.created_date ? format(new Date(u.created_date), 'dd/MM/yy') : ''}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {u.role !== 'admin' && u.email !== user?.email ? (
                      <button onClick={() => handlePromoteUser(u.id)} className="h-8 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1 text-[10px] font-semibold text-foreground">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </button>
                    ) : u.role === 'admin' && u.email !== user?.email ? (
                      <button onClick={() => handleDemoteUser(u.id)} className="h-8 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 transition flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                        <ShieldOff className="w-3 h-3" /> Rebaixar
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nenhum usuário encontrado</p>}
            </div>
          </TabsContent>

          {/* Professionals */}
          <TabsContent value="pros">
            <div className="space-y-2 mt-3">
              {professionals.map(p => (
                <div key={p.id} className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                    {p.photo_url
                      ? <img src={p.photo_url} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-500">{p.name?.charAt(0)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm truncate">{p.name}</p>
  
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{p.user_email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.is_available ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {p.is_available ? '● Online' : '○ Offline'}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {p.status}
                      </span>
                      <span className="text-[9px] text-muted-foreground">★ {p.rating_avg?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {p.status !== 'suspended' ? (
                      <button onClick={() => handleSuspendPro(p.id)} className="h-7 px-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold flex items-center gap-1 hover:bg-amber-100 transition">
                        <UserX className="w-3 h-3" /> Suspender
                      </button>
                    ) : (
                      <button onClick={() => handleActivatePro(p.id)} className="h-7 px-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-[10px] font-semibold flex items-center gap-1 hover:bg-green-100 transition">
                        <UserCheck className="w-3 h-3" /> Ativar
                      </button>
                    )}
                    <button onClick={() => handleDeletePro(p.id)} className="h-7 px-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[10px] font-semibold flex items-center gap-1 hover:bg-red-100 transition">
                      <Trash2 className="w-3 h-3" /> Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Requests */}
          <TabsContent value="requests">
            <div className="bg-white rounded-2xl overflow-hidden mt-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs">Profissional</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Valor</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.slice(0, 50).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs font-medium">{r.client_name || r.client_email}</TableCell>
                      <TableCell className="text-xs">{r.professional_name || '-'}</TableCell>
                      <TableCell>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] || 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_PT[r.status] || r.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-green-700">
                        {r.price_agreed ? `R$ ${r.price_agreed}` : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.created_date ? format(new Date(r.created_date), 'dd/MM/yy') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
}