import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  DollarSign,
  CalendarClock,
  Building2,
  Settings,
  PlusCircle,
} from 'lucide-react';

export default function OwnerMobileBottomNav({
  bookingsCount = 0,
  onOpenNewBooking,
}) {
  const leftItems = [
    { id: 'ganhos', path: '/proprietario/ganhos', label: 'Ganhos', icon: DollarSign },
    {
      id: 'horarios',
      path: '/proprietario/horarios',
      label: 'Horários',
      icon: CalendarClock,
      badge: bookingsCount,
    },
  ];

  const rightItems = [
    { id: 'arenas', path: '/proprietario/arenas', label: 'Arenas', icon: Building2 },
    { id: 'configuracoes', path: '/proprietario/configuracoes', label: 'Conta', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-950/95 backdrop-blur-xl border-t border-white/15 px-2 sm:px-6 py-2">
      <div className="max-w-3xl mx-auto flex items-center justify-around">
        {leftItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl font-semibold text-[11px] transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full bg-emerald-400 text-dark-950 text-[9px] font-black flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Central Highlight Button: Marcar Horário */}
        <button
          onClick={onOpenNewBooking}
          className="flex flex-col items-center gap-0.5 -mt-5"
          title="Marcar Horário"
        >
          <span className="w-12 h-12 rounded-2xl bg-neon hover:bg-neon-400 text-dark-950 shadow-neon flex items-center justify-center font-black transition-transform active:scale-95">
            <PlusCircle className="w-6 h-6 stroke-[2.5]" />
          </span>
          <span className="text-[10px] font-bold text-neon">Agendar</span>
        </button>

        {rightItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl font-semibold text-[11px] transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

