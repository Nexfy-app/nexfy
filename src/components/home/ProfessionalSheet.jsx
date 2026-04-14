import React, { useState } from 'react';
import { Star, Award, Zap, Clock, Shield, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { PRICE_TYPE_LABELS, SERVICE_CATEGORIES } from '@/lib/constants';
import { base44 } from '@/api/base44Client';
import { createNotification, sendEmailIfEnabled } from '@/lib/notifications';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

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
    const req = await base44.entities.ServiceRequest.create({
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

    // In-app notification for professional
    createNotification({
      user_email: professional.user_email,
      title: `Novo pedido de ${user.full_name || user.email}`,
      body: description?.slice(0, 80) || `Serviço: ${professional.categories?.[0]?.replace(/_/g, ' ')}`,
      type: 'new_request',
      link: '/requests',
    });
    // Email (respects settings)
    sendEmailIfEnabled(professional.user_email, 'new_request', {
      to: professional.user_email,
      subject: `🔔 Novo pedido de serviço — ${user.full_name || user.email}`,
      emailBody: `Você recebeu um novo pedido!\n\nCliente: ${user.full_name || user.email}\nServiço: ${professional.categories?.[0]?.replace(/_/g, ' ')}\nDescrição: ${description}\nEndereço: ${address || 'Não informado'}${isUrgent ? '\n⚡ URGENTE' : ''}\n\nAcesse o ServiçosJá para aceitar ou recusar.`,
    });

    toast.success('Pedido enviado! Aguarde a confirmação do profissional.');
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
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto p-0">
        {/* Professional header */}
        <div className="bg-foreground text-background p-6 rounded-t-3xl">
          <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-5" />
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/20 overflow-hidden">
                {professional.photo_url ? (
                  <img src={professional.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                    {professional.name?.charAt(0)}
                  </div>
                )}
              </div>
              {professional.is_available && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg text-background">{professional.name}</SheetTitle>
                {professional.is_premium && <Award className="w-4 h-4 text-yellow-400" />}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold">{professional.rating_avg?.toFixed(1) || '0.0'}</span>
                <span className="text-xs opacity-60">({professional.rating_count || 0} avaliações)</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-xs opacity-60">
                <Clock className="w-3 h-3" />
                <span>{professional.services_completed || 0} serviços</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Bio */}
          {professional.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed">{professional.bio}</p>
          )}

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            {professional.categories?.map(cat => (
              <Badge key={cat} variant="secondary" className="text-xs px-3 py-1 rounded-full font-medium">
                {getCategoryLabel(cat)}
              </Badge>
            ))}
          </div>

          {/* Price */}
          {professional.price_min && (
            <div className="border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">{PRICE_TYPE_LABELS[professional.price_type] || 'Preço'}</p>
              <p className="text-2xl font-bold mt-1">
                R$ {professional.price_min}
                {professional.price_max && <span className="text-base font-normal text-muted-foreground"> — R$ {professional.price_max}</span>}
              </p>
            </div>
          )}

          {/* Safety notice */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl p-3">
            <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-800 leading-relaxed">
              <strong>Pagamento seguro:</strong> Recomendamos combinar tudo pelo app. Pague somente após o serviço ser concluído e a profissionais de confiança.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <Textarea
              placeholder="Descreva detalhadamente o serviço que você precisa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none bg-secondary border-0 text-sm"
              rows={3}
            />
            <Input
              placeholder="Endereço para o serviço (opcional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-xl bg-secondary border-0"
            />
          </div>

          {/* Urgent toggle */}
          <button
            onClick={() => setIsUrgent(!isUrgent)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
              isUrgent ? 'bg-orange-50 border-orange-300' : 'bg-secondary border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isUrgent ? 'text-orange-600' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${isUrgent ? 'text-orange-700' : 'text-foreground'}`}>
                Serviço Urgente
              </span>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
              isUrgent ? 'bg-orange-500 border-orange-500' : 'border-border'
            }`}>
              {isUrgent && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
            </div>
          </button>

          {/* CTA */}
          <button
            onClick={handleHire}
            disabled={loading}
            className="w-full h-14 bg-foreground text-background rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:bg-foreground/80 transition disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Contratar — Um código será gerado <ChevronRight className="w-4 h-4" /></>
            )}
          </button>

          <p className="text-[10px] text-center text-muted-foreground pb-2">
            Ao contratar, você receberá um código de 4 dígitos para confirmar o serviço com o profissional.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}