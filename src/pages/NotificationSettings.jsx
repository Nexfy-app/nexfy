import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const EMAIL_SETTINGS = [
  { key: 'email_new_request', label: 'Novo pedido recebido', desc: 'Quando um cliente solicitar seu serviço', icon: '📋' },
  { key: 'email_request_accepted', label: 'Pedido aceito', desc: 'Quando um profissional aceitar seu pedido', icon: '✅' },
  { key: 'email_request_in_progress', label: 'Serviço iniciado', desc: 'Quando o profissional iniciar o serviço', icon: '🔧' },
  { key: 'email_request_completed', label: 'Serviço concluído', desc: 'Quando o serviço for finalizado', icon: '🎉' },
  { key: 'email_new_message', label: 'Nova mensagem no chat', desc: 'Receba um e-mail para cada mensagem recebida', icon: '💬' },
];

export default function NotificationSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState({
    email_new_request: true,
    email_request_accepted: true,
    email_request_in_progress: true,
    email_request_completed: true,
    email_new_message: false,
  });
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: existing } = useQuery({
    queryKey: ['notif-settings', user?.email],
    queryFn: () => base44.entities.NotificationSettings.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (existing?.length > 0) {
      const s = existing[0];
      setSettingsId(s.id);
      setPrefs({
        email_new_request: s.email_new_request !== false,
        email_request_accepted: s.email_request_accepted !== false,
        email_request_in_progress: s.email_request_in_progress !== false,
        email_request_completed: s.email_request_completed !== false,
        email_new_message: s.email_new_message === true,
      });
    }
  }, [existing]);

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true);
    const data = { ...prefs, user_email: user.email };
    if (settingsId) {
      await base44.entities.NotificationSettings.update(settingsId, data);
    } else {
      await base44.entities.NotificationSettings.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['notif-settings'] });
    toast.success('Preferências salvas!');
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold">Notificações</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Email section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Notificações por E-mail</h2>
          </div>
          <div className="bg-card rounded-2xl border overflow-hidden divide-y">
            {EMAIL_SETTINGS.map(({ key, label, desc, icon }) => (
              <div key={key} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{icon}</span>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggle(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${prefs[key] ? 'bg-foreground' : 'bg-border'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* In-app info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Notificações no App</h2>
          </div>
          <div className="bg-secondary rounded-2xl px-4 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Notificações em tempo real aparecem no sino <span className="font-semibold text-foreground">🔔</span> no topo do app. Você sempre será notificado sobre novos pedidos, atualizações de status e mensagens independente das configurações de e-mail.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 bg-foreground text-background rounded-2xl font-semibold text-sm disabled:opacity-60 transition hover:bg-foreground/80"
        >
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </button>
      </div>
    </div>
  );
}