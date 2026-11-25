import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Star,
  ShieldCheck,
  Clock,
  UtensilsCrossed,
  ShoppingBag,
  Calendar,
  Layers,
  CheckCircle2,
  Sparkles,
  Navigation,
  ExternalLink,
  Globe,
  Users,
  Lock,
} from 'lucide-react';
import { ARENAS_DATA } from '../data/mockData';
import { ownerService } from '../services/ownerService';

function getTodayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTomorrowIsoDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatIsoDateLabel(isoDate) {
  if (!isoDate) return getTodayIsoDate();
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dateObj = new Date(y, m - 1, d);
  const todayIso = getTodayIsoDate();
  const tomorrowIso = getTomorrowIsoDate();
  const brDate = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

  if (isoDate === todayIso) return `Hoje (${brDate})`;
  if (isoDate === tomorrowIso) return `Amanhã (${brDate})`;
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${brDate}`;
}

/**
 * Extrai a data ISO exata (YYYY-MM-DD) de um agendamento para garantir que uma reserva de
 * "Hoje (23/11/2026)" nunca trave o horário de "Hoje (24/11/2026)".
 */
function extractBookingIsoDate(booking) {
  if (!booking) return '';
  if (booking.isoDate && /^\d{4}-\d{2}-\d{2}$/.test(booking.isoDate)) {
    return booking.isoDate;
  }
  const raw = String(booking.dateLabel || '').trim();
  const fullBr = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (fullBr) {
    return `${fullBr[3]}-${fullBr[2]}-${fullBr[1]}`;
  }
  const iso = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const shortBr = raw.match(/(\d{2})\/(\d{2})/);
  if (shortBr) {
    const year = new Date().getFullYear();
    return `${year}-${shortBr[2]}-${shortBr[1]}`;
  }
  if (booking.createdAt && !Number.isNaN(new Date(booking.createdAt).getTime())) {
    const base = new Date(booking.createdAt);
    if (raw.toLowerCase().includes('amanh')) {
      base.setDate(base.getDate() + 1);
    }
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, '0');
    const d = String(base.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (raw === 'Hoje') return getTodayIsoDate();
  if (raw === 'Amanhã') return getTomorrowIsoDate();
  return '';
}

function isSlotInPastForLocalTime(selectedDateIso, slotTimeStr) {
  if (!selectedDateIso || !slotTimeStr) return false;
  const todayIso = getTodayIsoDate();
  if (selectedDateIso < todayIso) return true;
  if (selectedDateIso > todayIso) return false;

  const [hh, mm] = String(slotTimeStr).split(':').map(Number);
  if (Number.isNaN(hh)) return false;
  const slotTotalMinutes = hh * 60 + (Number.isNaN(mm) ? 0 : mm);
  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  return slotTotalMinutes <= currentTotalMinutes;
}

function FiveStarsDisplay({ rating }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((idx) => (
        <Star
          key={idx}
          className={`w-4 h-4 ${
            idx <= rounded
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-600 fill-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

export default function ArenaDetailsPage({
  arenas = [],
  selectedSlots,
  onSelectSlot,
  onScheduleMatch,
}) {
  const { arenaId } = useParams();
  const navigate = useNavigate();
  const [fetchedArenas, setFetchedArenas] = useState([]);

  useEffect(() => {
    if (!arenas || arenas.length === 0) {
      ownerService
        .getPublicArenas()
        .then((list) => {
          if (Array.isArray(list)) {
            setFetchedArenas(list.map((a) => ({ ...a, id: a._id })));
          }
        })
        .catch(() => {});
    }
  }, [arenas]);

  const activeList = arenas && arenas.length > 0 ? arenas : fetchedArenas;

  const arena =
    activeList.find(
      (a) => String(a.id) === String(arenaId) || String(a._id) === String(arenaId)
    ) ||
    ARENAS_DATA.find((a) => String(a.id) === String(arenaId)) ||
    activeList[0] ||
    ARENAS_DATA[0];

  const [selectedCourtId, setSelectedCourtId] = useState(
    arena.courts?.[0]?.id || 'c1'
  );
  const [selectedDateIso, setSelectedDateIso] = useState(() => getTodayIsoDate());
  const [matchVisibility, setMatchVisibility] = useState('public'); // 'public' | 'friends'
  const [maxPlayers, setMaxPlayers] = useState(14);
  const [activePhoto, setActivePhoto] = useState(arena.image || arena.gallery?.[0]);
  const [liveBookedSlots, setLiveBookedSlots] = useState(null);

  useEffect(() => {
    setActivePhoto(arena.image || arena.gallery?.[0]);
    if (arena.courts?.[0]?.id) {
      setSelectedCourtId(arena.courts[0].id);
    }
  }, [arena._id, arena.id, arena.image]);

  // Busca horários ocupados em tempo real (sem cache) sempre que o usuário abre a arena
  useEffect(() => {
    const targetId = arena._id || arena.id;
    if (!targetId) return;
    let cancelled = false;
    ownerService
      .getArenaBookedSlots(targetId)
      .then((slots) => {
        if (!cancelled && Array.isArray(slots)) {
          setLiveBookedSlots(slots);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [arena._id, arena.id, arena.bookedSlots?.length]);

  const selectedCourt =
    arena.courts?.find((c) => c.id === selectedCourtId) || arena.courts?.[0];

  const selectedDateLabel = useMemo(
    () => formatIsoDateLabel(selectedDateIso),
    [selectedDateIso]
  );

  // Verifica horários já ocupados nesta arena para a quadra e data selecionadas (evita duplicidade)
  const bookedTimesSet = useMemo(() => {
    const set = new Set();
    // Quando liveBookedSlots já foi carregado em tempo real (sem cache), usa exclusivamente ele
    // para que horários cancelados fiquem livres imediatamente sem depender do cache antigo de arena.bookedSlots
    const sourceBooked =
      Array.isArray(liveBookedSlots)
        ? liveBookedSlots
        : Array.isArray(arena.bookedSlots)
          ? arena.bookedSlots
          : [];
    const currentCourtId = selectedCourt?.id || 'c1';
    const currentCourtName = selectedCourt?.name || '';

    for (const b of sourceBooked) {
      const sameCourt =
        (b.courtId && b.courtId === currentCourtId) ||
        (b.courtName && b.courtName === currentCourtName);
      if (!sameCourt) continue;

      const bookingIso = extractBookingIsoDate(b);
      if (bookingIso === selectedDateIso && b.slotTime) {
        set.add(b.slotTime);
      }
    }
    return set;
  }, [arena.bookedSlots, liveBookedSlots, selectedCourt, selectedDateIso]);

  const isSlotBooked = (slotObj) => {
    if (slotObj.status === 'booked' || slotObj.status === 'blocked') return true;
    return bookedTimesSet.has(slotObj.time);
  };

  const isSlotPast = (slotObj) => {
    return isSlotInPastForLocalTime(selectedDateIso, slotObj.time);
  };

  const isSlotUnavailable = (slotObj) => {
    return isSlotBooked(slotObj) || isSlotPast(slotObj);
  };

  const availableFutureSlots = arena.slots.filter((s) => !isSlotUnavailable(s));
  const firstAvailableSlot = availableFutureSlots[0]?.time || null;

  const currentSelectedForArena = selectedSlots[arena.id];
  const chosenSlot =
    currentSelectedForArena &&
    arena.slots.some(
      (s) => s.time === currentSelectedForArena && !isSlotUnavailable(s)
    )
      ? currentSelectedForArena
      : firstAvailableSlot;

  const scrollToBookingPanel = () => {
    const el = document.getElementById('agendar-partida-box');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Top Back Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-bold text-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-neon" />
          Voltar para Arenas
        </button>

        <button
          onClick={scrollToBookingPanel}
          className="px-5 py-2.5 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon transition-all flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Agendar Partida Agora
        </button>
      </div>

      {/* Hero Gallery & Main Info Header */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white/15">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Main Photo + Thumbnails */}
          <div className="lg:col-span-7 relative">
            <div className="h-64 sm:h-80 lg:h-full min-h-[300px] relative overflow-hidden">
              <img
                src={activePhoto || arena.image}
                alt={arena.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent" />

              {arena.gallery && arena.gallery.length > 1 && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  {arena.gallery.map((imgUrl, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(imgUrl)}
                      className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                        activePhoto === imgUrl
                          ? 'border-neon scale-105 shadow-neon'
                          : 'border-white/30 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Overview Details */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-dark-900/90">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-neon/15 border border-neon/30 text-neon text-xs font-bold uppercase tracking-wider">
                  {arena.sportLabel}
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5" /> A {arena.distance} de você
                </span>
              </div>

              <h1 className="font-display font-black text-2xl sm:text-3xl text-white flex items-center gap-2">
                <span>{arena.name}</span>
                {arena.verified && (
                  <ShieldCheck className="w-6 h-6 text-neon shrink-0" title="Arena Verificada" />
                )}
              </h1>

              {/* 5 Star Rating & Total Reviews */}
              <div className="p-3.5 rounded-2xl bg-dark-950 border border-amber-400/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiveStarsDisplay rating={(arena.reviewsCount || 0) > 0 ? arena.rating : 0} />
                  <span className="font-display font-black text-base text-amber-400">
                    {(arena.reviewsCount || 0) > 0 ? Number(arena.rating || 0).toFixed(1) : '—'}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-300">
                  {(arena.reviewsCount || 0) > 0
                    ? `${arena.reviewsCount} ${arena.reviewsCount === 1 ? 'avaliação de atleta' : 'avaliações de atletas'}`
                    : 'Nenhuma avaliação ainda'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {arena.description}
              </p>

              {/* Location & Opening Hours */}
              <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-neon shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Localização:</strong>
                    <span>{arena.address || arena.neighborhood}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-white">Funcionamento:</strong>{' '}
                    {arena.openingHours || 'Seg a Dom • 07:00 às 23:30'}
                  </span>
                </div>
              </div>
            </div>

            {/* Amenities Chips */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {arena.amenities.map((item) => (
                <span
                  key={item}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 text-slate-200 border border-white/10"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Google Maps Location Section */}
      {(() => {
        const hasCoords =
          typeof arena.coordinates?.lat === 'number' &&
          typeof arena.coordinates?.lng === 'number';
        const mapQuery = hasCoords
          ? `${arena.coordinates.lat},${arena.coordinates.lng}`
          : encodeURIComponent(
              arena.address || `${arena.name}, ${arena.neighborhood || 'Brasil'}`
            );
        const externalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

        return (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Localização no Google Maps
                </span>
                <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-0.5">
                  Como Chegar na {arena.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {arena.address || arena.neighborhood}
                  {arena.neighborhood && arena.address && !arena.address.includes(arena.neighborhood)
                    ? ` • ${arena.neighborhood}`
                    : ''}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs shadow-neon transition-all flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Traçar Rota no GPS</span>
                </a>
                <a
                  href={externalMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <span>Abrir no Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neon" />
                </a>
              </div>
            </div>

            <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-white/15 bg-dark-950 relative">
              <iframe
                title={`Mapa de localização - ${arena.name}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${mapQuery}&z=16&output=embed`}
              />
            </div>
          </div>
        );
      })()}

      {/* On-Site Services Section: Bar, Restaurant, Beverage Sales & Conveniences */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4" /> Estrutura & Gastronomia no Local
          </span>
          <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-0.5">
            Serviços do Espaço (Bar, Restaurante, Bebidas & Conveniência)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(arena.onSiteServices || []).map((service, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-neon/15 text-neon border border-neon/30">
                  {service.badge}
                </span>
                <h3 className="font-display font-bold text-base text-white">
                  {service.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {service.description}
                </p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Disponível no complexo
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN SECTION: AGENDAR PARTIDA (Courts, Surfaces: Areia/Sintética, Calendar, Visibility & Available Slots) */}
      <div
        id="agendar-partida-box"
        className="rounded-3xl bg-gradient-to-br from-dark-900 via-dark-900 to-dark-950 border-2 border-neon/50 p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neon">
              <Sparkles className="w-4 h-4" /> Agendamento Oficial em Tempo Real
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
              Criar & Agendar Partida nesta Arena
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Escolha a data no calendário, a quadra, o horário livre e defina se a partida será pública ou somente para amigos.
            </p>
          </div>

          {/* Date Selector Pills + Interactive Calendar Input */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Hoje', iso: getTodayIsoDate() },
              { label: 'Amanhã', iso: getTomorrowIsoDate() },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setSelectedDateIso(item.iso)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  selectedDateIso === item.iso
                    ? 'bg-neon text-dark-950 border-neon shadow-neon'
                    : 'bg-dark-950 text-slate-300 border-white/10 hover:border-white/30'
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="relative flex items-center gap-2 bg-dark-950 border border-neon/40 hover:border-neon rounded-xl px-3.5 py-2 transition-all">
              <Calendar className="w-4 h-4 text-neon shrink-0 pointer-events-none" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                  Escolher no Calendário
                </span>
                <input
                  type="date"
                  min={getTodayIsoDate()}
                  value={selectedDateIso}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDateIso(e.target.value);
                  }}
                  className="bg-transparent text-xs font-extrabold text-white focus:outline-none cursor-pointer [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Select Court, Sport & Surface (Areia, Sintética, Coberta) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-neon" /> 1. Escolha a Quadra, Esporte e Tipo de Piso:
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {(arena.courts || []).map((court) => {
              const isSelected = selectedCourt?.id === court.id;
              return (
                <div
                  key={court.id}
                  onClick={() => setSelectedCourtId(court.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-neon/10 border-neon shadow-neon'
                      : 'bg-dark-950/80 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/10 text-neon">
                        {court.covered ? 'Quadra Coberta' : 'Ao Ar Livre'}
                      </span>
                      <span className="font-display font-black text-sm text-white">
                        R$ {court.pricePerHour}/h
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-base text-white">
                      {court.name}
                    </h4>
                    <p className="text-xs text-emerald-400 font-semibold">
                      Esporte: {court.sport}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Piso:</span>
                    <strong className="text-slate-200">{court.surface}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Available Time Slot */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-neon" /> 2. Escolha o Horário Disponível ({selectedDateLabel}):
            </label>
            <span className="text-xs text-emerald-400 font-semibold">
              Apenas horários futuros são liberados (Horário Local:{' '}
              {new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              )
            </span>
          </div>

          {availableFutureSlots.length === 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200">
              <span>
                Todos os horários de <strong>{selectedDateLabel}</strong> nesta quadra já passaram ou já estão reservados.
              </span>
              <button
                type="button"
                onClick={() => setSelectedDateIso(getTomorrowIsoDate())}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-display font-extrabold text-xs shrink-0"
              >
                Ver Horários de Amanhã →
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {arena.slots.map((slotObj) => {
              const isBooked = isSlotBooked(slotObj);
              const isPast = !isBooked && isSlotPast(slotObj);
              const isDisabled = isBooked || isPast;
              const isSelected = !isDisabled && chosenSlot === slotObj.time;
              return (
                <button
                  key={slotObj.time}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onSelectSlot(arena.id, slotObj.time)}
                  className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all flex flex-col items-center justify-center ${
                    isBooked
                      ? 'bg-red-500/10 border-red-500/25 text-slate-500 line-through cursor-not-allowed'
                      : isPast
                        ? 'bg-white/5 border-white/5 text-slate-600 line-through cursor-not-allowed'
                        : isSelected
                          ? 'bg-neon text-dark-950 border-neon shadow-neon scale-[1.02]'
                          : 'bg-dark-950 text-slate-200 border-white/10 hover:border-neon/40'
                  }`}
                >
                  <span>{slotObj.time}</span>
                  <span
                    className={`text-[10px] font-semibold ${
                      isBooked
                        ? 'text-red-400 no-underline'
                        : isPast
                          ? 'text-slate-500 no-underline'
                          : isSelected
                            ? 'text-dark-950'
                            : 'text-emerald-400'
                    }`}
                  >
                    {isBooked
                      ? 'Reservado'
                      : isPast
                        ? 'Encerrado'
                        : slotObj.discount
                          ? `Livre (${slotObj.discount})`
                          : 'Disponível'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Match Privacy / Visibility (Partida Pública vs. Somente Amigos) */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-neon" /> 3. Visibilidade da Partida:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setMatchVisibility('public')}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                matchVisibility === 'public'
                  ? 'bg-neon/10 border-neon shadow-neon'
                  : 'bg-dark-950/80 border-white/10 hover:border-white/30'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  matchVisibility === 'public'
                    ? 'bg-neon text-dark-950'
                    : 'bg-white/10 text-neon'
                }`}
              >
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm sm:text-base text-white">
                    Partida Pública (Lobby Aberto)
                  </span>
                  {matchVisibility === 'public' && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-neon text-dark-950">
                      Selecionado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Sua partida aparecerá no Lobby Público para que outros atletas da região possam solicitar entrada e completar o time.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMatchVisibility('friends')}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                matchVisibility === 'friends'
                  ? 'bg-emerald-400/15 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                  : 'bg-dark-950/80 border-white/10 hover:border-white/30'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  matchVisibility === 'friends'
                    ? 'bg-emerald-400 text-dark-950'
                    : 'bg-white/10 text-emerald-400'
                }`}
              >
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm sm:text-base text-white">
                    Somente Amigos (Partida Privada)
                  </span>
                  {matchVisibility === 'friends' && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-400 text-dark-950">
                      Selecionado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Reserva fechada apenas para você e seus amigos convidados. Não ficará listada no Lobby Público.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Step 4: Quantidade de Jogadores na Partida */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-neon" /> 4. Quantos Jogadores Podem Entrar na Partida:
            </label>
            <span className="text-xs font-display font-black text-neon">
              Limite: {maxPlayers} atletas
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { count: 4, label: '4 (Duplas / BT / Vôlei)' },
              { count: 8, label: '8 (4x4)' },
              { count: 10, label: '10 (Futsal 5x5)' },
              { count: 12, label: '12 (Society 6x6)' },
              { count: 14, label: '14 (Society 7x7)' },
              { count: 16, label: '16 (7x7 + Reservas)' },
              { count: 22, label: '22 (Campo 11x11)' },
            ].map((opt) => (
              <button
                key={opt.count}
                type="button"
                onClick={() => setMaxPlayers(opt.count)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  maxPlayers === opt.count
                    ? 'bg-neon text-dark-950 border-neon shadow-neon'
                    : 'bg-dark-950/80 text-slate-300 border-white/10 hover:border-white/30'
                }`}
              >
                {opt.label}
              </button>
            ))}

            <div className="flex items-center gap-1.5 bg-dark-950 border border-white/15 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">Outro:</span>
              <input
                type="number"
                min={2}
                max={40}
                value={maxPlayers}
                onChange={(e) =>
                  setMaxPlayers(Math.max(2, Math.min(40, Number(e.target.value) || 2)))
                }
                className="w-12 bg-transparent text-xs font-display font-black text-neon text-center focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 5: Summary & Final CTA */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <ShoppingBag className="w-4 h-4 text-neon" />
              <span>
                Quadra: <strong className="text-white">{selectedCourt?.name}</strong> (
                {selectedCourt?.surface})
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-bold text-neon">
                {matchVisibility === 'public' ? '🌐 Partida Pública' : '🔒 Somente Amigos'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-bold text-emerald-300">
                👥 Máx. {maxPlayers} jogadores
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Data e Horário: <strong className="text-neon">{selectedDateLabel} às {chosenSlot}</strong> •{' '}
              Valor da quadra:{' '}
              <strong className="text-white">
                R$ {selectedCourt?.pricePerHour || arena.pricePerHour},00
              </strong>
            </p>
          </div>

          <button
            type="button"
            disabled={!chosenSlot || bookedTimesSet.has(chosenSlot)}
            onClick={() => {
              if (!chosenSlot) return;
              onSelectSlot(arena.id, chosenSlot);
              onScheduleMatch({
                ...arena,
                pricePerHour: selectedCourt?.pricePerHour || arena.pricePerHour,
                selectedCourtId: selectedCourt?.id || 'c1',
                selectedCourtName: selectedCourt?.name,
                selectedSurface: selectedCourt?.surface,
                selectedDate: selectedDateLabel,
                selectedDateIso,
                selectedSlotTime: chosenSlot,
                matchVisibility,
                isPublicLobby: matchVisibility === 'public',
                maxPlayers,
                totalSlots: maxPlayers,
              });
            }}
            className="px-7 py-4 rounded-2xl bg-neon hover:bg-neon-400 disabled:opacity-50 disabled:cursor-not-allowed text-dark-950 font-display font-black text-sm sm:text-base shadow-neon transition-all flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            <span>
              {!chosenSlot || bookedTimesSet.has(chosenSlot)
                ? 'Escolha Outra Data / Horário Futuro'
                : `Agendar Partida (${selectedDateLabel.split(' ')[0]} às ${chosenSlot})`}
            </span>
          </button>
        </div>
      </div>

      {/* Real Reviews Section */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-amber-400" /> Avaliações Reais da Comunidade
          </span>
          <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-0.5">
            O que os Atletas Dizem sobre esta Arena ({arena.reviewsCount || 0})
          </h2>
        </div>

        {!arena.reviews || arena.reviews.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 border border-white/10 text-xs sm:text-sm text-slate-400">
            Esta arena ainda não recebeu avaliações. Agende uma partida e seja o primeiro a avaliar!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {arena.reviews.map((rev, idx) => (
              <div
                key={rev._id || idx}
                className="glass-card rounded-2xl p-5 border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {rev.userAvatar ? (
                      <img
                        src={rev.userAvatar}
                        alt={rev.userName}
                        className="w-9 h-9 rounded-full object-cover border border-neon"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-dark-950 border border-neon flex items-center justify-center font-display font-black text-xs text-neon">
                        {(rev.userName || 'AT')
                          .split(' ')
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-white">{rev.userName}</p>
                      <span className="text-[10px] text-amber-400 font-semibold">
                        {rev.tierLabel || `${rev.stars} Estrelas`}
                      </span>
                    </div>
                  </div>
                  <FiveStarsDisplay rating={rev.stars} />
                </div>
                {rev.comment && (
                  <p className="text-xs text-slate-300 leading-relaxed">"{rev.comment}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

