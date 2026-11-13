import React from 'react';
import {
  Navigation,
  Star,
  ShieldCheck,
  Clock,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';

export default function ArenaCard({ arena, chosenSlot, onSelectSlot, onBook, onViewDetails }) {
  return (
    <div
      onClick={() => onViewDetails && onViewDetails(arena)}
      className="glass-card glass-card-hover rounded-3xl overflow-hidden flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Top Image & Proximity Overlay */}
        <div className="relative h-52 sm:h-60 overflow-hidden">
          <img
            src={arena.image}
            alt={arena.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-dark-950/85 backdrop-blur-md border border-white/15 text-xs font-bold text-neon flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 fill-neon" /> {arena.distance} • {arena.neighborhood}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-dark-950/85 backdrop-blur-md border border-white/15 text-xs font-bold text-amber-400 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400" /> {arena.rating} ({arena.reviewsCount})
            </span>
          </div>

          {/* Bottom Title on Image */}
          <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                {arena.sportLabel}
              </span>
              <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white flex items-center gap-1.5">
                {arena.name}
                {arena.verified && (
                  <ShieldCheck className="w-5 h-5 text-neon shrink-0" title="Arena Verificada" />
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Arena Body Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Amenities */}
          <div className="flex flex-wrap gap-1.5">
            {arena.amenities.map((item) => (
              <span
                key={item}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/5"
              >
                {item}
              </span>
            ))}
          </div>

          {/* Interactive Available Time Slots */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-neon" /> Horários para Hoje:
              </span>
              <span className="text-slate-400">Clique para selecionar</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {arena.slots.map((slotObj) => {
                const isBooked = slotObj.status === 'booked';
                const isSelected = chosenSlot === slotObj.time;
                return (
                  <button
                    key={slotObj.time}
                    disabled={isBooked}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSlot(arena.id, slotObj.time);
                    }}
                    className={`relative py-2.5 px-1 rounded-xl text-xs font-bold border transition-all ${isBooked
                        ? 'bg-white/5 border-white/5 text-slate-600 line-through cursor-not-allowed'
                        : isSelected
                          ? 'bg-neon text-dark-950 border-neon shadow-neon scale-[1.03]'
                          : 'bg-dark-950/70 text-slate-200 border-white/10 hover:border-neon/40'
                      }`}
                  >
                    {slotObj.time}
                    {slotObj.discount && !isBooked && (
                      <span className="block text-[9px] text-emerald-400 font-extrabold">
                        {slotObj.discount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Arena Store / Products Preview */}
          <div className="p-3.5 rounded-2xl bg-dark-950/70 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-neon" /> Produtos & Adicionais da Arena:
              </span>
              <span className="text-[11px] text-neon font-semibold">Pré-reserva disponível</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {arena.products.slice(0, 3).map((prod) => (
                <span
                  key={prod.id}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300"
                >
                  <span>{prod.name}</span>
                  <strong className="text-neon">
                    {prod.price === 0 ? 'Grátis' : `+R$ ${prod.price}`}
                  </strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Action */}
      <div className="px-5 py-4 sm:px-6 bg-dark-950/90 border-t border-white/10 flex items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 block">
            R$ {arena.pricePerHour}/hora ou dividido:
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-black text-xl sm:text-2xl text-white">
              R$ {arena.pricePerPlayer}
            </span>
            <span className="text-xs text-neon font-bold">/ atleta</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onViewDetails) {
              onViewDetails(arena);
            } else {
              onBook(arena);
            }
          }}
          className="px-5 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon transition-all flex items-center gap-2"
        >
          <span>Ver Espaço & Agendar</span>
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

