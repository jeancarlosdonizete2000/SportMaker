import React, { useRef } from 'react';
import {
  Navigation,
  Flame,
  Search,
  MapPin,
  CheckCircle2,
  Sparkles,
  Clock,
  ShoppingBag,
  ArrowUpRight,
} from 'lucide-react';
import { SPORTS_CATEGORIES, ARENAS_DATA } from '../../data/mockData';
import VariableProximity from '../ui/VariableProximity';

export default function HeroSection({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  maxRadius,
  onRadiusChange,
  selectedSlotForFeatured,
  onSelectSlotForFeatured,
  onOpenBooking,
  userLocation,
  onOpenLocationModal,
}) {
  const featuredArena = ARENAS_DATA[0];
  const heroTitleRef = useRef(null);

  return (
    <section className="relative z-10 pt-8 pb-16 sm:pt-14 sm:pb-24 bg-grid-pattern border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neon/10 border border-neon/30 text-neon text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-neon animate-ping" />
              <span>+480 ARENAS COM HORÁRIOS VAGOS AGORA</span>
            </div>

            <h1
              ref={heroTitleRef}
              className="font-display font-black text-4xl sm:text-6xl lg:text-[64px] leading-[1.05] tracking-tight text-white"
            >
              <VariableProximity
                label="ONDE TEM"
                fromFontVariationSettings="'wght' 700, 'opsz' 18"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={heroTitleRef}
                radius={110}
                falloff="linear"
                fromColor="#FFFFFF"
                toColor="#CCFF00"
              />{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon via-lime-300 to-emerald-400">
                SPORT MAKER
              </span>{' '}
              <VariableProximity
                label="TEM BOLA ROLANDO"
                fromFontVariationSettings="'wght' 700, 'opsz' 18"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={heroTitleRef}
                radius={110}
                falloff="linear"
                fromColor="#FFFFFF"
                toColor="#CCFF00"
              />
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed font-normal">
              Localize arenas próximas por GPS, reserve horários vagos em segundos, adicione produtos do bar ou equipamentos, faça amizades e evolua seu{' '}
              <span className="text-white font-semibold">Player Card</span> a cada partida.
            </p>

            {/* Interactive Quick Search Widget */}
            <div className="glass-card p-3 sm:p-4 rounded-2xl border border-white/15 shadow-2xl max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Location Input */}
                <div className="sm:col-span-5 flex items-center gap-2.5 bg-dark-950/90 border border-white/10 rounded-xl px-3.5 py-3 focus-within:border-neon transition-colors">
                  <Navigation className="w-4 h-4 text-neon shrink-0" />
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        {userLocation?.label
                          ? `Local: ${userLocation.neighborhood || userLocation.label}`
                          : 'Sua Localização'}
                      </label>
                      {onOpenLocationModal && (
                        <button
                          type="button"
                          onClick={onOpenLocationModal}
                          className="text-[10px] font-bold text-neon hover:underline"
                        >
                          {userLocation?.label ? 'Alterar' : 'Usar GPS / Manual'}
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder={
                        userLocation?.label || 'Vila Olímpia, SP (GPS ou Manual)'
                      }
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sport Selector */}
                <div className="sm:col-span-4 flex items-center gap-2.5 bg-dark-950/90 border border-white/10 rounded-xl px-3.5 py-3">
                  <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="w-full">
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Modalidade
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => onCategoryChange(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-white focus:outline-none cursor-pointer"
                    >
                      {SPORTS_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-dark-900 text-white">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="sm:col-span-3">
                  <a
                    href="#explorar"
                    className="w-full h-full min-h-[48px] rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-neon transition-all"
                  >
                    <Search className="w-4 h-4 stroke-[2.5]" />
                    Buscar
                  </a>
                </div>
              </div>

              {/* Quick Proximity Chips */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neon" /> Raio de busca:
                  </span>
                  {[2, 5, 10, 20].map((km) => (
                    <button
                      key={km}
                      onClick={() => onRadiusChange(km)}
                      className={`px-2 py-0.5 rounded-md font-bold transition-colors ${maxRadius === km
                          ? 'bg-neon text-dark-950'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                    >
                      Até {km} km
                    </button>
                  ))}
                </div>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Divisão de Pix automática
                </span>
              </div>
            </div>

            {/* Quick Trust Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-2 max-w-lg">
              <div>
                <p className="font-display font-black text-2xl sm:text-3xl text-white">18.4k+</p>
                <p className="text-xs text-slate-400">Partidas agendadas/mês</p>
              </div>
              <div className="border-l border-white/10 pl-4">
                <p className="font-display font-black text-2xl sm:text-3xl text-neon">4.9 ★</p>
                <p className="text-xs text-slate-400">Avaliação média das arenas</p>
              </div>
              <div className="border-l border-white/10 pl-4">
                <p className="font-display font-black text-2xl sm:text-3xl text-emerald-400">100%</p>
                <p className="text-xs text-slate-400">Horários em tempo real</p>
              </div>
            </div>
          </div>

          {/* Hero Right Live Interactive Stack */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Live Arena & Match Card */}
              <div className="glass-card rounded-3xl p-5 border border-white/15 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    GPS • A 1.2 km de você
                  </span>
                  <span className="text-xs font-bold text-neon flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Destaque Hoje
                  </span>
                </div>

                {/* Image Banner */}
                <div className="relative h-44 rounded-2xl overflow-hidden mb-4">
                  <img
                    src={featuredArena.image}
                    alt={featuredArena.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/30 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-neon">
                        {featuredArena.sportLabel}
                      </p>
                      <h3 className="font-display font-bold text-lg text-white">
                        {featuredArena.name}
                      </h3>
                    </div>
                    <div className="bg-dark-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-right">
                      <span className="text-xs text-slate-400 block">Por jogador</span>
                      <span className="font-display font-black text-sm text-neon">R$ 18,00</span>
                    </div>
                  </div>
                </div>

                {/* Instant Time Slots Preview */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neon" /> Escolha um horário vago hoje:
                    </span>
                    <span className="text-emerald-400 font-bold">4 livres</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['19:00', '20:00', '21:00', '22:00'].map((slot) => {
                      const active = selectedSlotForFeatured === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => onSelectSlotForFeatured(featuredArena.id, slot)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border ${active
                              ? 'bg-neon text-dark-950 border-neon shadow-neon'
                              : 'bg-dark-950/80 text-slate-200 border-white/10 hover:border-neon/50'
                            }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add-on Arena Products Preview */}
                <div className="p-3 rounded-2xl bg-dark-950/80 border border-white/10 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neon/15 border border-neon/30 flex items-center justify-center text-neon">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        + Kit Churrasco & Bola Oficial
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Produtos cadastrados pela arena prontos na chegada
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neon bg-neon/10 px-2 py-1 rounded-lg">
                    Incluso
                  </span>
                </div>

                {/* Floating Mini Player Rating Badge */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center -space-x-2">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                      alt="Player"
                      className="w-8 h-8 rounded-full border-2 border-dark-900 object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                      alt="Player"
                      className="w-8 h-8 rounded-full border-2 border-dark-900 object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"
                      alt="Player"
                      className="w-8 h-8 rounded-full border-2 border-dark-900 object-cover"
                    />
                    <span className="w-8 h-8 rounded-full bg-neon text-dark-950 font-bold text-[11px] flex items-center justify-center border-2 border-dark-900">
                      +11
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenBooking(featuredArena)}
                    className="px-4 py-2 rounded-xl bg-white text-dark-950 hover:bg-neon font-display font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    Reservar {selectedSlotForFeatured} <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

