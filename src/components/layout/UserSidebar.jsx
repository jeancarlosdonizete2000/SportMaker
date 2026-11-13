import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MapPin,
  Users,
  Calendar,
  HeartHandshake,
  Trophy,
  Settings,
  LogOut,
  Crown,
} from 'lucide-react';

export const APP_NAV_TABS = [
  { id: 'arenas', path: '/app/arenas', label: 'Home Arenas', icon: MapPin },
  { id: 'lobbies', path: '/app/lobbies', label: 'Lobby de Partidas', icon: Users },
  { id: 'my-matches', path: '/app/minhas-partidas', label: 'Minhas Partidas', icon: Calendar },
  { id: 'friends', path: '/app/amigos', label: 'Amigos', icon: HeartHandshake },
  { id: 'profile', path: '/app/perfil', label: 'Meu Perfil', icon: Trophy },
  { id: 'seja-pro', path: '/app/seja-pro', label: 'Seja PRO', icon: Crown, isProTab: true },
  { id: 'settings', path: '/app/configuracoes', label: 'Configurações', icon: Settings },
];

export default function UserSidebar({
  myMatchesCount = 0,
  user,
  onLogout,
}) {
  const isPro = !!user?.isPro && user?.proStatus === 'active';

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 md:fixed md:inset-y-0 md:left-0 z-40 bg-dark-950/95 backdrop-blur-xl border-r border-white/10 justify-between p-5">
      <div className="space-y-6">
        {/* Brand Logo */}
        <NavLink to="/app/arenas" className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-neon flex items-center justify-center text-dark-950 font-display font-black text-xl shadow-neon shrink-0">
            SM
          </div>
          <div>
            <span className="font-display font-extrabold text-xl tracking-tight text-white">
              SPORT<span className="text-neon">MAKER</span>
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Painel do Atleta
            </span>
          </div>
        </NavLink>

        {/* Primary Highlight Action: Lobby de Partidas */}
        <NavLink
          to="/app/lobbies"
          className="w-full py-3 px-4 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon transition-all flex items-center justify-center gap-2"
        >
          <Users className="w-4 h-4 stroke-[2.5]" />
          <span>Lobby de Partidas</span>
        </NavLink>

        {/* Vertical Navigation Links with Router NavLink */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">
            Menu Principal
          </span>
          {APP_NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={({ isActive }) =>
                  `w-full px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between group ${
                    isActive
                      ? tab.isProTab
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-dark-950 shadow-lg'
                        : 'bg-neon text-dark-950 shadow-neon'
                      : tab.isProTab
                      ? 'text-amber-300 hover:text-amber-200 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/15'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive
                            ? 'text-dark-950'
                            : tab.isProTab
                            ? 'text-amber-400 group-hover:scale-110 transition-transform'
                            : 'text-neon group-hover:scale-110 transition-transform'
                        }`}
                      />
                      <span>{tab.label}</span>
                    </span>

                    {tab.isProTab && (
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          isActive
                            ? 'bg-dark-950/20 text-dark-950'
                            : isPro
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-400/20 text-amber-300'
                        }`}
                      >
                        {isPro ? 'ATIVO' : 'VIP'}
                      </span>
                    )}

                    {tab.id === 'my-matches' && myMatchesCount > 0 && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                          isActive ? 'bg-dark-950/20 text-dark-950' : 'bg-neon/15 text-neon'
                        }`}
                      >
                        {myMatchesCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Bottom User Card & Logout */}
      <div className="pt-4 border-t border-white/10">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
          <NavLink
            to="/app/perfil"
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
          >
            <img
              src={user?.avatar}
              alt={user?.name}
              className={`w-10 h-10 rounded-full object-cover border shrink-0 ${
                isPro ? 'border-amber-400' : 'border-neon'
              }`}
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                {user?.nickname ? `"${user.nickname}"` : user?.name}
                {isPro && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-dark-950 text-[8px] font-black uppercase">
                    PRO
                  </span>
                )}
              </p>
              <span className="text-[10px] font-semibold text-neon block truncate">
                {user?.name} • OVR {user?.ovr || 91}
              </span>
            </div>
          </NavLink>

          <button
            onClick={onLogout}
            title="Sair da conta"
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
