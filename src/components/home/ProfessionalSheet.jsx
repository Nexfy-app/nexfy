import React, { useState } from 'react';
import { Star, Award, Zap, Clock, Shield, ChevronRight, X, CheckCircle } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { PRICE_TYPE_LABELS, SERVICE_CATEGORIES } from '@/lib/constants';
import { base44 } from '@/api/base44Client';
import { createNotification, sendEmailIfEnabled } from '@/lib/notifications';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function ProfessionalSheet({ professional, open, onClose }) {
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!professional) return null;

  const handleHire = async () => {
    if (!description.trim()) {
      toast.error('Descreva o serviço que você precisa');
      return;
    }
    setLoading(true);
    const user = await base44.auth.me();
    const code = generateCode();
    await base44.entities.ServiceRequest.create({
      client_email: user.email,
      client_name: user.full_name || user.email,
      professional_id: professional.id,
      professional_name: professional.name,
      professional_user_email: professional.user_email,
      category: professional.categories?.[0] || '',
      description,
      address,
      is_urgent: isUrgent,
      status: 'pending',
      confirmation_code: code,
    });

    createNotification({
      user_email: professional.user_email,
      title: `Novo pedido de ${user.full_name || user.email}`,
      body: description?.slice(0, 80) || `Serviço: ${professional.categories?.[0]?.replace(/_/g, ' ')}`,
      type: 'new_request',
      link: '/requests',
    });
    sendEmailIfEnabled(professional.user_email, 'new_request', {
      to: professional.user_email,
      subject: `🔔 Novo pedido de serviço — ${user.full_name || user.email}`,
      emailBody: `Você recebeu um novo pedido!\n\nCliente: ${user.full_name || user.email}\nServiço: ${professional.categories?.[0]?.replace(/_/g, ' ')}\nDescrição: ${description}\nEndereço: ${address || 'Não informado'}${isUrgent ? '\n⚡ URGENTE' : ''}\n\nAcesse o ServiçosJá para aceitar ou recusar.`,
    });

    toast.success('Pedido enviado!');
    setLoading(false);
    setDescription('');
    setAddress('');
    setIsUrgent(false);
    onClose();
    navigate('/requests');
  };

  const getCategoryLabel = (id) => {
    const cat = SERVICE_CATEGORIES.find(c => c.id === id);
    return cat ? cat.label : id;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="p-0 border-0 rounded-t-[2rem] max-h-[92vh] overflow-y-auto"
        style={{ background: 'hsl(220 15% 11%)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Hero section */}
        <div className="px-5 pb-5 pt-2">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-18 h-18 rounded-2xl overflow-hidden bg-slate-100 shadow-md" style={{ width: 72, height: 72 }}>
                {professional.photo_url ? (
                  <img src={professional.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-600 bg-gradient-to-br from-slate-100 to-slate-200">
                    {professional.name?.charAt(0)}
                  </div>
                )}
              </div>
              {professional.is_available && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white online-dot" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-foreground">{professional.name}</h2>
                {professional.is_premium && <Award className="w-4 h-4 text-amber-500" />}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold">{professional.rating_avg?.toFixed(1) || '0.0'}</span>
                <span className="text-xs text-muted-foreground">({professional.rating_count || 0} avaliações)</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{professional.services_completed || 0} serviços realizados</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {professional.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">{professional.bio}</p>
          )}

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {professional.categories?.map(cat => (
              <span key={cat} className="text-[11px] px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(59,130,246,0.12)', color: 'rgba(147,197,253,0.9)', border: '1px solid rgba(59,130,246,0.15)' }}>
                {getCategoryLabel(cat)}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-5" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Price */}
        {professional.price_min && (
          <div className="px-5 py-4">
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs text-muted-foreground font-medium">{PRICE_TYPE_LABELS[professional.price_type] || 'A partir de'}</p>
              <p className="text-2xl font-black text-foreground mt-0.5">
                R$ {professional.price_min}
                {professional.price_max && (
                  <span className="text-base font-normal text-muted-foreground ml-1">
                    — R$ {professional.price_max}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="px-5 space-y-3 pb-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Descreva o serviço</label>
            <Textarea
              placeholder="Detalhe o que precisa ser feito..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none text-sm transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(var(--foreground))' }}
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Endereço</label>
            <Input
              placeholder="Onde será o serviço? (opcional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(var(--foreground))' }}
            />
          </div>

          {/* Urgent toggle */}
          <button
            onClick={() => setIsUrgent(!isUrgent)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200"
            style={isUrgent
            ? { background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }
            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isUrgent ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium" style={{ color: isUrgent ? '#fb923c' : 'hsl(var(--foreground))' }}>
                Serviço Urgente
              </span>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              isUrgent ? 'bg-orange-500 border-orange-500' : 'border-muted'
            }`}>
              {isUrgent && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </button>

          {/* Safety */}
          <div className="flex items-start gap-2.5 rounded-2xl p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <Shield className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#fbbf24' }} />
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(251,191,36,0.8)' }}>
              <strong>Pagamento seguro:</strong> Pague apenas após o serviço ser concluído. Combine tudo pelo app.
            </p>
          </div>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleHire}
            disabled={loading}
            className="w-full h-14 text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
            style={{ background: 'hsl(var(--primary))', boxShadow: '0 8px 32px rgba(59,130,246,0.35)' }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Contratar Agora
              </>
            )}
          </motion.button>

          <p className="text-[10px] text-center text-muted-foreground pb-2">
            Um código de confirmação será gerado ao contratar
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}