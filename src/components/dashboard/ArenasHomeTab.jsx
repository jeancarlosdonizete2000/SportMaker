import React from 'react';
import {
  Star,
  MapPin,
  ShieldCheck,
  Clock,
  UtensilsCrossed,
  ChevronRight,
  Search,
  Sparkles,
  Navigation,
} from 'lucide-react';
import { SPORTS_CATEGORIES } from '../../data/mockData';

function FiveStarsDisplay({ rating }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5" title={`Avaliação ${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((starIndex) => (
        <Star
          key={starIndex}
          className={`w-3.5 h-3.5 ${
            starIndex <= rounded
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-600 fill-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

export default function ArenasHomeTab({
  arenas,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  maxRadius = 10,
  onRadiusChange,
  onOpenArenaDetails,
  userLocation,
  onOpenLocationModal,
}) {
  return (
    <div className="space-y-8">
      {/* Top Welcome & Search Filter Bar */}
      <div className="glass-card rounded-3xl p-6 border border-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neon">
              <Sparkles className="w-3.5 h-3.5" /> Home Principal • Arenas Verificadas
            </span>

            {onOpenLocationModal && (
              <button
                type="button"
                onClick={onOpenLocationModal}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  userLocation?.label
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/25'
                    : 'bg-amber-400/15 border-amber-400/40 text-amber-300 hover:bg-amber-400/25'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>
                  {userLocation?.label
                    ? `Sua Localização: ${userLocation.label} (${
                        userLocation.mode === 'gps' ? 'GPS' : 'Manual'
                      })`
                    : 'Ativar GPS ou Marcar Localização Manual'}
                </span>
              </button>
            )}
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Explore as Melhores Arenas Próximas
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Clique em uma arena para ver detalhes do espaço, localização, bar/restaurante no local e agendar sua partida.
          </p>
        </div>

        {/* Search Input + Alterar Localização Button */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="w-full sm:w-80 flex items-center gap-2.5 bg-dark-950 border border-white/15 rounded-2xl px-4 py-3 focus-within:border-neon">
            <Search className="w-4 h-4 text-neon shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar arena, bairro ou esporte..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {onOpenLocationModal && (
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-neon flex items-center justify-center gap-2 shrink-0 transition-all"
            >
              <MapPin className="w-4 h-4" />
              <span>{userLocation?.label ? 'Trocar Local' : 'Definir Local'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills & Radius Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {SPORTS_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            const realCount =
              cat.id === 'all'
                ? arenas.length
                : arenas.filter((a) => a.sport === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 ${
                  active
                    ? 'bg-neon text-dark-950 border-neon shadow-neon'
                    : 'bg-dark-900/90 text-slate-300 border-white/10 hover:border-white/25'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                    active ? 'bg-dark-950/20 text-dark-950' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {realCount}
                </span>
              </button>
            );
          })}
        </div>

        {onRadiusChange && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <MapPin className="w-3.5 h-3.5 text-neon" /> Raio:
            </span>
            {[2, 5, 10, 20].map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => onRadiusChange(km)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  maxRadius === km
                    ? 'bg-neon text-dark-950'
                    : 'bg-dark-900/90 text-slate-300 border border-white/10 hover:border-white/25'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Arenas Showcase Grid with 5-Star Rating & Total Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {arenas.map((arena) => {
          const availableCount = arena.slots.filter((s) => s.status === 'available').length;

          return (
            <div
              key={arena.id}
              onClick={() => onOpenArenaDetails(arena.id)}
              className="glass-card glass-card-hover rounded-3xl overflow-hidden flex flex-col justify-between border border-white/10 cursor-pointer group"
            >
              <div>
                {/* High-Res Arena Image & Star Rating Badge */}
                <div className="relative h-56 sm:h-64 overflow-hidden">
                  <img
                    src={arena.image}
                    alt={arena.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/25 to-transparent" />

                  {/* Distance Badge */}
                  <div className="absolute top-3.5 left-3.5">
                    <span className="px-3 py-1.5 rounded-full bg-dark-950/90 backdrop-blur-md border border-white/15 text-xs font-bold text-neon flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {arena.distance} • {arena.neighborhood}
                    </span>
                  </div>

                  {/* 5 Stars + Reviews Count Overlay */}
                  <div className="absolute top-3.5 right-3.5 bg-dark-950/90 backdrop-blur-md border border-amber-400/30 px-3 py-1.5 rounded-2xl flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      <FiveStarsDisplay rating={arena.rating} />
                      <span className="font-display font-black text-xs text-amber-400">
                        {arena.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-300">
                      {arena.reviewsCount} avaliações verificadas
                    </span>
                  </div>

                  {/* Arena Title Overlay */}
                  <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                        {arena.sportLabel}
                      </span>
                      <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white flex items-center gap-1.5">
                        {arena.name}
                        {arena.verified && (
                          <ShieldCheck className="w-5 h-5 text-neon shrink-0" />
                        )}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Arena Body Details */}
                <div className="p-5 space-y-4">
                  {/* Star Rating Breakdown Bar */}
                  <div className="p-3 rounded-2xl bg-dark-950/80 border border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FiveStarsDisplay rating={arena.rating} />
                      <span className="text-xs font-bold text-white">
                        {arena.rating} / 5.0 estrelas
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      <strong className="text-neon">{arena.reviewsCount} avaliações</strong> de jogadores
                    </span>
                  </div>

                  {/* On-Site Services & Courts Summary */}
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {arena.onSiteServices?.[0]?.title || 'Bar, Bebidas & Conveniência no local'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neon shrink-0" />
                      <span>
                        <strong className="text-white">{availableCount} horários livres hoje</strong> •{' '}
                        {arena.courts?.length || 3} quadras (Areia / Sintética)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="px-5 py-4 bg-dark-950/90 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    A partir de R$ {arena.pricePerHour}/h ou:
                  </span>
                  <span className="font-display font-black text-xl text-white">
                    R$ {arena.pricePerPlayer},00{' '}
                    <span className="text-xs font-bold text-neon">/ atleta</span>
                  </span>
                </div>

                <span className="px-5 py-2.5 rounded-xl bg-neon group-hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon transition-all flex items-center gap-1.5">
                  <span>Ver Espaço & Agendar</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
