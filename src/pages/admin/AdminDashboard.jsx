import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, Briefcase, Star, MapPin, ArrowLeft,
  TrendingUp, Clock, CheckCircle2, AlertTriangle,
  DollarSign, QrCode, MousePointerClick, Activity, Shield
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [user, setUser] = useState(null);

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
  const { data: pixClicks = [] } = useQuery({ queryKey: ['admin-pix'], queryFn: () => base44.entities.PixClick.list('-created_date', 200), enabled });

  const onlinePros = professionals.filter(p => p.is_available).length;
  const completedRequests = requests.filter(r => r.status === 'completed');
  const totalEarnings = completedRequests.reduce((s, r) => s + (r.price_agreed || 0), 0);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  const prosWithPix = professionals.filter(p => p.pix_key).length;

  // Last 7 days registrations
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const day = subDays(new Date(), 6 - i);
      const start = startOfDay(day);
      const end = new Date(start.getTime() + 86400000);
      return {
        dia: format(day, 'EEE', { locale: ptBR }),
        pedidos: requests.filter(r => r.created_date && new Date(r.created_date) >= start && new Date(r.created_date) < end).length,
        pix: pixClicks.filter(c => c.created_date && new Date(c.created_date) >= start && new Date(c.created_date) < end).length,
      };
    });
  }, [requests, pixClicks]);

  const handleSuspend = async (proId) => {
    await base44.entities.Professional.update(proId, { status: 'suspended', is_available: false });
  };
  const handleActivate = async (proId) => {
    await base44.entities.Professional.update(proId, { status: 'active' });
  };

  const STATUS_PT = { pending: 'Pendente', accepted: 'Aceito', in_progress: 'Em andamento', completed: 'Concluído', cancelled: 'Cancelado' };
  const STATUS_COLOR = { pending: 'bg-amber-100 text-amber-700', accepted: 'bg-blue-100 text-blue-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

  if (user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-background pb-10">
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
          <StatCard title="Profissionais" value={professionals.length} icon={Briefcase} colorClass="bg-foreground" sub={`${prosWithPix} com PIX`} />
          <StatCard title="Online agora" value={onlinePros} icon={Activity} colorClass="bg-green-600" />
          <StatCard title="Avaliação média" value={avgRating !== '—' ? `${avgRating} ★` : '—'} icon={Star} colorClass="bg-amber-500" sub={`${reviews.length} avaliações`} />
        </div>

        {/* Financial */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Financeiro</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-black text-green-700">R$ {totalEarnings.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Volume total</p>
            </div>
            <div className="text-center border-x border-slate-100">
              <p className="text-xl font-black text-foreground">{completedRequests.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Concluídos</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-blue-600">{pixClicks.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Cliques PIX</p>
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
              <Bar dataKey="pix" fill="#22c55e" radius={[5, 5, 0, 0]} name="Cliques PIX" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center mt-1">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-foreground" /><span className="text-[10px] text-muted-foreground">Pedidos</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-green-500" /><span className="text-[10px] text-muted-foreground">Cliques PIX</span></div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users">
          <TabsList className="w-full rounded-xl bg-secondary h-10 grid grid-cols-4">
            <TabsTrigger value="users" className="rounded-lg text-[11px]">Usuários</TabsTrigger>
            <TabsTrigger value="pros" className="rounded-lg text-[11px]">Profissionais</TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg text-[11px]">Pedidos</TabsTrigger>
            <TabsTrigger value="pix" className="rounded-lg text-[11px]">PIX</TabsTrigger>
          </TabsList>

          {/* Users */}
          <TabsContent value="users">
            <div className="bg-white rounded-2xl overflow-hidden mt-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Desde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="text-xs font-medium">{u.full_name || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">{u.email}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-foreground text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.created_date ? format(new Date(u.created_date), 'dd/MM/yy') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                      {p.pix_key && <QrCode className="w-3 h-3 text-green-600 shrink-0" />}
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
                  {p.status !== 'suspended'
                    ? <Button size="sm" variant="outline" className="text-[10px] h-7 text-destructive border-destructive/30" onClick={() => handleSuspend(p.id)}>
                        <AlertTriangle className="w-3 h-3 mr-1" /> Suspender
                      </Button>
                    : <Button size="sm" variant="outline" className="text-[10px] h-7 text-green-700 border-green-200" onClick={() => handleActivate(p.id)}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Ativar
                      </Button>
                  }
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

          {/* PIX Analytics */}
          <TabsContent value="pix">
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <MousePointerClick className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-black text-foreground">{pixClicks.length}</p>
                  <p className="text-[10px] text-muted-foreground">Total cliques PIX</p>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-black text-foreground">
                    R$ {pixClicks.reduce((s, c) => s + (c.amount || 0), 0).toFixed(0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Volume intencionado</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs">Cliente</TableHead>
                      <TableHead className="text-xs">Profissional</TableHead>
                      <TableHead className="text-xs">Valor</TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pixClicks.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs">{c.client_email?.split('@')[0]}</TableCell>
                        <TableCell className="text-xs font-medium">{c.professional_name || '-'}</TableCell>
                        <TableCell className="text-xs font-semibold text-green-700">
                          {c.amount ? `R$ ${c.amount}` : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.created_date ? format(new Date(c.created_date), 'dd/MM/yy HH:mm') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {pixClicks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">
                          Nenhum clique PIX registrado ainda
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}