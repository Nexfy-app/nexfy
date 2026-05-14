import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User, Star, Briefcase, LogOut, ChevronRight,
  Shield, Award, Bell, BarChart2, Trash2, Zap, MapPin } from 'lucide-react';
import LocationConfigModal from '../components/location/LocationConfigModal';
import NotificationCenter from '../components/notifications/NotificationCenter';
import TurboSection from '../components/turbo/TurboSection';
import useProfessionalLocationSync from '../hooks/useProfessionalLocationSync';
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
  const [turboData, setTurboData] = useState(null);
  const [turboLoading, setTurboLoading] = useState(false);
  const [showLocationConfig, setShowLocationConfig] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: 'Solicitação de exclusão de conta - Nexfy',
      body: `Olá ${user.full_name || user.email},\n\nRecebemos sua solicitação de exclusão de conta. Nossa equipe processará sua solicitação em até 5 dias úteis e você receberá uma confirmação por e-mail.\n\nNexfy`
    }).catch(() => {});
    setDeletingAccount(false);
    setShowDeleteConfirm(false);
    base44.auth.logout('/');
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed.length < 2) return;
    setSavingName(true);
    await base44.auth.updateMe({ display_name: trimmed });
    setUser((prev) => ({ ...prev, display_name: trimmed }));
    setEditingName(false);
    setSavingName(false);
    toast.success('Nome atualizado!');
  };

  const { data: myPro } = useQuery({
    queryKey: ['my-pro', user?.email],
    queryFn: () => base44.entities.Professional.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const professional = myPro?.[0];

  const { data: approvedDocs = [] } = useQuery({
    queryKey: ['my-approved-docs', professional?.id],
    queryFn: () => base44.entities.VerificationDocument.filter({ professional_id: professional.id, status: 'approved' }),
    enabled: !!professional?.id
  });

  const isVerified = approvedDocs.length > 0;

  useProfessionalLocationSync(professional);

  useEffect(() => {
    if (professional?.id) {
      base44.functions.invoke('turboCheckout', { action: 'get_status', professional_id: professional.id })
        .then((r) => setTurboData(r?.data || null))
        .catch(() => {});
    }
  }, [professional?.id]);

  const handleTurboClick = async () => {
    if (!professional?.id || turboData?.active) return;
    setTurboLoading(true);
    const res = await base44.functions.invoke('turboCheckout', {
      action: 'create_checkout',
      professional_id: professional.id,
    }).catch(() => null);
    setTurboLoading(false);
    if (res?.data?.url) {
      window.location.href = res.data.url;
    } else {
      toast.error('Erro ao abrir checkout. Tente novamente.');
    }
  };

  const menuItems = [
    { label: professional ? "Editar Perfil Profissional" : "Cadastrar como Profissional", icon: Briefcase, path: "/professional/edit", show: true },
    { label: "Validação de Documentos", icon: Shield, path: "/verify-documents", show: !!professional },
    { label: "Meu Painel", icon: BarChart2, path: "/professional/dashboard", show: !!professional },
    { label: "Minhas Avaliações", icon: Star, path: "/professional/reviews", show: !!professional },
    { label: "Notificações", icon: Bell, path: "/notifications/settings", show: true }
  ];

  const locationStatusLabel = () => {
    if (!professional) return null;
    if (!professional.is_available) return { label: 'Offline no mapa', color: '#8E8E93', dot: '#8E8E93' };
    if (professional.location_type === 'realtime') return { label: 'Tempo Real Ativo', color: '#007AFF', dot: '#007AFF' };
    if (professional.location_type === 'fixed' || professional.location_type === 'current') return { label: 'Localização Fixa Ativa', color: '#30D158', dot: '#30D158' };
    return { label: 'Online no mapa', color: '#30D158', dot: '#30D158' };
  };

  const locStatus = locationStatusLabel();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-[26px] font-bold text-foreground tracking-tight">Perfil</h1>
        {user?.email && <NotificationCenter userEmail={user.email} />}
      </div>

      <div className="px-4 space-y-3 pb-8">
        {/* User card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5"
          style={{
            background: '#ffffff',
            borderRadius: 22,
            border: '1px solid rgba(0,0,0,0.04)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)',
          }}>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                {professional?.photo_url
                  ? <img src={professional.photo_url} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <User className="w-7 h-7 text-slate-500" />
                    </div>
                }
              </div>
              {professional?.is_available &&
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white online-dot" />
              }
            </div>
            <div className="flex-1 min-w-0">
              {editingName
                ? <div className="flex items-center gap-1.5 mb-1">
                    <Input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                      className="h-8 text-sm rounded-xl px-2 py-1"
                      autoFocus />
                    <button onClick={handleSaveName} disabled={savingName} className="w-7 h-7 bg-green-500 text-white rounded-lg flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingName(false)} className="w-7 h-7 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                : <div className="flex items-center gap-1.5">
                    <h2 className="font-bold text-foreground truncate">{user?.display_name || user?.full_name || 'Usuário'}</h2>
                    <button onClick={() => { setNameInput(user?.display_name || user?.full_name || ''); setEditingName(true); }} className="w-5 h-5 text-muted-foreground hover:text-foreground transition shrink-0">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
              }
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              {professional && isVerified &&
                <div className="flex items-center gap-1 mt-1.5">
                  <Award className="w-3 h-3 text-amber-500" />
                  <span className="text-[11px] font-semibold text-amber-600">Profissional verificado</span>
                </div>
              }
            </div>
          </div>

          {/* Professional stats */}
          {professional &&
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
          }
        </motion.div>

        {/* Botão Turbo Nexfy — visível apenas para profissionais */}
        {professional && !turboData?.active && (
          <TurboSection onActivate={handleTurboClick} loading={turboLoading} />
        )}

        {professional && turboData?.active && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div
              className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3.5 relative overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 100%)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 20px rgba(0,0,0,0.22)'
              }}>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Zap className="w-4 h-4" style={{ color: '#e2e8f0' }} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#f1f5f9', letterSpacing: '-0.01em' }}>Turbo Nexfy</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Perfil em destaque na plataforma</p>
              </div>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
                <span className="text-[10px] font-semibold" style={{ color: '#e2e8f0' }}>Ativo</span>
              </div>
            </div>
          </motion.div>
        )}



        {/* Location config card — apenas para profissionais */}
        {professional && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <button
              onClick={() => setShowLocationConfig(true)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:opacity-95 transition active:scale-[0.99]"
              style={{
                background: '#ffffff',
                borderRadius: 22,
                border: '1px solid rgba(0,0,0,0.04)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)',
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: locStatus ? `${locStatus.dot}18` : 'rgba(0,122,255,0.10)' }}
              >
                <MapPin className="w-4 h-4" style={{ color: locStatus ? locStatus.dot : '#007AFF' }} />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-foreground">Configurar Localização</span>
                {locStatus && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: locStatus.dot }} />
                    <span className="text-[11px] font-medium" style={{ color: locStatus.color }}>{locStatus.label}</span>
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>
        )}

        {/* Menu items */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-hidden"
          style={{
            background: '#ffffff',
            borderRadius: 22,
            border: '1px solid rgba(0,0,0,0.04)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)',
          }}>
          {menuItems.filter((item) => item.show).map((item, i, arr) =>
            <Link
              key={item.label}
              to={item.path}
              className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50 transition"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                <item.icon className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground flex-1">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}
        </motion.div>

        {/* Admin */}
        {user?.role === 'admin' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Link
              to="/admin"
              className="flex items-center gap-3.5 px-4 py-3.5 transition hover:opacity-90"
              style={{
                background: '#ffffff',
                borderRadius: 22,
                border: '1px solid rgba(0,0,0,0.04)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)',
              }}>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'hsl(224 32% 8%)' }}
              >
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-[14px] font-semibold text-foreground flex-1 tracking-tight">Painel Administrativo</span>
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
          className="w-full flex items-center justify-center gap-2 h-12 text-red-600 text-[14px] font-semibold transition active:scale-[0.98]"
          style={{
            borderRadius: 22,
            border: '1px solid rgba(239,68,68,0.15)',
            background: 'rgba(239,68,68,0.05)',
          }}>
          <LogOut className="w-4 h-4" />
          Sair da conta
        </motion.button>

        {/* Delete Account */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-2xl text-muted-foreground text-xs font-medium hover:text-red-500 transition">
          <Trash2 className="w-3.5 h-3.5" />
          Excluir minha conta
        </motion.button>
      </div>

      {/* Location Config Modal */}
      <LocationConfigModal
        professional={professional}
        open={showLocationConfig}
        onClose={() => setShowLocationConfig(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['my-pro', user?.email] })}
      />

      {/* Delete Account Confirmation Dialog */}
      {showDeleteConfirm &&
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
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
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-sm font-medium text-foreground hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 h-11 rounded-2xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60">
                {deletingAccount ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </motion.div>
        </div>
      }
    </div>
  );
}