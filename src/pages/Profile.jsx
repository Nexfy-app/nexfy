import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Switch } from "@/components/ui/switch";
import {
  User, Star, Briefcase, LogOut, ChevronRight,
  Shield, Award, MapPin, Bell, BarChart2, Trash2
} from 'lucide-react';
import NotificationCenter from '../components/notifications/NotificationCenter';
import useProfessionalLocationSync from '../hooks/useProfessionalLocationSync';
import TurboNexfyCard from '../components/turbo/TurboNexfyCard';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    // Send a deletion request email to admin and notify user
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: 'Solicitação de exclusão de conta - Nexfy',
      body: `Olá ${user.full_name || user.email},\n\nRecebemos sua solicitação de exclusão de conta. Nossa equipe processará sua solicitação em até 5 dias úteis e você receberá uma confirmação por e-mail.\n\nNexfy`,
    }).catch(() => {});
    setDeletingAccount(false);
    setShowDeleteConfirm(false);
    base44.auth.logout('/');
  };

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSavingName(true);
    await base44.auth.updateMe({ full_name: nameInput.trim() });
    setUser(prev => ({ ...prev, full_name: nameInput.trim() }));
    setEditingName(false);
    setSavingName(false);
    toast.success('Nome atualizado!');
  };

  const { data: myPro } = useQuery({
    queryKey: ['my-pro', user?.email],
    queryFn: () => base44.entities.Professional.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const professional = myPro?.[0];

  // Atualiza localização e gerencia auto-offline
  const { minutesLeft } = useProfessionalLocationSync(professional, () => {
    queryClient.invalidateQueries({ queryKey: ['my-pro'] });
    toast('⏰ Você foi colocado offline automaticamente após 2h. Ative novamente se ainda estiver disponível.', { duration: 8000 });
  });

  const [turboData, setTurboData] = React.useState(null);
  useEffect(() => {
    if (professional) {
      base44.functions.invoke('turboCheckout', { action: 'get_status' })
        .then(r => setTurboData(r?.data || null))
        .catch(() => {});
    }
  }, [professional?.id]);

  const toggleAvailability = async () => {
    if (!professional) return;
    const newAvailable = !professional.is_available;

    // Ao ficar online, tenta capturar a localização atual do profissional
    if (newAvailable && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await base44.entities.Professional.update(professional.id, {
            is_available: true,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          queryClient.invalidateQueries({ queryKey: ['my-pro'] });
          queryClient.invalidateQueries({ queryKey: ['professionals'] });
          toast.success('✅ Você está online! Localização atualizada.');
        },
        async () => {
          // Se negar GPS, fica online mas sem atualizar localização
          await base44.entities.Professional.update(professional.id, { is_available: true });
          queryClient.invalidateQueries({ queryKey: ['my-pro'] });
          queryClient.invalidateQueries({ queryKey: ['professionals'] });
          toast.success('Você está online! (GPS negado — localização pode estar desatualizada)');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      await base44.entities.Professional.update(professional.id, { is_available: false });
      queryClient.invalidateQueries({ queryKey: ['my-pro'] });
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    }
  };

  const menuItems = [
    { label: professional ? "Editar Perfil Profissional" : "Cadastrar como Profissional", icon: Briefcase, path: "/professional/edit", show: true },
    { label: "Validação de Documentos", icon: Shield, path: "/verify-documents", show: !!professional },
    { label: "Meu Painel", icon: BarChart2, path: "/professional/dashboard", show: !!professional },
    { label: "Minhas Avaliações", icon: Star, path: "/professional/reviews", show: !!professional },
    { label: "Notificações", icon: Bell, path: "/notifications/settings", show: true },
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
              {user?.role === 'admin' && editingName ? (
                <div className="flex items-center gap-1.5 mb-1">
                  <Input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                    className="h-8 text-sm rounded-xl px-2 py-1"
                    autoFocus
                  />
                  <button onClick={handleSaveName} disabled={savingName} className="w-7 h-7 bg-green-500 text-white rounded-lg flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingName(false)} className="w-7 h-7 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-foreground truncate">{user?.full_name || 'Usuário'}</h2>
                  {user?.role === 'admin' && (
                    <button onClick={() => { setNameInput(user?.full_name || ''); setEditingName(true); }} className="w-5 h-5 text-muted-foreground hover:text-foreground transition shrink-0">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
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

        {/* Turbo Nexfy — visível apenas para profissionais */}
        {professional && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <TurboNexfyCard
              professional={professional}
              subscription={turboData?.subscription || null}
              onRefresh={() => base44.functions.invoke('turboCheckout', { action: 'get_status' }).then(r => setTurboData(r?.data || null)).catch(() => {})}
            />
          </motion.div>
        )}

        {/* Aviso de auto-offline */}
        {minutesLeft !== null && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3"
          >
            <span className="text-lg shrink-0">⏰</span>
            <div>
              <p className="text-sm font-bold text-amber-800">Você será colocado offline em breve</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Após 2h online, o sistema desativa automaticamente sua disponibilidade. Toque em "Disponível agora" para renovar mais 2h.
              </p>
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

        {/* Delete Account */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-2xl text-muted-foreground text-xs font-medium hover:text-red-500 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Excluir minha conta
        </motion.button>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-base font-bold text-foreground text-center mb-1">Excluir conta?</h2>
            <p className="text-xs text-muted-foreground text-center mb-5 leading-relaxed">
              Sua solicitação será enviada e processada em até 5 dias úteis. Você será desconectado imediatamente.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-sm font-medium text-foreground hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 h-11 rounded-2xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60"
              >
                {deletingAccount ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}