import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  ShieldCheck,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  Compass,
} from 'lucide-react';
import {
  locationService,
  MANUAL_LOCATION_PRESETS,
} from '../../services/locationService';

export default function LocationConsentModal({
  isOpen,
  onClose,
  currentLocation,
  initialConsentAccepted = false,
  onConfirmLocation,
}) {
  const [consentChecked, setConsentChecked] = useState(initialConsentAccepted);
  const [activeTab, setActiveTab] = useState('gps'); // 'gps' | 'manual'
  const [loadingGps, setLoadingGps] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Manual search states
  const [manualQuery, setManualQuery] = useState('');
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [apiResults, setApiResults] = useState([]);
  const [customNeighborhood, setCustomNeighborhood] = useState('');
  const [customCity, setCustomCity] = useState('São Paulo - SP');

  useEffect(() => {
    setConsentChecked(initialConsentAccepted);
    setErrorMsg('');
  }, [initialConsentAccepted, isOpen]);

  if (!isOpen) return null;

  const handleUseBrowserGps = async () => {
    setErrorMsg('');
    if (!consentChecked) {
      setErrorMsg(
        'Por favor, marque a caixa aceitando o Termo de Uso de Geolocalização antes de compartilhar seu GPS.'
      );
      return;
    }

    setLoadingGps(true);
    try {
      locationService.saveConsent(true);
      const loc = await locationService.requestBrowserGpsLocation();
      await onConfirmLocation(loc, true);
      onClose();
    } catch (err) {
      setActiveTab('manual');
      setErrorMsg(
        'Não foi possível obter o GPS automático do navegador (permissão negada ou sinal indisponível). Selecione ou digite sua localização manualmente abaixo!'
      );
    } finally {
      setLoadingGps(false);
    }
  };

  const handleSearchManualApi = async (e) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    setSearchingAddress(true);
    setErrorMsg('');
    try {
      const results = await locationService.searchAddressQuery(manualQuery);
      setApiResults(results);
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleSelectManualLocation = async (presetOrResult) => {
    setErrorMsg('');
    if (!consentChecked) {
      setErrorMsg(
        'Aceite o Termo de Uso de Localização acima para aplicar e salvar sua região.'
      );
      return;
    }

    const locationData = {
      mode: 'manual',
      lat: presetOrResult.lat || -23.5955,
      lng: presetOrResult.lng || -46.6865,
      neighborhood: presetOrResult.neighborhood,
      city: presetOrResult.city || 'São Paulo - SP',
      label: presetOrResult.label,
      updatedAt: new Date().toISOString(),
    };

    locationService.saveConsent(true);
    locationService.saveLocation(locationData);
    await onConfirmLocation(locationData, true);
    onClose();
  };

  const handleSaveCustomTypedLocation = async (e) => {
    e.preventDefault();
    if (!customNeighborhood.trim()) return;
    if (!consentChecked) {
      setErrorMsg(
        'Aceite o Termo de Uso de Localização acima antes de salvar seu endereço manual.'
      );
      return;
    }

    const locationData = {
      mode: 'manual',
      lat: -23.5955,
      lng: -46.6865,
      neighborhood: customNeighborhood.trim(),
      city: customCity.trim() || 'São Paulo - SP',
      label: `${customNeighborhood.trim()}, ${customCity.trim() || 'SP'}`,
      updatedAt: new Date().toISOString(),
    };

    locationService.saveConsent(true);
    locationService.saveLocation(locationData);
    await onConfirmLocation(locationData, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-dark-900 border border-white/15 w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
              <Compass className="w-4 h-4" /> API de Geolocalização & Privacidade (LGPD)
            </span>
            <h3 className="font-display font-black text-xl sm:text-2xl text-white mt-0.5">
              Definir Sua Localização de Jogo
            </h3>
            <p className="text-xs text-slate-400">
              Usamos sua localização para calcular a distância exata até as arenas e ordenar partidas próximas a você.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Location Pill */}
        {currentLocation?.label && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                Localização atual ativa:{' '}
                <strong className="text-white">{currentLocation.label}</strong> (
                {currentLocation.mode === 'gps' ? 'Via GPS Automático' : 'Marcada Manualmente'})
              </span>
            </div>
          </div>
        )}

        {/* TERMO DE CONSENTIMENTO DO USUÁRIO (Obrigatório antes de fornecer a localização) */}
        <div className="p-4 rounded-2xl bg-dark-950 border border-neon/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-neon">
            <ShieldCheck className="w-4 h-4" />
            <span>Termo de Consentimento para Uso de Localização (LGPD)</span>
          </div>

          <div className="text-[11px] text-slate-300 leading-relaxed space-y-1.5 max-h-28 overflow-y-auto pr-1 border-b border-white/10 pb-2.5">
            <p>
              <strong>1. Finalidade:</strong> Ao aceitar este termo, você autoriza o <strong>SPORT MAKER</strong> a coletar ou processar sua localização geográfica (via API de GPS do navegador ou endereço marcado manualmente) exclusivamente para calcular a distância em quilômetros até as arenas esportivas, sugerir lobbies de partidas na sua região e conectar atletas próximos.
            </p>
            <p>
              <strong>2. Privacidade & Segurança:</strong> Suas coordenadas exatas nunca são exibidas publicamente para outros usuários (apenas a distância aproximada em km) e não são compartilhadas com terceiros para fins publicitários.
            </p>
            <p>
              <strong>3. Controle Manual e Revogação:</strong> Você pode alterar sua localização manualmente ou revogar este consentimento a qualquer momento neste painel.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => {
                setConsentChecked(e.target.checked);
                if (e.target.checked) setErrorMsg('');
              }}
              className="mt-0.5 w-4 h-4 rounded accent-neon cursor-pointer"
            />
            <span className="text-xs font-bold text-white leading-snug">
              Li e aceito o Termo de Consentimento de Localização e autorizo o cálculo de proximidade das arenas e partidas.
            </span>
          </label>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mode Switcher: GPS Automático vs Marcar Manualmente */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-dark-950 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('gps')}
            className={`py-2.5 px-3 rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'gps'
                ? 'bg-neon text-dark-950 shadow-neon'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Detectar via GPS (API)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2.5 px-3 rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manual'
                ? 'bg-emerald-400 text-dark-950 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Marcar Manualmente</span>
          </button>
        </div>

        {/* TAB 1: GPS Automático */}
        {activeTab === 'gps' ? (
          <div className="p-5 rounded-2xl bg-dark-950/90 border border-white/10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-neon/15 border border-neon/30 text-neon mx-auto flex items-center justify-center">
              <Navigation className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-base text-white">
                Localização em Tempo Real (GPS + OpenStreetMap API)
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                O navegador solicitará sua permissão após o aceite do termo acima e identificará automaticamente seu bairro e distância para cada quadra.
              </p>
            </div>

            <button
              type="button"
              disabled={loadingGps}
              onClick={handleUseBrowserGps}
              className={`w-full py-3.5 px-5 rounded-xl font-display font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                consentChecked
                  ? 'bg-neon hover:bg-neon-400 text-dark-950 shadow-neon'
                  : 'bg-white/10 text-slate-400 cursor-not-allowed'
              }`}
            >
              {consentChecked ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>
                {loadingGps
                  ? 'Consultando Satélite / API de Geolocalização...'
                  : consentChecked
                  ? 'Ativar Minha Localização Exata Agora'
                  : 'Aceite o Termo Acima para Liberar o GPS'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className="text-xs font-bold text-emerald-400 hover:underline"
            >
              Prefere escolher seu bairro ou digitar endereço manualmente? Clique aqui →
            </button>
          </div>
        ) : (
          /* TAB 2: Marcar Manualmente */
          <div className="space-y-5">
            {/* Search via OpenStreetMap API */}
            <form onSubmit={handleSearchManualApi} className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Buscar Rua, CEP, Bairro ou Cidade na API de Mapas:
              </label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-dark-950 border border-white/15 rounded-xl px-3.5 py-2.5 focus-within:border-emerald-400">
                  <Search className="w-4 h-4 text-emerald-400 shrink-0" />
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder="Ex: Av. Paulista, Moema, Barra da Tijuca, 04538-132..."
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchingAddress}
                  className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-dark-950 font-display font-extrabold text-xs shrink-0"
                >
                  {searchingAddress ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </form>

            {/* API Search Results */}
            {apiResults.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Resultados Encontrados na API (Clique para marcar):
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {apiResults.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleSelectManualLocation(res)}
                      className="p-3 rounded-xl bg-dark-950 hover:bg-emerald-400/15 border border-white/10 hover:border-emerald-400/40 text-left flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">{res.label}</p>
                          <span className="text-[10px] text-slate-400">
                            Coordenadas: {res.lat.toFixed(4)}, {res.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">Selecionar</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Neighborhood Presets */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-300">
                Ou Marque Rapidamente uma Região Esportiva:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MANUAL_LOCATION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectManualLocation(preset)}
                    className="p-2.5 rounded-xl bg-dark-950 hover:bg-white/10 border border-white/10 hover:border-neon/40 text-left flex items-center justify-between transition-all"
                  >
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-neon shrink-0" />
                      <span className="truncate">{preset.label}</span>
                    </span>
                    <span className="text-[10px] font-bold text-neon shrink-0 ml-1">
                      Marcar
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Custom Input */}
            <form
              onSubmit={handleSaveCustomTypedLocation}
              className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5"
            >
              <span className="block text-xs font-bold text-white">
                Digitar Outro Bairro / Cidade Manualmente:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customNeighborhood}
                  onChange={(e) => setCustomNeighborhood(e.target.value)}
                  placeholder="Seu Bairro (ex: Santana, Perdizes)"
                  className="bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="Cidade - UF (ex: São Paulo - SP)"
                  className="bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-emerald-400 hover:text-dark-950 text-white text-xs font-extrabold transition-all"
              >
                Confirmar Localização Manual Digitada
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

