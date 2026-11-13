import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Plus,
  Save,
  CheckCircle2,
  MapPin,
  Clock,
  Layers,
  UtensilsCrossed,
  ShoppingBag,
  Trash2,
  Upload,
  Sparkles,
  Navigation,
  Search,
  ExternalLink,
} from 'lucide-react';
import { locationService } from '../../services/locationService';

export default function OwnerArenasConfigTab({
  arenas = [],
  onSaveArena,
  onCreateArena,
}) {
  const [selectedArenaId, setSelectedArenaId] = useState(arenas[0]?._id || '');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState('');
  const fileInputRef = useRef(null);

  const currentArena =
    arenas.find((a) => String(a._id) === String(selectedArenaId)) || arenas[0];

  // Form states
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [sport, setSport] = useState('society');
  const [sportLabel, setSportLabel] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: -23.5955, lng: -46.6865 });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoResults, setGeoResults] = useState([]);
  const [geoStatusMsg, setGeoStatusMsg] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerHour, setPricePerHour] = useState(200);
  const [pricePerPlayer, setPricePerPlayer] = useState(20);
  const [image, setImage] = useState('');
  const [amenitiesText, setAmenitiesText] = useState('');
  const [courts, setCourts] = useState([]);
  const [onSiteServices, setOnSiteServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [slots, setSlots] = useState([]);

  // New Court Mini Form
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtSport, setNewCourtSport] = useState('Futebol Society (7x7)');
  const [newCourtSurface, setNewCourtSurface] = useState('Grama Sintética 60mm FIFA Pro');
  const [newCourtCovered, setNewCourtCovered] = useState(true);
  const [newCourtPrice, setNewCourtPrice] = useState(220);

  // New Service Mini Form
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceBadge, setNewServiceBadge] = useState('Restaurante & Bebidas');

  // New Product Mini Form
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(35);
  const [newProdTag, setNewProdTag] = useState('Bebidas / Bar');

  // New Slot Input
  const [newSlotTime, setNewSlotTime] = useState('17:00');

  useEffect(() => {
    if (isCreatingNew) {
      setName('');
      setCnpj('');
      setSport('society');
      setSportLabel('Futebol Society • Grama Sintética FIFA');
      setNeighborhood('São Paulo, SP');
      setAddress('');
      setCoordinates({ lat: -23.5955, lng: -46.6865 });
      setGeoResults([]);
      setGeoStatusMsg('');
      setOpeningHours('Seg a Dom • 07:00 às 00:00');
      setDescription(
        'Complexo esportivo com quadras iluminadas, vestiários modernos e serviço completo de bar e restaurante pós-jogo.'
      );
      setPricePerHour(200);
      setPricePerPlayer(20);
      setImage(
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80'
      );
      setAmenitiesText(
        'Estacionamento, Churrasqueira Gourmet, Bar & Restaurante, Vestiário VIP, Wi-Fi 6'
      );
      setCourts([
        {
          id: `c_${Date.now()}`,
          name: 'Quadra 1 • Principal',
          sport: 'Futebol Society (7x7)',
          surface: 'Grama Sintética 60mm FIFA Pro',
          covered: true,
          pricePerHour: 200,
        },
      ]);
      setOnSiteServices([
        {
          title: 'Restaurante & Sports Bar no Local',
          description: 'Venda de bebidas geladas, chopp, espetinhos e hambúrgueres artesanais.',
          badge: 'Gastronomia & Bebidas',
        },
      ]);
      setProducts([
        { id: 'p1', name: 'Kit Churrasco Pós-Jogo (Carvão + Gelo)', price: 65, tag: '3º Tempo' },
        { id: 'p2', name: 'Locação Bola Oficial Penalty S11', price: 15, tag: 'Equipamento' },
      ]);
      setSlots([
        { time: '18:00', status: 'available', highlight: '', discount: '' },
        { time: '19:00', status: 'available', highlight: 'Horário Nobre', discount: '' },
        { time: '20:00', status: 'available', highlight: '', discount: '' },
        { time: '21:00', status: 'available', highlight: '', discount: '' },
        { time: '22:00', status: 'available', highlight: '', discount: '-15%' },
      ]);
      return;
    }

    if (currentArena) {
      setName(currentArena.name || '');
      setCnpj(currentArena.cnpj || '');
      setSport(currentArena.sport || 'society');
      setSportLabel(currentArena.sportLabel || '');
      setNeighborhood(currentArena.neighborhood || '');
      setAddress(currentArena.address || '');
      setCoordinates(
        currentArena.coordinates?.lat && currentArena.coordinates?.lng
          ? currentArena.coordinates
          : { lat: -23.5955, lng: -46.6865 }
      );
      setGeoResults([]);
      setGeoStatusMsg('');
      setOpeningHours(currentArena.openingHours || '');
      setDescription(currentArena.description || '');
      setPricePerHour(currentArena.pricePerHour || 200);
      setPricePerPlayer(currentArena.pricePerPlayer || 20);
      setImage(currentArena.image || '');
      setAmenitiesText((currentArena.amenities || []).join(', '));
      setCourts(currentArena.courts || []);
      setOnSiteServices(currentArena.onSiteServices || []);
      setProducts(currentArena.products || []);
      setSlots(currentArena.slots || []);
    }
  }, [currentArena, isCreatingNew]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCourt = () => {
    if (!newCourtName.trim()) return;
    setCourts((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}`,
        name: newCourtName.trim(),
        sport: newCourtSport,
        surface: newCourtSurface,
        covered: newCourtCovered,
        pricePerHour: Number(newCourtPrice) || 180,
      },
    ]);
    setNewCourtName('');
  };

  const handleRemoveCourt = (id) => {
    setCourts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddService = () => {
    if (!newServiceTitle.trim()) return;
    setOnSiteServices((prev) => [
      ...prev,
      {
        title: newServiceTitle.trim(),
        description: newServiceDesc.trim() || 'Disponível no complexo para todos os atletas.',
        badge: newServiceBadge,
      },
    ]);
    setNewServiceTitle('');
    setNewServiceDesc('');
  };

  const handleRemoveService = (idx) => {
    setOnSiteServices((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddProduct = () => {
    if (!newProdName.trim()) return;
    setProducts((prev) => [
      ...prev,
      {
        id: `p_${Date.now()}`,
        name: newProdName.trim(),
        price: Number(newProdPrice) || 0,
        tag: newProdTag,
      },
    ]);
    setNewProdName('');
  };

  const handleRemoveProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddSlot = () => {
    if (!newSlotTime.trim()) return;
    if (slots.some((s) => s.time === newSlotTime.trim())) return;
    setSlots((prev) => [
      ...prev,
      { time: newSlotTime.trim(), status: 'available', highlight: '', discount: '' },
    ]);
  };

  const handleRemoveSlot = (time) => {
    setSlots((prev) => prev.filter((s) => s.time !== time));
  };

  const handleGeocodeArenaAddress = async () => {
    const query = address.trim() || neighborhood.trim();
    if (!query) return;
    setGeoLoading(true);
    setGeoStatusMsg('');
    try {
      const results = await locationService.searchAddressQuery(query);
      setGeoResults(results);
      if (results.length > 0) {
        const first = results[0];
        setCoordinates({ lat: first.lat, lng: first.lng });
        if (first.neighborhood && first.city) {
          setNeighborhood(`${first.neighborhood}, ${first.city}`);
        }
        setGeoStatusMsg('Coordenadas sincronizadas com a API de Localização!');
      } else {
        setGeoStatusMsg('Nenhum resultado exato encontrado. Tente incluir cidade ou CEP.');
      }
    } finally {
      setGeoLoading(false);
    }
  };

  const handleUseOwnerGps = async () => {
    setGeoLoading(true);
    setGeoStatusMsg('');
    try {
      const loc = await locationService.requestBrowserGpsLocation();
      setCoordinates({ lat: loc.lat, lng: loc.lng });
      if (loc.label) setNeighborhood(loc.label);
      setGeoStatusMsg('Localização GPS capturada e sincronizada com o Google Maps!');
    } catch {
      setGeoStatusMsg('Não foi possível obter o GPS do navegador. Use a busca de endereço.');
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setSavedFeedback('');

    const payload = {
      name: name.trim(),
      cnpj: cnpj.trim(),
      sport,
      sportLabel: sportLabel.trim(),
      neighborhood: neighborhood.trim(),
      address: address.trim(),
      coordinates: {
        lat: Number(coordinates.lat) || -23.5955,
        lng: Number(coordinates.lng) || -46.6865,
      },
      openingHours: openingHours.trim(),
      description: description.trim(),
      pricePerHour: Number(pricePerHour) || 200,
      pricePerPlayer: Number(pricePerPlayer) || 20,
      image,
      gallery: [image],
      amenities: amenitiesText
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      courts,
      onSiteServices,
      products,
      slots,
    };

    try {
      if (isCreatingNew) {
        const created = await onCreateArena(payload);
        setIsCreatingNew(false);
        if (created?._id) setSelectedArenaId(created._id);
        setSavedFeedback('Nova arena cadastrada e publicada no MongoDB com sucesso!');
      } else if (currentArena?._id) {
        await onSaveArena(currentArena._id, payload);
        setSavedFeedback('Alterações da arena salvas no MongoDB Atlas!');
      }
      setTimeout(() => setSavedFeedback(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Selector */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> Configurador Completo do Espaço
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Configurar & Adicionar Detalhes das Arenas
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Personalize localização, fotos, quadras (sintética, areia, coberta), venda de bebidas/restaurante, produtos extras e grade de horários no banco de dados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isCreatingNew && arenas.length > 0 && (
            <select
              value={currentArena?._id || ''}
              onChange={(e) => {
                setIsCreatingNew(false);
                setSelectedArenaId(e.target.value);
              }}
              className="bg-dark-900 border border-white/15 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-emerald-400"
            >
              {arenas.map((a) => (
                <option key={a._id} value={a._id} className="bg-dark-900">
                  Editar: {a.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setIsCreatingNew((prev) => !prev)}
            className={`px-4 py-2.5 rounded-xl font-display font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              isCreatingNew
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-emerald-400 hover:bg-emerald-300 text-dark-950 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            {isCreatingNew ? 'Voltar para Arena Existente' : 'Cadastrar Nova Arena'}
          </button>
        </div>
      </div>

      {savedFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{savedFeedback}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Dados Principais, Foto e Localização */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                1. Identidade & Localização
              </span>
              <h3 className="font-display font-extrabold text-xl text-white">
                Informações Gerais da Arena
              </h3>
            </div>
            {isCreatingNew && (
              <span className="px-3 py-1 rounded-full bg-neon/20 text-neon text-xs font-black">
                Criando Nova Unidade
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Photo Preview & Upload */}
            <div className="lg:col-span-4 space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Foto de Capa da Arena
              </label>
              <div className="h-48 rounded-2xl overflow-hidden border border-white/15 relative bg-dark-950">
                {image && (
                  <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-neon" />
                  Enviar Foto do Computador/Celular
                </button>
              </div>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Ou cole a URL da imagem..."
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-neon"
              />
            </div>

            {/* Text Inputs */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome Oficial da Arena
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Arena Prime Sports & Lounge"
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  CNPJ da Arena
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Esporte Principal (Filtro)
                </label>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="society" className="bg-dark-900">Futebol Society</option>
                  <option value="beachtennis" className="bg-dark-900">Beach Tennis</option>
                  <option value="padel" className="bg-dark-900">Padel & Tênis</option>
                  <option value="futevolei" className="bg-dark-900">Futevôlei & Vôlei</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Selo / Subtítulo de Destaque
                </label>
                <input
                  type="text"
                  value={sportLabel}
                  onChange={(e) => setSportLabel(e.target.value)}
                  placeholder="Ex: Futebol Society • Grama FIFA Pro"
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Bairro & Cidade
                </label>
                <div className="flex items-center gap-2 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5">
                  <MapPin className="w-4 h-4 text-neon shrink-0" />
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Vila Olímpia, SP"
                    className="w-full bg-transparent text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Horário de Funcionamento
                </label>
                <div className="flex items-center gap-2 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <input
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    placeholder="Seg a Dom • 07:00 às 00:00"
                    className="w-full bg-transparent text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Endereço Completo (Rua, Número, CEP)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Dr. Cardoso de Melo, 1450 - Vila Olímpia, São Paulo - SP"
                    className="flex-1 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    disabled={geoLoading}
                    onClick={handleGeocodeArenaAddress}
                    className="px-4 py-2.5 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {geoLoading ? 'Buscando...' : 'Sincronizar Endereço'}
                  </button>
                  <button
                    type="button"
                    disabled={geoLoading}
                    onClick={handleUseOwnerGps}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Usar GPS Atual
                  </button>
                </div>

                {geoStatusMsg && (
                  <p className="text-[11px] font-semibold text-emerald-400 mt-1.5">
                    {geoStatusMsg}
                  </p>
                )}

                {geoResults.length > 1 && (
                  <div className="mt-2 space-y-1">
                    {geoResults.slice(0, 3).map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => {
                          setCoordinates({ lat: res.lat, lng: res.lng });
                          setNeighborhood(`${res.neighborhood}, ${res.city}`);
                          setGeoResults([]);
                          setGeoStatusMsg(`Local selecionado: ${res.label}`);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl bg-dark-950 hover:bg-emerald-400/10 border border-white/10 text-xs text-slate-200 flex items-center justify-between"
                      >
                        <span>{res.label}</span>
                        <span className="text-emerald-400 font-bold">Usar este ponto</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Google Maps Embed & Coordinates */}
                <div className="mt-3 p-3.5 rounded-2xl bg-dark-950 border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      Mapa da Arena (Google Maps) • Lat {Number(coordinates.lat).toFixed(4)}, Lng{' '}
                      {Number(coordinates.lng).toFixed(4)}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-neon hover:underline flex items-center gap-1"
                    >
                      Abrir no Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="w-full h-44 rounded-xl overflow-hidden border border-white/10">
                    <iframe
                      title="Google Maps Arena"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=15&output=embed`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Valor Hora Base da Arena (R$)
                </label>
                <input
                  type="number"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Valor Estimado por Atleta (R$)
                </label>
                <input
                  type="number"
                  value={pricePerPlayer}
                  onChange={(e) => setPricePerPlayer(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Descrição Completa do Espaço
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Comodidades (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={amenitiesText}
                  onChange={(e) => setAmenitiesText(e.target.value)}
                  placeholder="Estacionamento, Churrasqueira, Bar & Restaurante, Vestiário VIP, Wi-Fi"
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Quadras, Esportes e Tipos de Piso (Sintética, Areia, etc.) */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> 2. Quadras, Esportes e Piso (Areia, Sintética, Piso Rápido)
            </span>
            <h3 className="font-display font-extrabold text-xl text-white">
              Gerenciar Quadras da Arena ({courts.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courts.map((court) => (
              <div
                key={court.id}
                className="p-4 rounded-2xl bg-dark-950 border border-white/10 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-400/15 text-emerald-300">
                      {court.covered ? 'Quadra Coberta' : 'Ao Ar Livre'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCourt(court.id)}
                      className="text-slate-500 hover:text-red-400"
                      title="Remover quadra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-display font-bold text-base text-white">{court.name}</h4>
                  <p className="text-xs text-neon font-semibold">{court.sport}</p>
                  <p className="text-xs text-slate-400">Piso: {court.surface}</p>
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Valor/hora:</span>
                  <strong className="text-white">R$ {court.pricePerHour},00</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Court Box */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Nome da Quadra
              </label>
              <input
                type="text"
                value={newCourtName}
                onChange={(e) => setNewCourtName(e.target.value)}
                placeholder="Ex: Quadra 4 • Areia Pro"
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Esporte
              </label>
              <input
                type="text"
                value={newCourtSport}
                onChange={(e) => setNewCourtSport(e.target.value)}
                placeholder="Beach Tennis / Society"
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Tipo de Piso
              </label>
              <select
                value={newCourtSurface}
                onChange={(e) => setNewCourtSurface(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Grama Sintética 60mm FIFA Pro" className="bg-dark-900">
                  Grama Sintética 60mm FIFA Pro
                </option>
                <option value="Areia Branca Quartzo Fina" className="bg-dark-900">
                  Areia Branca Quartzo Fina
                </option>
                <option value="Grama Sintética Azul Padel" className="bg-dark-900">
                  Grama Sintética Azul Padel
                </option>
                <option value="Piso Rápido Hard Court" className="bg-dark-900">
                  Piso Rápido Hard Court
                </option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Preço/h (R$) & Cobertura
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={newCourtPrice}
                  onChange={(e) => setNewCourtPrice(e.target.value)}
                  className="w-20 bg-dark-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => setNewCourtCovered((p) => !p)}
                  className={`px-2.5 py-2 rounded-xl text-[10px] font-bold border ${
                    newCourtCovered
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-dark-950 border-white/10 text-slate-400'
                  }`}
                >
                  {newCourtCovered ? 'Coberta' : 'Aberta'}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddCourt}
              className="py-2.5 px-4 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Adicionar Quadra
            </button>
          </div>
        </div>

        {/* SECTION 3: Serviços no Local (Bar, Restaurante, Venda de Bebidas) & Produtos Extras */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* On-Site Services */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4" /> 3. Serviços no Local (Restaurante, Bebidas, Churrasco)
              </span>
              <h3 className="font-display font-extrabold text-lg text-white">
                Estrutura & Gastronomia
              </h3>
            </div>

            <div className="space-y-2.5">
              {onSiteServices.map((srv, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-dark-950 border border-white/10 flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neon/15 text-neon">
                      {srv.badge}
                    </span>
                    <p className="text-xs font-bold text-white mt-1">{srv.title}</p>
                    <p className="text-[11px] text-slate-400">{srv.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(idx)}
                    className="text-slate-500 hover:text-red-400 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newServiceTitle}
                  onChange={(e) => setNewServiceTitle(e.target.value)}
                  placeholder="Ex: Bar & Venda de Bebidas Geladas"
                  className="bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={newServiceBadge}
                  onChange={(e) => setNewServiceBadge(e.target.value)}
                  placeholder="Categoria (Ex: Bar & Restaurante)"
                  className="bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <input
                type="text"
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
                placeholder="Descrição: Chopp, isotônicos, espetinhos, hambúrgueres..."
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddService}
                className="w-full py-2 rounded-xl bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Serviço do Local
              </button>
            </div>
          </div>

          {/* Products Upsell (Checkout) + Slots */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" /> 4. Produtos Adicionais no Agendamento
              </span>
              <h3 className="font-display font-extrabold text-lg text-white">
                Itens de Upsell (Bola, Churrasco, Bebidas)
              </h3>
            </div>

            <div className="space-y-2">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-2xl bg-dark-950 border border-white/10 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{prod.name}</p>
                    <span className="text-[10px] text-slate-400">{prod.tag}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-neon">
                      {prod.price === 0 ? 'Grátis' : `+ R$ ${prod.price},00`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(prod.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                placeholder="Nome do Produto/Kit"
                className="sm:col-span-2 bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
              <input
                type="number"
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(e.target.value)}
                placeholder="Preço R$"
                className="bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddProduct}
                className="sm:col-span-3 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Produto Extra
              </button>
            </div>

            {/* Grade de Horários Configurável */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <label className="block text-xs font-bold text-slate-300">
                Horários Cadastrados na Arena:
              </label>
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <span
                    key={slot.time}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-950 border border-white/15 text-xs font-bold text-white"
                  >
                    {slot.time}
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(slot.time)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newSlotTime}
                  onChange={(e) => setNewSlotTime(e.target.value)}
                  placeholder="Ex: 23:00"
                  className="w-28 bg-dark-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddSlot}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-neon"
                >
                  + Incluir Horário
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Footer */}
        <div className="sticky bottom-4 z-30 p-4 rounded-2xl bg-dark-900/95 backdrop-blur-xl border border-emerald-400/40 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Todas as alterações ficam salvas no cluster <strong>MongoDB Atlas</strong> e atualizam imediatamente a página pública da arena.
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-7 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-dark-950 font-display font-black text-sm shadow-[0_0_25px_rgba(52,211,153,0.4)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving
              ? 'Salvando no MongoDB...'
              : isCreatingNew
              ? 'Publicar Nova Arena no Banco'
              : 'Salvar Configurações da Arena'}
          </button>
        </div>
      </form>
    </div>
  );
}

