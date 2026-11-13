import React, { useState } from 'react';
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
} from 'lucide-react';
import { ARENAS_DATA } from '../data/mockData';

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
  arenas = ARENAS_DATA,
  selectedSlots,
  onSelectSlot,
  onScheduleMatch,
}) {
  const { arenaId } = useParams();
  const navigate = useNavigate();

  const arena =
    arenas.find(
      (a) => String(a.id) === String(arenaId) || String(a._id) === String(arenaId)
    ) ||
    ARENAS_DATA.find((a) => String(a.id) === String(arenaId)) ||
    arenas[0] ||
    ARENAS_DATA[0];

  const [selectedCourtId, setSelectedCourtId] = useState(
    arena.courts?.[0]?.id || 'c1'
  );
  const [selectedDate, setSelectedDate] = useState('Hoje');
  const [activePhoto, setActivePhoto] = useState(arena.image);

  const selectedCourt =
    arena.courts?.find((c) => c.id === selectedCourtId) || arena.courts?.[0];

  const chosenSlot =
    selectedSlots[arena.id] ||
    arena.slots.find((s) => s.status === 'available')?.time ||
    '19:00';

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
                  <FiveStarsDisplay rating={arena.rating} />
                  <span className="font-display font-black text-base text-amber-400">
                    {arena.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-300">
                  {arena.reviewsCount} avaliações de atletas
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

      {/* MAIN SECTION: AGENDAR PARTIDA (Courts, Surfaces: Areia/Sintética, Sports & Available Slots) */}
      <div
        id="agendar-partida-box"
        className="rounded-3xl bg-gradient-to-br from-dark-900 via-dark-900 to-dark-950 border-2 border-neon/50 p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neon">
              <Sparkles className="w-4 h-4" /> Agendamento Oficial em Tempo Real
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
              Agendar Partida nesta Arena
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Escolha a quadra (grama sintética, areia, piso rápido), a modalidade e o horário disponível.
            </p>
          </div>

          {/* Date Selector Pills */}
          <div className="flex items-center gap-2">
            {['Hoje', 'Amanhã', 'Sábado'].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDate(day)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  selectedDate === day
                    ? 'bg-neon text-dark-950 border-neon shadow-neon'
                    : 'bg-dark-950 text-slate-300 border-white/10 hover:border-white/30'
                }`}
              >
                {day}
              </button>
            ))}
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-neon" /> 2. Escolha o Horário Disponível ({selectedDate}):
            </label>
            <span className="text-xs text-emerald-400 font-semibold">
              Confirmação instantânea
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {arena.slots.map((slotObj) => {
              const isBooked = slotObj.status === 'booked';
              const isSelected = chosenSlot === slotObj.time;
              return (
                <button
                  key={slotObj.time}
                  disabled={isBooked}
                  onClick={() => onSelectSlot(arena.id, slotObj.time)}
                  className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all flex flex-col items-center justify-center ${
                    isBooked
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
                        ? 'text-slate-600'
                        : isSelected
                          ? 'text-dark-950'
                          : 'text-emerald-400'
                    }`}
                  >
                    {isBooked ? 'Ocupado' : slotObj.discount ? `Livre (${slotObj.discount})` : 'Disponível'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Products Preview & Final CTA */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShoppingBag className="w-4 h-4 text-neon" />
              <span>
                Quadra selecionada: <strong className="text-white">{selectedCourt?.name}</strong> (
                {selectedCourt?.surface})
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Horário: <strong className="text-neon">{selectedDate} às {chosenSlot}</strong> •{' '}
              Valor da quadra:{' '}
              <strong className="text-white">
                R$ {selectedCourt?.pricePerHour || arena.pricePerHour},00
              </strong>
            </p>
          </div>

          <button
            onClick={() =>
              onScheduleMatch({
                ...arena,
                pricePerHour: selectedCourt?.pricePerHour || arena.pricePerHour,
                selectedCourtName: selectedCourt?.name,
                selectedSurface: selectedCourt?.surface,
                selectedDate,
              })
            }
            className="px-7 py-4 rounded-2xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-black text-sm sm:text-base shadow-neon transition-all flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            <span>Agendar Partida às {chosenSlot}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

