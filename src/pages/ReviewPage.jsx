import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

export default function ReviewPage() {
  const requestId = window.location.pathname.split('/review/')[1];
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [request, setRequest] = useState(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const user = await base44.auth.me();
      const requests = await base44.entities.ServiceRequest.filter({ id: requestId });
      const req = requests[0];
      setRequest(req);

      if (req) {
        const existing = await base44.entities.Review.filter({
          service_request_id: requestId,
          client_email: user.email,
        });
        if (existing?.length > 0) setAlreadyReviewed(true);
      }
      setLoading(false);
    };
    init();
  }, [requestId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Selecione uma nota');
      return;
    }
    setSaving(true);
    const user = await base44.auth.me();

    await base44.entities.Review.create({
      service_request_id: requestId,
      professional_id: request.professional_id,
      client_email: user.email,
      client_name: user.full_name || user.email,
      rating,
      comment,
    });

    // Recalcula média do profissional
    const reviews = await base44.entities.Review.filter({ professional_id: request.professional_id });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await base44.entities.Professional.update(request.professional_id, {
      rating_avg: Math.round(avg * 10) / 10,
      rating_count: reviews.length,
    });

    setSaving(false);
    setSubmitted(true);
  };

  const LABELS = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Avaliação enviada!</h2>
          <p className="text-muted-foreground text-sm mb-8">Obrigado pelo feedback. Ele ajuda outros clientes a escolherem os melhores profissionais.</p>
          <Button onClick={() => navigate('/requests')} className="w-full h-12 rounded-xl font-semibold">
            Voltar aos Pedidos
          </Button>
        </motion.div>
      </div>
    );
  }

  if (alreadyReviewed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Star className="w-10 h-10 text-amber-400 fill-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Você já avaliou!</h2>
        <p className="text-muted-foreground text-sm mb-8">Sua avaliação para este serviço já foi enviada.</p>
        <Button onClick={() => navigate('/requests')} className="w-full h-12 rounded-xl font-semibold">
          Voltar aos Pedidos
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b px-4">
        <div className="flex items-center gap-3 py-3 pt-safe">
          <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-bold">Avaliar Serviço</h1>
        </div>
      </div>

      <div className="p-6">
        {/* Professional info */}
        {request && (
          <div className="bg-white rounded-2xl p-4 mb-6 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-xs text-muted-foreground mb-1">Avaliando</p>
            <p className="font-bold text-foreground">{request.professional_name}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {request.category?.startsWith('outros:')
                ? request.category.replace('outros:', '')
                : request.category?.replace(/_/g, ' ')}
            </p>
          </div>
        )}

        {/* Stars */}
        <div className="flex flex-col items-center mb-6">
          <p className="text-sm text-muted-foreground mb-4">Como foi sua experiência?</p>
          <div className="flex gap-3 mb-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star className={cn(
                  "w-11 h-11 transition-all",
                  n <= (hovered || rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"
                )} />
              </button>
            ))}
          </div>
          <p className={cn("text-sm font-semibold transition-all", rating > 0 ? "text-foreground" : "text-transparent")}>
            {LABELS[hovered || rating]}
          </p>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Comentário (opcional)</label>
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Conte como foi o atendimento, pontualidade, qualidade do serviço..."
            className="rounded-xl resize-none"
            rows={4}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={saving || rating === 0}
          className="w-full h-12 rounded-xl font-semibold"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : 'Enviar Avaliação'}
        </Button>
      </div>
    </div>
  );
}