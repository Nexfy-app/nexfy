import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Save, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { cn } from "@/lib/utils";

export default function ProfessionalEdit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', bio: '', categories: [],
    price_type: 'budget', price_min: '', price_max: '',
    photo_url: '',
    latitude: null,
    longitude: null,
  });
  const [otherCategory, setOtherCategory] = useState('');


  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: existing } = useQuery({
    queryKey: ['edit-pro', user?.email],
    queryFn: () => base44.entities.Professional.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (existing?.[0]) {
      const pro = existing[0];
      const cats = pro.categories || [];
      const otherCat = cats.find(c => c.startsWith('outros:'));
      if (otherCat) setOtherCategory(otherCat.replace('outros:', ''));
      setForm({
        name: pro.name || '',
        phone: pro.phone || '',
        bio: pro.bio || '',
        categories: cats,
        price_type: pro.price_type || 'budget',
        price_min: pro.price_min || '',
        price_max: pro.price_max || '',
        photo_url: pro.photo_url || '',
        latitude: pro.latitude || null,
        longitude: pro.longitude || null,
      });
    } else if (user) {
      setForm(prev => ({ ...prev, name: user.full_name || '' }));
    }
  }, [existing, user]);

  const toggleCategory = (catId) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter(c => c !== catId)
        : [...prev.categories, catId]
    }));
  };

  const handleOtherCategory = (value) => {
    setOtherCategory(value);
    setForm(prev => {
      const withoutOther = prev.categories.filter(c => !c.startsWith('outros:'));
      return {
        ...prev,
        categories: value.trim() ? [...withoutOther, `outros:${value.trim()}`] : withoutOther
      };
    });
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, photo_url: file_url }));
    toast.success('Foto atualizada!');
  };



  const handleSave = async () => {
    if (!form.name || form.categories.length === 0) {
      toast.error('Preencha o nome e selecione pelo menos uma categoria');
      return;
    }
    setSaving(true);
    const data = {
      ...form,
      user_email: user.email,
      price_min: form.price_min ? Number(form.price_min) : undefined,
      price_max: form.price_max ? Number(form.price_max) : undefined,
      status: 'active',
    };

    if (existing?.[0]) {
      await base44.entities.Professional.update(existing[0].id, data);
    } else {
      await base44.entities.Professional.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['my-pro'] });
    toast.success('Perfil salvo com sucesso!');
    setSaving(false);
    navigate('/profile');
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-bold">Perfil Profissional</h1>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Photo */}
        <div className="flex justify-center">
          <label className="cursor-pointer group">
            <div className="w-24 h-24 rounded-2xl bg-secondary overflow-hidden relative">
              {form.photo_url ? (
                <img src={form.photo_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition" />
                </div>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <p className="text-xs text-center text-muted-foreground mt-1">Alterar foto</p>
          </label>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nome completo</Label>
            <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label className="text-xs">Telefone</Label>
            <Input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="rounded-xl mt-1" placeholder="(55) 99999-9999" />
          </div>
          <div>
            <Label className="text-xs">Sobre você</Label>
            <Textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} className="rounded-xl mt-1 resize-none" rows={3} placeholder="Descreva sua experiência..." />
          </div>
        </div>

        {/* Categories */}
        <div>
          <Label className="text-xs mb-2 block">Serviços oferecidos</Label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  form.categories.includes(cat.id)
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
            <button
              onClick={() => {
                const hasOther = form.categories.some(c => c.startsWith('outros:'));
                if (hasOther) {
                  setOtherCategory('');
                  setForm(prev => ({ ...prev, categories: prev.categories.filter(c => !c.startsWith('outros:')) }));
                } else {
                  setForm(prev => ({ ...prev, categories: [...prev.categories, 'outros:'] }));
                }
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                form.categories.some(c => c.startsWith('outros:'))
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              Outros
            </button>
          </div>

          {/* Campo "Outros" expandido */}
          {form.categories.some(c => c.startsWith('outros:')) && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Label className="text-xs text-muted-foreground mb-1 block">
                Qual serviço você oferece?
              </Label>
              <Input
                value={otherCategory}
                onChange={e => handleOtherCategory(e.target.value)}
                className="rounded-xl"
                placeholder="Ex: Jardinagem, Pintura Artística, Aula de Música..."
              />
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                💡 Preencha por <strong>categoria</strong> para facilitar a busca dos clientes. Ex: "Jardinagem" ao invés de "Faço jardins".
              </p>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div>
          <Label className="text-xs mb-2 block">Precificação</Label>
          <Select value={form.price_type} onValueChange={v => setForm(p => ({...p, price_type: v}))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Preço Fixo</SelectItem>
              <SelectItem value="budget">Orçamento</SelectItem>
              <SelectItem value="hourly">Por Hora</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 mt-2">
            <Input type="number" placeholder="Mín (R$)" value={form.price_min} onChange={e => setForm(p => ({...p, price_min: e.target.value}))} className="rounded-xl" />
            <Input type="number" placeholder="Máx (R$)" value={form.price_max} onChange={e => setForm(p => ({...p, price_max: e.target.value}))} className="rounded-xl" />
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-2xl p-3">
          <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Sua localização é atualizada <strong>automaticamente</strong> enquanto você estiver online. Não é necessário nenhuma ação.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl font-semibold">
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Perfil'}
        </Button>
      </div>
    </div>
  );
}