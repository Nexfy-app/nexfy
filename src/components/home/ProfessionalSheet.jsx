import React, { useState } from 'react';
import { Star, Award, Zap, Clock, Shield, X, CheckCircle, Navigation, MapPin, Timer } from 'lucide-react';
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

export default function ProfessionalSheet({ professional, open, onClose, eta }) {
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [otherCategoryText, setOtherCategoryText] = useState('');
  const navigate = useNavigate();

  if (!professional) return null;

  const getCategoryLabel = (id) => {
    const cat = SERVICE_CATEGORIES.find(c => c.id === id);
    return cat ? cat.label : id;
  };

  const effectiveCategory = selectedCategory || professional.categories?.[0] || '';
  const effectiveCategoryLabel = effectiveCategory === 'outros' && otherCategoryText
    ? otherCategoryText
    : getCategoryLabel(effectiveCategory);

  const handleHire = async () => {
    if (!description.trim()) {
      toast.error('Descreva o serviço que você precisa');
      return;
    }
    if (effectiveCategory === 'outros' && !otherCategoryText.trim()) {
      toast.error('Descreva qual é o serviço em "Outros"');
      return;
    }
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const code = generateCode();
      await base44.entities.ServiceRequest.create({
        client_email: user.email,
        client_name: user.full_name || user.email,
        professional_id: professional.id,
        professional_name: professional.name,
        professional_user_email: professional.user_email,
        category: effectiveCategory === 'outros' ? `outros:${otherCategoryText}` : effectiveCategory,
        description,
        address,
        is_urgent: isUrgent,
        status: 'pending',
        confirmation_code: code,
      });

      createNotification({
        user_email: professional.user_email,
        title: `Novo pedido de ${user.full_name || user.email}`,
        body: description?.slice(0, 80) || `Serviço: ${effectiveCategoryLabel}`,
        type: 'new_request',
        link: '/requests',
      });
      sendEmailIfEnabled(professional.user_email, 'new_request', {
        to: professional.user_email,
        subject: `🔔 Novo pedido de serviço — ${user.full_name || user.email}`,
        emailBody: `Você recebeu um novo pedido!\n\nCliente: ${user.full_name || user.email}\nServiço: ${effectiveCategoryLabel}\nDescrição: ${description}\nEndereço: ${address || 'Não informado'}${isUrgent ? '\n⚡ URGENTE' : ''}\n\nAcesse o ServiçosJá para aceitar ou recusar.`,
      });

      toast.success('Pedido enviado!');
      setDescription('');
      setAddress('');
      setIsUrgent(false);
      setSelectedCategory(null);
      setOtherCategoryText('');
      onClose();
      navigate('/requests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!loading) onClose(); }}>
      <SheetContent
        side="bottom"
        className="p-0 border-0 rounded-t-[2rem] max-h-[92vh] overflow-y-auto"
        style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(40px)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Distância / ETA — estilo Uber */}
        {(professional._distFormatted || eta) && (
          <div className="mx-5 mb-3 mt-1 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
            <div className="flex items-center divide-x divide-white/10">
              {professional._distFormatted && (
                <div className="flex-1 flex flex-col items-center py-3 px-4 gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-white font-black text-xl">{professional._distFormatted}</span>
                  </div>
                  <span className="text-white/50 text-[10px] font-medium">de distância</span>
                </div>
              )}
              {eta && (
                <div className="flex-1 flex flex-col items-center py-3 px-4 gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-white font-black text-xl">{eta} min</span>
                  </div>
                  <span className="text-white/50 text-[10px] font-medium">tempo estimado</span>
                </div>
              )}
              {professional.latitude && professional.longitude && (
                <div className="flex-1 flex flex-col items-center py-3 px-4 gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-white font-black text-xl">{professional.is_available ? 'Online' : 'Offline'}</span>
                  </div>
                  <span className="text-white/50 text-[10px] font-medium">status atual</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hero section */}
        <div className="px-5 pb-4 pt-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden bg-slate-100 shadow-md" style={{ width: 72, height: 72 }}>
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

          {professional.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">{professional.bio}</p>
          )}

          {/* Categories as selectable pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {professional.categories?.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={`text-[11px] px-3 py-1 rounded-full font-medium border transition-all ${
                  (selectedCategory === cat) || (!selectedCategory && cat === professional.categories?.[0])
                    ? 'bg-foreground text-white border-foreground'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* "Outros" free text field */}
          {effectiveCategory === 'outros' && (
            <div className="mt-2">
              <Input
                placeholder="Qual serviço você precisa?"
                value={otherCategoryText}
                onChange={e => setOtherCategoryText(e.target.value)}
                className="rounded-xl bg-slate-50 border-slate-200 text-sm"
              />
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100 mx-5" />

        {/* Price */}
        {professional.price_min && (
          <div className="px-5 py-3">
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
              <p className="text-xs text-muted-foreground font-medium">{PRICE_TYPE_LABELS[professional.price_type] || 'A partir de'}</p>
              <p className="text-2xl font-black text-foreground mt-0.5">
                R$ {professional.price_min}
                {professional.price_max && (
                  <span className="text-base font-normal text-muted-foreground ml-1">— R$ {professional.price_max}</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="px-5 space-y-3 pb-6">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Descreva o serviço</label>
            <Textarea
              placeholder="Detalhe o que precisa ser feito..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none bg-slate-50 border-slate-200 text-sm focus:bg-white transition-colors"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Endereço</label>
            <Input
              placeholder="Onde será o serviço? (opcional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>

          {/* Urgent toggle */}
          <button
            type="button"
            onClick={() => setIsUrgent(!isUrgent)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
              isUrgent
                ? 'bg-orange-50 border border-orange-200'
                : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isUrgent ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${isUrgent ? 'text-orange-700' : 'text-foreground'}`}>
                Serviço Urgente
              </span>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              isUrgent ? 'bg-orange-500 border-orange-500' : 'border-slate-300'
            }`}>
              {isUrgent && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </button>

          {/* Safety */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <Shield className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              <strong>Pagamento seguro:</strong> Pague apenas após o serviço ser concluído. Combine tudo pelo app.
            </p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleHire}
            disabled={loading}
            className="w-full h-14 bg-foreground text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 active:scale-[0.98] transition-all"
            style={{ boxShadow: '0 8px 24px rgba(15,23,42,0.2)' }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Contratar Agora
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-muted-foreground">
            Um código de confirmação será gerado ao contratar
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}