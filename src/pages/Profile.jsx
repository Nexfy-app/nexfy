import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  User, Settings, Star, Briefcase, LogOut, ChevronRight,
  Shield, Award, MapPin
} from 'lucide-react';
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

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  const menuItems = [
    { label: "Editar Perfil Profissional", icon: Briefcase, path: "/professional/edit", show: !!professional },
    { label: "Cadastrar como Profissional", icon: Briefcase, path: "/professional/edit", show: !professional },
    { label: "Minhas Avaliações", icon: Star, path: "/reviews", show: !!professional },
    { label: "Configurações", icon: Settings, path: "/settings", show: true },
  ];

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-safe">
        <div className="pt-4 pb-6">
          <h1 className="text-xl font-bold">Perfil</h1>
        </div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border p-5 mb-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            {professional?.photo_url ? (
              <img src={professional.photo_url} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <User className="w-6 h-6 text-foreground" />
            )}
            </div>
            <div className="flex-1">
              <h2 className="font-bold">{user?.full_name || 'Usuário'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {professional && (
                <Badge className="mt-1 bg-foreground text-background border-0 text-[10px]">
                  <Award className="w-3 h-3 mr-0.5" /> Profissional
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Availability Toggle */}
        {professional && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border p-5 mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary">
                  <MapPin className={`w-5 h-5 ${professional.is_available ? 'text-foreground' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm">Disponível agora</p>
                  <p className="text-xs text-muted-foreground">
                    {professional.is_available ? 'Você está visível no mapa' : 'Ative para aparecer no mapa'}
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
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border overflow-hidden mb-4"
        >
          {menuItems.filter(item => item.show).map((item, i) => (
            <Link
              key={item.label}
              to={item.path}
              className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition border-b last:border-0"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </motion.div>

        {/* Admin Link */}
        {user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4"
          >
            <Link
              to="/admin"
              className="flex items-center gap-3 bg-card rounded-2xl border p-4 hover:bg-secondary/50 transition"
            >
              <Shield className="w-5 h-5 text-foreground" />
              <span className="text-sm font-medium flex-1">Painel Administrativo</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </motion.div>
        )}

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full rounded-xl h-11 text-destructive hover:text-destructive hover:bg-destructive/5 mb-8"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </div>
    </div>
  );
}