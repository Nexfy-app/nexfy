import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Crosshair, X, Check, Battery, Info, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// iOS-style Switch
function IOSSwitch({ checked, onChange, color = '#30D158' }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative shrink-0 transition-all duration-300"
      style={{
        width: 51,
        height: 31,
        borderRadius: 999,
        background: checked ? color : '#E5E5EA',
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
          boxShadow: '0 2px 8px rgba(0,0,0,0.20)',
          position: 'absolute',
          top: 2,
          left: 0,
        }}
      />
    </button>
  );
}

const LOCATION_TYPES = {
  fixed: 'fixa',
  realtime: 'tempo_real',
  offline: 'offline',
};

export default function LocationConfigModal({ professional, open, onClose, onSaved }) {
  const queryClient = useQueryClient();

  const [locationType, setLocationType] = useState('fixed');
  const [fixedAddress, setFixedAddress] = useState('');
  const [gettingGPS, setGettingGPS] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentLat, setCurrentLat] = useState(null);
  const [currentLng, setCurrentLng] = useState(null);
  const [capturedLocation, setCapturedLocation] = useState(false);

  useEffect(() => {
    if (open && professional) {
      const tipo = professional.location_type || 'fixed';
      setLocationType(tipo);
      setFixedAddress(professional.fixed_address || '');
      setCurrentLat(professional.latitude || null);
      setCurrentLng(professional.longitude || null);
      setCapturedLocation(false);
    }
  }, [open, professional]);

  const handleGetCurrentLocation = () => {
    setGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLat(pos.coords.latitude);
        setCurrentLng(pos.coords.longitude);
        setCapturedLocation(true);
        setGettingGPS(false);
        toast.success('Localização capturada!');
      },
      () => {
        setGettingGPS(false);
        toast.error('Não foi possível obter a localização. Verifique as permissões.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSave = async () => {
    if (!professional?.id) return;
    setSaving(true);

    const updates = {
      location_type: locationType,
      fixed_address: fixedAddress || null,
      is_available: locationType !== 'offline',
    };

    if (locationType === 'fixed' && currentLat) {
      updates.latitude = currentLat;
      updates.longitude = currentLng;
    } else if (locationType === 'realtime') {
      if (currentLat) {
        updates.latitude = currentLat;
        updates.longitude = currentLng;
      }
    } else if (locationType === 'current') {
      updates.location_type = 'fixed';
      if (currentLat) {
        updates.latitude = currentLat;
        updates.longitude = currentLng;
      }
    } else if (locationType === 'offline') {
      updates.is_available = false;
    }

    await base44.entities.Professional.update(professional.id, updates);
    queryClient.invalidateQueries({ queryKey: ['professionals'] });
    queryClient.invalidateQueries({ queryKey: ['my-pro'] });
    queryClient.invalidateQueries({ queryKey: ['my-pro-dashboard'] });

    setSaving(false);
    toast.success('Configuração atualizada com sucesso.');
    if (onSaved) onSaved(updates);
    onClose();
  };

  const options = [
    {
      id: 'fixed',
      icon: MapPin,
      iconColor: '#007AFF',
      label: 'Localização Fixa',
      description: 'Defina um endereço fixo para que clientes encontrem você sempre no mesmo local.',
    },
    {
      id: 'realtime',
      icon: Navigation,
      iconColor: '#30D158',
      label: 'Localização em Tempo Real',
      description: 'Mostra sua localização em tempo real conforme você se movimenta.',
    },
    {
      id: 'current',
      icon: Crosshair,
      iconColor: '#FF9F0A',
      label: 'Fixar Localização Atual',
      description: 'Usa sua localização do momento e mantém ela fixa no mapa.',
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
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
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
            {/* Pull indicator */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="px-5 pt-3 pb-4 flex items-start justify-between border-b border-slate-100">
              <div className="flex-1">
                <h2 className="text-[19px] font-bold text-slate-900 tracking-tight">Configuração de Localização</h2>
                <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                  Escolha como sua localização será exibida para clientes no mapa.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 ml-3 shrink-0 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Options */}
            <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3">

              {options.map((opt) => {
                const Icon = opt.icon;
                const isActive = locationType === opt.id;
                return (
                  <motion.div
                    key={opt.id}
                    animate={{ scale: isActive ? 1 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="overflow-hidden"
                    style={{
                      borderRadius: 20,
                      border: isActive ? `2px solid ${opt.iconColor}20` : '2px solid transparent',
                      background: isActive ? `${opt.iconColor}06` : '#F9F9FB',
                      transition: 'background 0.22s, border 0.22s',
                    }}
                  >
                    {/* Option header */}
                    <button
                      className="w-full flex items-center gap-3.5 p-4"
                      onClick={() => setLocationType(opt.id)}
                    >
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: `${opt.iconColor}18` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: opt.iconColor }} strokeWidth={2} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-[15px] font-semibold text-slate-900 leading-snug">{opt.label}</p>
                        <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{opt.description}</p>
                      </div>
                      <IOSSwitch
                        checked={isActive}
                        onChange={() => setLocationType(opt.id)}
                        color={opt.iconColor}
                      />
                    </button>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">

                            {/* Fixed address */}
                            {opt.id === 'fixed' && (
                              <>
                                <div>
                                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Endereço fixo</p>
                                  <input
                                    type="text"
                                    placeholder="Ex: Rua das Flores, 123 — São Paulo"
                                    value={fixedAddress}
                                    onChange={e => setFixedAddress(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 transition"
                                    style={{ fontFamily: 'inherit' }}
                                  />
                                </div>
                                <button
                                  onClick={handleGetCurrentLocation}
                                  disabled={gettingGPS}
                                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 text-[13px] font-semibold transition active:scale-[0.98] disabled:opacity-60"
                                >
                                  {gettingGPS
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Crosshair className="w-4 h-4" />
                                  }
                                  {gettingGPS ? 'Obtendo localização...' : 'Usar minha localização atual'}
                                </button>
                                {capturedLocation && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-2xl"
                                  >
                                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                                    <p className="text-[12px] text-green-700 font-medium">Localização GPS capturada e pronta para salvar.</p>
                                  </motion.div>
                                )}
                              </>
                            )}

                            {/* Real-time */}
                            {opt.id === 'realtime' && (
                              <>
                                <div className="flex items-start gap-2.5 px-3 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
                                  <Battery className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                  <p className="text-[12px] text-amber-700 leading-relaxed">
                                    <strong>Atenção:</strong> A localização em tempo real pode consumir mais bateria do dispositivo.
                                  </p>
                                </div>
                                <button
                                  onClick={handleGetCurrentLocation}
                                  disabled={gettingGPS}
                                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-50 border border-green-100 text-green-600 text-[13px] font-semibold transition active:scale-[0.98] disabled:opacity-60"
                                >
                                  {gettingGPS
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Navigation className="w-4 h-4" />
                                  }
                                  {gettingGPS ? 'Obtendo GPS...' : 'Permitir localização em tempo real'}
                                </button>
                                {capturedLocation && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-2xl"
                                  >
                                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                                    <p className="text-[12px] text-green-700 font-medium">GPS ativo. Sua posição será atualizada automaticamente.</p>
                                  </motion.div>
                                )}
                              </>
                            )}

                            {/* Capture current */}
                            {opt.id === 'current' && (
                              <>
                                <button
                                  onClick={handleGetCurrentLocation}
                                  disabled={gettingGPS}
                                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-orange-50 border border-orange-100 text-orange-600 text-[13px] font-semibold transition active:scale-[0.98] disabled:opacity-60"
                                >
                                  {gettingGPS
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Crosshair className="w-4 h-4" />
                                  }
                                  {gettingGPS ? 'Capturando GPS...' : 'Capturar minha localização agora'}
                                </button>
                                {capturedLocation && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-2xl"
                                  >
                                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                                    <p className="text-[12px] text-green-700 font-medium">Localização atual capturada e será salva como fixa.</p>
                                  </motion.div>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Privacy note */}
              <div className="flex items-start gap-2.5 px-3 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Sua localização é utilizada <strong>apenas</strong> para exibição no mapa do aplicativo. Nenhum dado é compartilhado com terceiros.
                </p>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-4 pb-8 pt-3 space-y-2 border-t border-slate-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 h-[52px] rounded-[16px] text-white text-[15px] font-bold transition active:scale-[0.98] disabled:opacity-60"
                style={{ background: 'hsl(224 32% 8%)', letterSpacing: '-0.02em' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Salvando...' : 'Salvar Configuração'}
              </button>
              <button
                onClick={onClose}
                className="w-full h-11 rounded-[14px] text-[14px] text-slate-400 font-medium hover:bg-slate-50 transition"
              >
                Configurar Depois
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}