import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Switch } from "@/components/ui/switch";
import {
  User, Settings, Star, Briefcase, LogOut, ChevronRight,
  Shield, Award, MapPin, Bell, TrendingUp
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: myPro } = useQuery({
    queryKey: ['my-pro', user?.email],
    queryFn: () => base44.entities.Professional.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const professional = myPro?.[0];

  const toggleAvailability = async () => {
    if (!professional) return;
    await base44.entities.Professional.update(professional.id, {
      is_available: !professional.is_available,
    });
    queryClient.invalidateQueries({ queryKey: ['my-pro'] });
  };

  const menuItems = [
    { label: professional ? "Editar Perfil Profissional" : "Cadastrar como Profissional", icon: Briefcase, path: "/professional/edit", show: true },
    { label: "Minhas Avaliações", icon: Star, path: "/reviews", show: !!professional },
    { label: "Notificações", icon: Bell, path: "/notifications/settings", show: true },
    { label: "Configurações", icon: Settings, path: "/settings", show: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-black text-foreground tracking-tight">Perfil</h1>
      </div>

      <div className="px-4 space-y-3 pb-8">
        {/* User hero card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(220 15% 16%) 0%, hsl(220 18% 12%) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Decorative glow */}
          <div
            className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }}
          />

          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                {professional?.photo_url ? (
                  <img src={professional.photo_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <User className="w-7 h-7 text-primary" />
                )}
              </div>
              {professional?.is_available && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background online-dot" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-foreground truncate text-lg leading-tight">{user?.full_name || 'Usuário'}</h2>
              <p className="text-sm text-muted-foreground truncate mt-0.5">{user?.email}</p>
              {professional && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-400">Verificado</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          {professional && (
            <div
              className="flex gap-0 mt-5 pt-4 rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {[
                { value: professional.services_completed || 0, label: 'Serviços' },
                { value: professional.rating_avg?.toFixed(1) || '–', label: 'Avaliação' },
                { value: professional.rating_count || 0, label: 'Reviews' },
              ].map((s, i, arr) => (
                <div key={s.label} className="flex-1 text-center py-3 relative">
                  {i < arr.length - 1 && (
                    <div className="absolute right-0 top-3 bottom-3 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  )}
                  <p className="text-xl font-black text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Availability toggle */}
        {professional && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl p-4"
            style={{
              background: professional.is_available
                ? 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))'
                : 'hsl(var(--card))',
              border: professional.is_available
                ? '1px solid rgba(34,197,94,0.2)'
                : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  professional.is_available ? 'bg-green-500/15' : 'bg-muted'
                }`}>
                  <MapPin className={`w-5 h-5 ${professional.is_available ? 'text-green-400' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Disponível agora</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {professional.is_available ? '🟢 Visível no mapa' : 'Ative para aparecer no mapa'}
                  </p>
                </div>
              </div>
              <Switch checked={professional.is_available} onCheckedChange={toggleAvailability} />
            </div>
          </motion.div>
        )}

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {menuItems.filter(item => item.show).map((item, i, arr) => (
            <Link
              key={item.label}
              to={item.path}
              className="flex items-center gap-3.5 px-4 py-3.5 transition-all active:bg-muted"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
            >
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground flex-1">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </Link>
          ))}
        </motion.div>

        {/* Admin */}
        {user?.role === 'admin' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Link
              to="/admin"
              className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all active:opacity-80"
              style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground flex-1">Painel Administrativo</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </Link>
          </motion.div>
        )}

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => base44.auth.logout('/')}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-bold transition-all active:opacity-80"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </motion.button>
      </div>
    </div>
  );
}