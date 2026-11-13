import React from 'react';
import { MapPin } from 'lucide-react';
import { SPORTS_CATEGORIES } from '../../data/mockData';
import ArenaCard from '../cards/ArenaCard';

export default function ArenaExplorerSection({
  arenas,
  selectedCategory,
  onCategoryChange,
  selectedSlots,
  onSelectSlot,
  onOpenBooking,
  onViewArenaDetails,
}) {
  return (
    <section id="explorar" className="py-16 sm:py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-neon text-xs font-bold uppercase tracking-widest mb-2">
              <MapPin className="w-4 h-4" /> Geolocalização Inteligente
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
              Arenas Próximas com <span className="text-neon">Horários Vagos</span>
            </h2>
          </div>
          <p className="text-slate-400 text-sm max-w-md">
            Compare a distância, escolha seu horário disponível ao vivo e já inclua os produtos oficiais da arena na reserva.
          </p>
        </div>

        {/* Horizontal Scrollable Sport Pills (Mobile First) */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-4 mb-8">
          {SPORTS_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-neon text-dark-950 border-neon shadow-neon'
                    : 'bg-dark-900/90 text-slate-300 border-white/10 hover:border-white/25'
                }`}
              >
                <span>{category.name}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-dark-950/20 text-dark-950' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Arena Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {arenas.map((arena) => {
            const chosenSlot =
              selectedSlots[arena.id] ||
              arena.slots.find((s) => s.status === 'available')?.time;
            return (
              <ArenaCard
                key={arena.id}
                arena={arena}
                chosenSlot={chosenSlot}
                onSelectSlot={onSelectSlot}
                onBook={onOpenBooking}
                onViewDetails={onViewArenaDetails}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

