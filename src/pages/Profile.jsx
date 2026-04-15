import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Switch } from "@/components/ui/switch";
import {
  User, Settings, Star, Briefcase, LogOut, ChevronRight,
  Shield, Award, MapPin, Bell
} from 'lucide-react';
import NotificationCenter from '../components/notifications/NotificationCenter';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

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
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        {user?.email && <NotificationCenter userEmail={user.email} />}
      </div>

      <div className="px-4 space-y-3 pb-8">
        {/* User card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                {professional?.photo_url ? (
                  <img src={professional.photo_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <User className="w-7 h-7 text-slate-500" />
                  </div>
                )}
              </div>
              {professional?.is_available && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white online-dot" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-foreground truncate">{user?.full_name || 'Usuário'}</h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              {professional && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Award className="w-3 h-3 text-amber-500" />
                  <span className="text-[11px] font-semibold text-amber-600">Profissional verificado</span>
                </div>
              )}
            </div>
          </div>

          {/* Professional stats */}
          {professional && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
              <div className="flex-1 text-center">
                <p className="text-lg font-black text-foreground">{professional.services_completed || 0}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Serviços</p>
              </div>
              <div className="w-px bg-slate-100" />
              <div className="flex-1 text-center">
                <p className="text-lg font-black text-foreground">{professional.rating_avg?.toFixed(1) || '–'}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Avaliação</p>
              </div>
              <div className="w-px bg-slate-100" />
              <div className="flex-1 text-center">
                <p className="text-lg font-black text-foreground">{professional.rating_count || 0}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Avaliações</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Availability toggle */}
        {professional && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-4"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  professional.is_available ? 'bg-green-50' : 'bg-slate-100'
                }`}>
                  <MapPin className={`w-5 h-5 ${professional.is_available ? 'text-green-600' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Disponível agora</p>
                  <p className="text-xs text-muted-foreground">
                    {professional.is_available ? '● Visível no mapa' : 'Ative para aparecer no mapa'}
                  </p>
                </div>
              </div>
              <Switch checked={professional.is_available} onCheckedChange={toggleAvailability} />
            </div>
          </motion.div>
        )}

        {/* Menu items */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
        >
          {menuItems.filter(item => item.show).map((item, i, arr) => (
            <Link
              key={item.label}
              to={item.path}
              className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50 transition"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                <item.icon className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground flex-1">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </motion.div>

        {/* Admin */}
        {user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Link
              to="/admin"
              className="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 hover:bg-slate-50 transition"
              style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
            >
              <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground flex-1">Painel Administrativo</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </motion.div>
        )}

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => base44.auth.logout('/')}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-red-100 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </motion.button>
      </div>
    </div>
  );
}