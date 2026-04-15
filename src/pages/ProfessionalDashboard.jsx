import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, CheckCircle2, Star, DollarSign, Clock, Briefcase } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#0f172a', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

function StatCard({ icon: Icon, label, value, sub, color = 'bg-foreground' }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
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

export default function ProfessionalDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['pro-reviews-dashboard', professional?.id],
    queryFn: () => base44.entities.Review.filter({ professional_id: professional.id }, '-created_date', 100),
    enabled: !!professional?.id,
  });

  // --- Stats calculations ---
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  const thisMonthRequests = useMemo(() =>
    requests.filter(r => {
      const d = new Date(r.created_date);
      return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
    }), [requests]);

  const completedAll = requests.filter(r => r.status === 'completed');
  const completedThisMonth = thisMonthRequests.filter(r => r.status === 'completed');

  const earningsThisMonth = completedThisMonth.reduce((sum, r) => sum + (r.price_agreed || 0), 0);
  const acceptedThisMonth = thisMonthRequests.filter(r => r.status !== 'cancelled').length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  // --- Last 6 months bar chart ---
  const last6Months = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(now, 5 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const completed = requests.filter(r =>
        r.status === 'completed' && isWithinInterval(new Date(r.created_date), { start, end })
      );
      const earnings = completed.reduce((s, r) => s + (r.price_agreed || 0), 0);
      return {
        mes: format(d, 'MMM', { locale: ptBR }),
        serviços: completed.length,
        ganhos: earnings,
      };
    });
  }, [requests]);

  // --- Status pie ---
  const statusCounts = useMemo(() => {
    const map = {};
    requests.forEach(r => { map[r.status] = (map[r.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [requests]);

  const STATUS_PT = { pending: 'Pendente', accepted: 'Aceito', in_progress: 'Em andamento', completed: 'Concluído', cancelled: 'Cancelado' };

  if (!professional && proData.length === 0 && user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Briefcase className="w-12 h-12 text-muted-foreground" />
        <p className="font-bold text-foreground">Você não tem perfil profissional</p>
        <p className="text-sm text-muted-foreground">Crie seu perfil profissional para acessar o painel.</p>
        <button onClick={() => navigate('/professional/edit')} className="mt-2 px-6 py-2.5 bg-foreground text-white rounded-2xl font-semibold text-sm">
          Criar Perfil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4" style={{ background: 'rgba(245,247,250,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="pt-12 pb-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Meu Painel</h1>
            <p className="text-xs text-muted-foreground">{professional?.name || '...'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-5">

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={DollarSign}
            label="Ganhos no mês"
            value={earningsThisMonth > 0 ? `R$ ${earningsThisMonth.toFixed(0)}` : 'R$ 0'}
            sub="serviços concluídos"
            color="bg-green-600"
          />
          <StatCard
            icon={CheckCircle2}
            label="Aceitos no mês"
            value={acceptedThisMonth}
            sub="solicitações"
            color="bg-blue-600"
          />
          <StatCard
            icon={Star}
            label="Satisfação média"
            value={avgRating !== '—' ? `${avgRating} ★` : '—'}
            sub={`${reviews.length} avaliações`}
            color="bg-amber-500"
          />
          <StatCard
            icon={Briefcase}
            label="Total concluídos"
            value={completedAll.length}
            sub="todos os tempos"
            color="bg-foreground"
          />
        </div>

        {/* Bar chart — serviços por mês */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Serviços concluídos — últimos 6 meses</h2>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={last6Months} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v) => [v, 'Serviços']}
              />
              <Bar dataKey="serviços" fill="#0f172a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line chart — ganhos por mês */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Ganhos — últimos 6 meses</h2>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={last6Months} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v) => [`R$ ${v}`, 'Ganhos']}
              />
              <Line type="monotone" dataKey="ganhos" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — status */}
        {statusCounts.length > 0 && (
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-foreground">Distribuição por status</h2>
            </div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={35} outerRadius={58} dataKey="value" paddingAngle={3}>
                    {statusCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1">
                {statusCounts.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-muted-foreground">{STATUS_PT[s.name] || s.name}</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent reviews */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-foreground">Avaliações recentes</h2>
            </div>
            <div className="space-y-3">
              {reviews.slice(0, 3).map(r => (
                <div key={r.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {r.client_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">{r.client_name || 'Cliente'}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
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
    </div>
  );
}