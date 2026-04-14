import React, { useState } from 'react';
import { Star, MapPin, Award, MessageSquare, Zap, Phone, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { PRICE_TYPE_LABELS, SERVICE_CATEGORIES } from '@/lib/constants';
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

export default function ProfessionalSheet({ professional, open, onClose }) {
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!professional) return null;

  const handleHire = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    await base44.entities.ServiceRequest.create({
      client_email: user.email,
      client_name: user.full_name || user.email,
      professional_id: professional.id,
      professional_name: professional.name,
      category: professional.categories?.[0] || '',
      description,
      address,
      is_urgent: isUrgent,
      status: 'pending',
    });
    toast.success('Solicitação enviada com sucesso!');
    setLoading(false);
    setDescription('');
    setAddress('');
    onClose();
    navigate('/requests');
  };

  const getCategoryLabel = (id) => {
    const cat = SERVICE_CATEGORIES.find(c => c.id === id);
    return cat ? cat.label : id;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto p-0">
        <div className="p-6">
          <SheetHeader className="mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-secondary overflow-hidden">
                  {professional.photo_url ? (
                    <img src={professional.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                      {professional.name?.charAt(0)}
                    </div>
                  )}
                </div>
                {professional.is_available && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-lg">{professional.name}</SheetTitle>
                  {professional.is_premium && <Award className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold">{professional.rating_avg?.toFixed(1) || '0.0'}</span>
                    <span className="text-xs text-muted-foreground">({professional.rating_count || 0} avaliações)</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{professional.services_completed || 0} serviços realizados</span>
                </div>
              </div>
            </div>
          </SheetHeader>

          {professional.bio && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{professional.bio}</p>
          )}

          <div className="flex flex-wrap gap-1.5 mb-4">
            {professional.categories?.map(cat => (
              <Badge key={cat} variant="secondary" className="text-xs px-3 py-1">
                {getCategoryLabel(cat)}
              </Badge>
            ))}
          </div>

          {professional.price_min && (
            <div className="bg-secondary/50 rounded-xl p-3 mb-4">
              <p className="text-xs text-muted-foreground">{PRICE_TYPE_LABELS[professional.price_type] || 'Preço'}</p>
              <p className="text-xl font-bold text-primary">
                R$ {professional.price_min}
                {professional.price_max && ` - R$ ${professional.price_max}`}
              </p>
            </div>
          )}

          <div className="space-y-3 mb-4">
            <Textarea
              placeholder="Descreva o serviço que você precisa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />
            <Input
              placeholder="Endereço para o serviço"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="flex gap-2 mb-3">
            <Button
              onClick={handleHire}
              disabled={loading}
              className="flex-1 h-12 rounded-xl font-semibold text-sm"
            >
              {loading ? 'Enviando...' : 'Contratar Agora'}
            </Button>
            <Button
              variant={isUrgent ? "default" : "outline"}
              onClick={() => setIsUrgent(!isUrgent)}
              className="h-12 rounded-xl px-4"
            >
              <Zap className="w-4 h-4" />
            </Button>
          </div>

          {isUrgent && (
            <p className="text-xs text-center text-orange-600 font-medium">
              ⚡ Serviço marcado como urgente — o profissional será notificado imediatamente
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}