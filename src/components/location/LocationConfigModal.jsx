import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Crosshair, X, Check, Info, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// iOS-style Switch — Apple monochrome
function IOSSwitch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative shrink-0 transition-all duration-300"
      style={{
        width: 51,
        height: 31,
        borderRadius: 999,
        background: checked ? '#1C1C1E' : '#E5E5EA',
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        style={{
          width: 27,
          height: 27,
          borderRadius: 999,
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
          position: 'absolute',
          top: 2,
          left: 0,
        }}
      />
    </button>
  );
}

// Geocode address string to lat/lng using Nominatim (OpenStreetMap)
async function geocodeAddress(address) {
  const encoded = encodeURIComponent(address);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'pt-BR' } }
  );
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
}

export default function LocationConfigModal({ professional, open, onClose, onSaved }) {
  const queryClient = useQueryClient();

  const [locationType, setLocationType] = useState('fixed');
  const [fixedAddress, setFixedAddress] = useState('');
  const [gettingGPS, setGettingGPS] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [capturedLat, setCapturedLat] = useState(null);
  const [capturedLng, setCapturedLng] = useState(null);
  const [capturedLabel, setCapturedLabel] = useState(null);
  const [geocodeError, setGeocodeError] = useState(false);

  useEffect(() => {
    if (open && professional) {
      setLocationType(professional.location_type || 'fixed');
      setFixedAddress(professional.fixed_address || '');
      setCapturedLat(null);
      setCapturedLng(null);
      setCapturedLabel(null);
      setGeocodeError(false);
    }
  }, [open, professional]);

  const handleGeocodeAddress = async () => {
    if (!fixedAddress.trim()) return;
    setGeocoding(true);
    setGeocodeError(false);
    setCapturedLat(null);
    setCapturedLng(null);
    setCapturedLabel(null);
    const result = await geocodeAddress(fixedAddress.trim());
    setGeocoding(false);
    if (!result) {
      setGeocodeError(true);
      toast.error('Endereço não encontrado. Tente ser mais específico.');
      return;
    }
    setCapturedLat(result.lat);
    setCapturedLng(result.lng);
    setCapturedLabel(result.display);
    toast.success('Endereço encontrado no mapa!');
  };

  const handleGetCurrentLocation = () => {
    setGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCapturedLat(pos.coords.latitude);
        setCapturedLng(pos.coords.longitude);
        setCapturedLabel('Localização GPS atual');
        setGettingGPS(false);
        toast.success('Localização capturada!');
      },
      () => {
        setGettingGPS(false);
        toast.error('Não foi possível obter o GPS. Verifique as permissões.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSave = async () => {
    if (!professional?.id) return;

    if (locationType === 'fixed' && !capturedLat && !professional.latitude) {
      toast.error('Confirme o endereço no mapa antes de salvar.');
      return;
    }

    setSaving(true);

    const updates = {
      location_type: locationType === 'current' ? 'fixed' : locationType,
      is_available: locationType !== 'offline',
    };

    if (locationType === 'fixed') {
      updates.fixed_address = fixedAddress || null;
      if (capturedLat) {
        updates.latitude = capturedLat;
        updates.longitude = capturedLng;
      }
    } else if (locationType === 'current') {
      updates.fixed_address = null;
      if (capturedLat) {
        updates.latitude = capturedLat;
        updates.longitude = capturedLng;
      }
    } else if (locationType === 'realtime') {
      updates.fixed_address = null;
      if (capturedLat) {
        updates.latitude = capturedLat;
        updates.longitude = capturedLng;
      }
    } else if (locationType === 'offline') {
      updates.is_available = false;
    }

    await base44.entities.Professional.update(professional.id, updates);
    queryClient.invalidateQueries({ queryKey: ['professionals'] });
    queryClient.invalidateQueries({ queryKey: ['my-pro'] });
    queryClient.invalidateQueries({ queryKey: ['my-pro-dashboard'] });

    setSaving(false);
    toast.success('Configuração salva com sucesso.');
    if (onSaved) onSaved(updates);
    onClose();
  };

  const options = [
    {
      id: 'fixed',
      icon: MapPin,
      label: 'Localização Fixa',
      description: 'Digite um endereço e apareça sempre nesse ponto do mapa.',
    },
    {
      id: 'realtime',
      icon: Navigation,
      label: 'Localização em Tempo Real',
      description: 'Sua posição é atualizada conforme você se movimenta.',
    },
    {
      id: 'current',
      icon: Crosshair,
      label: 'Fixar Posição Atual',
      description: 'Captura onde você está agora e mantém fixo no mapa.',
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 380 }}
            className="w-full max-w-lg bg-white flex flex-col overflow-hidden"
            style={{ borderRadius: '28px 28px 0 0', maxHeight: '92vh' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            <div className="px-5 pt-3 pb-4 flex items-start justify-between border-b border-slate-100">
              <div className="flex-1">
                <h2 className="text-[19px] font-bold text-slate-900 tracking-tight">Localização no Mapa</h2>
                <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                  Como você quer aparecer para os clientes.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 ml-3 shrink-0 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-4 space-y-2.5">
              {options.map((opt) => {
                const Icon = opt.icon;
                const isActive = locationType === opt.id;
                return (
                  <div
                    key={opt.id}
                    className="overflow-hidden rounded-[20px] transition-all duration-200"
                    style={{
                      border: isActive ? '1.5px solid #1C1C1E' : '1.5px solid #E5E5EA',
                      background: isActive ? '#F7F7F7' : '#FAFAFA',
                    }}
                  >
                    <button
                      className="w-full flex items-center gap-3.5 px-4 py-3.5"
                      onClick={() => {
                        setLocationType(opt.id);
                        setCapturedLat(null);
                        setCapturedLng(null);
                        setCapturedLabel(null);
                        setGeocodeError(false);
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: isActive ? '#1C1C1E' : '#EBEBEB' }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: isActive ? '#FFFFFF' : '#8E8E93' }}
                          strokeWidth={2}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-[15px] font-semibold text-slate-900 leading-snug">{opt.label}</p>
                        <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{opt.description}</p>
                      </div>
                      <IOSSwitch checked={isActive} onChange={() => setLocationType(opt.id)} />
                    </button>

                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 space-y-2.5 border-t border-slate-100">
                            {opt.id === 'fixed' && (
                              <>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Endereço</p>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Ex: Rua das Flores, 123 — São Paulo"
                                    value={fixedAddress}
                                    onChange={e => { setFixedAddress(e.target.value); setGeocodeError(false); setCapturedLat(null); setCapturedLng(null); setCapturedLabel(null); }}
                                    onKeyDown={e => e.key === 'Enter' && handleGeocodeAddress()}
                                    className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-400 transition"
                                    style={{ fontFamily: 'inherit' }}
                                  />
                                  <button
                                    onClick={handleGeocodeAddress}
                                    disabled={geocoding || !fixedAddress.trim()}
                                    className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-[13px] font-semibold shrink-0 disabled:opacity-40 transition active:scale-[0.97]"
                                  >
                                    {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                                  </button>
                                </div>
                                {geocodeError && (
                                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
                                    <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                                    <p className="text-[12px] text-slate-600">Endereço não encontrado. Seja mais específico (inclua cidade/estado).</p>
                                  </div>
                                )}
                                {capturedLat && !geocodeError && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-2 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl"
                                  >
                                    <Check className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                                    <p className="text-[12px] text-slate-700 font-medium leading-relaxed">{capturedLabel}</p>
                                  </motion.div>
                                )}
                              </>
                            )}

                            {opt.id === 'realtime' && (
                              <>
                                <div className="flex items-start gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
                                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                  <p className="text-[12px] text-slate-500 leading-relaxed">
                                    Sua posição será atualizada automaticamente enquanto o app estiver aberto.
                                  </p>
                                </div>
                                <button
                                  onClick={handleGetCurrentLocation}
                                  disabled={gettingGPS}
                                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 text-white text-[13px] font-semibold transition active:scale-[0.98] disabled:opacity-50"
                                >
                                  {gettingGPS ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                                  {gettingGPS ? 'Obtendo GPS...' : 'Ativar localização em tempo real'}
                                </button>
                                {capturedLat && (
                                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl">
                                    <Check className="w-4 h-4 text-slate-700 shrink-0" />
                                    <p className="text-[12px] text-slate-700 font-medium">GPS ativo — posição será atualizada automaticamente.</p>
                                  </div>
                                )}
                              </>
                            )}

                            {opt.id === 'current' && (
                              <>
                                <button
                                  onClick={handleGetCurrentLocation}
                                  disabled={gettingGPS}
                                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 text-white text-[13px] font-semibold transition active:scale-[0.98] disabled:opacity-50"
                                >
                                  {gettingGPS ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                                  {gettingGPS ? 'Capturando GPS...' : 'Capturar minha localização agora'}
                                </button>
                                {capturedLat && (
                                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl">
                                    <Check className="w-4 h-4 text-slate-700 shrink-0" />
                                    <p className="text-[12px] text-slate-700 font-medium">Localização capturada — será salva como ponto fixo.</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              <div
                className="overflow-hidden rounded-[20px] transition-all duration-200"
                style={{
                  border: locationType === 'offline' ? '1.5px solid #1C1C1E' : '1.5px solid #E5E5EA',
                  background: locationType === 'offline' ? '#F7F7F7' : '#FAFAFA',
                }}
              >
                <button
                  className="w-full flex items-center gap-3.5 px-4 py-3.5"
                  onClick={() => setLocationType('offline')}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: locationType === 'offline' ? '#1C1C1E' : '#EBEBEB' }}
                  >
                    <X className="w-5 h-5" style={{ color: locationType === 'offline' ? '#FFFFFF' : '#8E8E93' }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[15px] font-semibold text-slate-900 leading-snug">Ficar Offline</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">Não aparecer no mapa para clientes.</p>
                  </div>
                  <IOSSwitch checked={locationType === 'offline'} onChange={() => setLocationType('offline')} />
                </button>
              </div>

              <div className="flex items-start gap-2.5 px-3 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Sua localização é usada apenas para exibição no mapa. Nenhum dado é compartilhado com terceiros.
                </p>
              </div>
            </div>

            <div className="px-4 pb-8 pt-3 space-y-2 border-t border-slate-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 h-[52px] rounded-[16px] text-white text-[15px] font-bold transition active:scale-[0.98] disabled:opacity-60"
                style={{ background: '#1C1C1E', letterSpacing: '-0.02em' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Salvando...' : 'Salvar Configuração'}
              </button>
              <button
                onClick={onClose}
                className="w-full h-11 rounded-[14px] text-[14px] text-slate-400 font-medium hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}