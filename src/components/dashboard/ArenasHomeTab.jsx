import React, { useState, useMemo } from 'react';
import {
  Star,
  MapPin,
  ShieldCheck,
  Clock,
  UtensilsCrossed,
  ChevronRight,
  ChevronDown,
  Search,
  Sparkles,
  Navigation,
  ArrowUpDown,
  Flame,
  Beer,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SPORTS_CATEGORIES } from '../../data/mockData';

const SORT_OPTIONS = [
  { id: 'distance', label: 'Mais próximas' },
  { id: 'rating', label: 'Mais avaliadas' },
];

const AMENITY_FILTERS = [
  {
    id: 'bbq',
    label: 'Churrasqueira',
    icon: Flame,
    regex: /churras/i,
  },
  {
    id: 'drinks',
    label: 'Venda de Bebidas',
    icon: Beer,
    regex: /bebida|bar|cervej|chopp|isot[oô]nico/i,
  },
  {
    id: 'food',
    label: 'Refeições no Local',
    icon: UtensilsCrossed,
    regex: /restaurante|gastronomia|refei[cç]|por[cç][oõ]es|lanchonete|poke|hamb[uú]rguer|a[cç]a[ií]|comida/i,
  },
];

function arenaMatchesAmenity(arena, regex) {
  const amenitiesText = (arena.amenities || []).join(' ');
  const servicesText = (arena.onSiteServices || [])
    .map((s) => `${s.title || ''} ${s.description || ''} ${s.badge || ''}`)
    .join(' ');
  const productsText = (arena.products || [])
    .map((p) => `${p.name || ''} ${p.tag || ''}`)
    .join(' ');
  return regex.test(`${amenitiesText} ${servicesText} ${productsText}`);
}

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
  allArenas = arenas,
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
  const [sortBy, setSortBy] = useState('distance');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const toggleAmenity = (id) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const arenasInRadius = useMemo(() => {
    if (!userLocation?.label && !userLocation?.city && !userLocation?.lat) {
      return allArenas;
    }
    const norm = (val) =>
      String(val || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    const myCity = norm(
      userLocation.city || (userLocation.label ? userLocation.label.split(/[,-]/)[0] : '')
    );
    return allArenas.filter((arena) => {
      const regionText = norm(`${arena.neighborhood || ''} ${arena.address || ''}`);
      if (myCity && regionText.includes(myCity)) return true;
      if (userLocation?.lat && arena.distanceKmValue !== undefined) {
        return arena.distanceKmValue <= 50;
      }
      return !myCity;
    });
  }, [allArenas, userLocation]);

  const displayedArenas = useMemo(() => {
    const filtered = arenas.filter((arena) => {
      if (selectedAmenities.length === 0) return true;
      return selectedAmenities.every((amenityId) => {
        const def = AMENITY_FILTERS.find((f) => f.id === amenityId);
        return def ? arenaMatchesAmenity(arena, def.regex) : true;
      });
    });

    const sorted = [...filtered];
    if (sortBy === 'rating') {
      sorted.sort((a, b) => {
        const diff = (Number(b.rating) || 0) - (Number(a.rating) || 0);
        if (diff !== 0) return diff;
        return (Number(b.reviewsCount) || 0) - (Number(a.reviewsCount) || 0);
      });
    }
    return sorted;
  }, [arenas, selectedAmenities, sortBy]);

  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.id === sortBy)?.label || 'Mais próximas';

  return (
    <div className="space-y-8">
      {/* Top Welcome & Search Filter Bar (Desktop only — no mobile fica na lupa do header) */}
      <div className="hidden md:flex glass-card rounded-3xl p-6 border border-white/15 flex-col lg:flex-row lg:items-center justify-between gap-6">
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
                ? arenasInRadius.length
                : arenasInRadius.filter((a) => a.sport === cat.id).length;
            return (
              <motion.button
                key={cat.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onCategoryChange(cat.id)}
                className={`relative shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-colors flex items-center gap-2 ${
                  active
                    ? 'text-dark-950 border-transparent'
                    : 'bg-dark-900/90 text-slate-300 border-white/10 hover:border-white/25'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="arenasSportFilterPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-neon shadow-neon"
                  />
                )}
                <span className="relative z-10">{cat.name}</span>
                <span
                  className={`relative z-10 text-[11px] px-1.5 py-0.5 rounded-md ${
                    active ? 'bg-dark-950/20 text-dark-950' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {realCount}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Barra: Classificar Por + Filtros de Comodidades (Churrasqueira, Bebidas, Refeições) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Botão Classificar Por */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortMenuOpen((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl bg-dark-900 border border-white/15 hover:border-neon/50 text-xs font-bold text-white flex items-center gap-2 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-neon" />
            <span className="text-slate-400">Classificar por:</span>
            <span className="text-neon">{currentSortLabel}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                sortMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {sortMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="absolute left-0 mt-2 w-56 rounded-2xl bg-dark-900 border border-white/15 shadow-2xl p-1.5 z-30"
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSortBy(opt.id);
                      setSortMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      sortBy === opt.id
                        ? 'bg-neon text-dark-950'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filtros de Comodidades no Local */}
        <div className="flex flex-wrap items-center gap-2">
          {AMENITY_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const active = selectedAmenities.includes(filter.id);
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => toggleAmenity(filter.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-dark-900/90 border-white/10 text-slate-300 hover:border-white/25'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-300' : 'text-neon'}`} />
                <span>{filter.label}</span>
              </button>
            );
          })}

          {selectedAmenities.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedAmenities([])}
              className="px-2.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 border border-white/10 flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Arenas Showcase Grid with 5-Star Rating & Total Reviews */}
      {displayedArenas.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 border border-white/10 text-center space-y-2">
          <p className="font-display font-bold text-lg text-white">
            Nenhuma arena encontrada no banco de dados para este filtro.
          </p>
          <p className="text-xs text-slate-400">
            Altere o filtro de esporte, comodidades ou aumente o raio de distância.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedArenas.map((arena) => {
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
                      <FiveStarsDisplay rating={(arena.reviewsCount || 0) > 0 ? arena.rating : 0} />
                      <span className="font-display font-black text-xs text-amber-400">
                        {(arena.reviewsCount || 0) > 0 ? Number(arena.rating || 0).toFixed(1) : '—'}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-300">
                      {(arena.reviewsCount || 0) > 0
                        ? `${arena.reviewsCount} ${arena.reviewsCount === 1 ? 'avaliação real' : 'avaliações reais'}`
                        : 'Sem avaliações ainda'}
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
                      <FiveStarsDisplay rating={(arena.reviewsCount || 0) > 0 ? arena.rating : 0} />
                      <span className="text-xs font-bold text-white">
                        {(arena.reviewsCount || 0) > 0
                          ? `${Number(arena.rating || 0).toFixed(1)} / 5.0 estrelas`
                          : 'Nova Arena'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      <strong className="text-neon">{arena.reviewsCount || 0} avaliações</strong> de jogadores
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
      )}
    </div>
  );
}
