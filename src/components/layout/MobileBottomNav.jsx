import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MapPin,
  Users,
  Calendar,
  HeartHandshake,
  Settings,
} from 'lucide-react';

export default function MobileBottomNav({ myMatchesCount = 0 }) {
  const leftItems = [
    { id: 'arenas', path: '/app/arenas', label: 'Arenas', icon: MapPin },
    {
      id: 'my-matches',
      path: '/app/minhas-partidas',
      label: 'Partidas',
      icon: Calendar,
      badge: myMatchesCount,
    },
  ];

  const rightItems = [
    { id: 'friends', path: '/app/amigos', label: 'Amigos', icon: HeartHandshake },
    { id: 'settings', path: '/app/configuracoes', label: 'Conta', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-950/95 backdrop-blur-xl border-t border-white/15 px-2 py-2">
      <div className="max-w-3xl mx-auto grid grid-cols-5 items-center">
        {leftItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl font-semibold text-[11px] transition-colors ${
                  isActive ? 'text-neon' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full bg-neon text-dark-950 text-[9px] font-black flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Central Highlight Button: Lobby de Partidas */}
        <NavLink
          to="/app/lobbies"
          className="flex flex-col items-center gap-0.5 -mt-5"
          title="Lobby de Partidas"
        >
          <span className="w-12 h-12 rounded-2xl bg-neon hover:bg-neon-400 text-dark-950 shadow-neon flex items-center justify-center font-black transition-transform active:scale-95">
            <Users className="w-6 h-6 stroke-[2.5]" />
          </span>
          <span className="text-[10px] font-bold text-neon">Lobby</span>
        </NavLink>

        {rightItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl font-semibold text-[11px] transition-colors ${
                  isActive
                    ? item.isProTab
                      ? 'text-amber-400'
                      : 'text-neon'
                    : item.isProTab
                    ? 'text-amber-300/80 hover:text-amber-300'
                    : 'text-slate-400 hover:text-white'
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
