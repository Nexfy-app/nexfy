import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProfessionalReviews() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [professional, setProfessional] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: myPro } = useQuery({
    queryKey: ['my-pro-reviews', user?.email],
    queryFn: () => base44.entities.Professional.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (myPro?.length > 0) setProfessional(myPro[0]);
  }, [myPro]);

  const { data: reviews = [] } = useQuery({
    queryKey: ['my-reviews', professional?.id],
    queryFn: () => base44.entities.Review.filter({ professional_id: professional.id }, '-created_date'),
    enabled: !!professional?.id,
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate('/profile')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">Minhas Avaliações</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Card */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-amber-700 font-medium mb-1">Avaliação Geral</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-amber-600">{avgRating}</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(parseFloat(avgRating))
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-amber-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-700">{reviews.length}</p>
                <p className="text-xs text-amber-600 font-medium">avaliação{reviews.length !== 1 ? 'ões' : ''}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-4 border border-slate-100"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{review.client_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {review.created_date && format(new Date(review.created_date), 'dd MMM yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">Sem avaliações ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Conforme realizar serviços, você receberá avaliações dos clientes</p>
          </div>
        )}
      </div>
    </div>
  );
}