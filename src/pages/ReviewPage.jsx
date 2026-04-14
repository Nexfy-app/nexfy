import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ReviewPage() {
  const requestId = window.location.pathname.split('/review/')[1];
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Selecione uma nota');
      return;
    }
    setSaving(true);
    const user = await base44.auth.me();
    const requests = await base44.entities.ServiceRequest.filter({ id: requestId });
    const request = requests[0];
    if (!request) { toast.error('Pedido não encontrado'); setSaving(false); return; }

    await base44.entities.Review.create({
      service_request_id: requestId,
      professional_id: request.professional_id,
      client_email: user.email,
      client_name: user.full_name || user.email,
      rating,
      comment,
    });

    // Update professional average
    const reviews = await base44.entities.Review.filter({ professional_id: request.professional_id });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await base44.entities.Professional.update(request.professional_id, {
      rating_avg: Math.round(avg * 10) / 10,
      rating_count: reviews.length,
    });

    toast.success('Avaliação enviada!');
    setSaving(false);
    navigate('/requests');
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-bold">Avaliar Serviço</h1>
        </div>
      </div>

      <div className="p-6 flex flex-col items-center">
        <p className="text-muted-foreground text-sm mb-6">Como foi sua experiência?</p>

        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setRating(n)} className="transition-transform hover:scale-110">
              <Star className={cn(
                "w-10 h-10 transition",
                n <= rating ? "text-yellow-500 fill-yellow-500" : "text-border"
              )} />
            </button>
          ))}
        </div>

        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Deixe um comentário (opcional)..."
          className="rounded-xl resize-none w-full mb-6"
          rows={4}
        />

        <Button onClick={handleSubmit} disabled={saving} className="w-full h-12 rounded-xl font-semibold">
          {saving ? 'Enviando...' : 'Enviar Avaliação'}
        </Button>
      </div>
    </div>
  );
}