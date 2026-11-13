import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  DollarSign,
  CalendarClock,
  Building2,
  Settings,
  LogOut,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';

export const OWNER_NAV_TABS = [
  {
    id: 'ganhos',
    path: '/proprietario/ganhos',
    label: 'Painel de Ganhos',
    icon: DollarSign,
  },
  {
    id: 'horarios',
    path: '/proprietario/horarios',
    label: 'Quadro de Horários',
    icon: CalendarClock,
  },
  {
    id: 'arenas',
    path: '/proprietario/arenas',
    label: 'Minhas Arenas & Quadras',
    icon: Building2,
  },
  {
    id: 'configuracoes',
    path: '/proprietario/configuracoes',
    label: 'Conta & Recebimentos',
    icon: Settings,
  },
];

export default function OwnerSidebar({
  user,
  arenasCount = 1,
  bookingsCount = 0,
  onOpenNewBooking,
  onLogout,
}) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 md:fixed md:inset-y-0 md:left-0 z-40 bg-dark-950/95 backdrop-blur-xl border-r border-white/10 justify-between p-5">
      <div className="space-y-6">
        {/* Brand Logo */}
        <NavLink to="/proprietario/ganhos" className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-400 flex items-center justify-center text-dark-950 font-display font-black text-xl shadow-[0_0_20px_rgba(52,211,153,0.4)] shrink-0">
            SM
          </div>
          <div>
            <span className="font-display font-extrabold text-xl tracking-tight text-white">
              SPORT<span className="text-emerald-400">MAKER</span>
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-neon">
              Gestão do Proprietário
            </span>
          </div>
        </NavLink>

        {/* Primary Highlight Action: Novo Agendamento Manual */}
        <button
          onClick={onOpenNewBooking}
          className="w-full py-3 px-4 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Marcar Horário no Quadro</span>
        </button>

        {/* Vertical Navigation Links */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">
            Painel Administrativo
          </span>
          {OWNER_NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={({ isActive }) =>
                  `w-full px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between group ${
                    isActive
                      ? 'bg-emerald-400 text-dark-950 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
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
                            : 'text-emerald-400 group-hover:scale-110 transition-transform'
                        }`}
                      />
                      <span>{tab.label}</span>
                    </span>

                    {tab.id === 'horarios' && bookingsCount > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          isActive
                            ? 'bg-dark-950/20 text-dark-950'
                            : 'bg-emerald-400/15 text-emerald-300'
                        }`}
                      >
                        {bookingsCount}
                      </span>
                    )}

                    {tab.id === 'arenas' && arenasCount > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          isActive ? 'bg-dark-950/20 text-dark-950' : 'bg-neon/15 text-neon'
                        }`}
                      >
                        {arenasCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Bottom Owner Card & Logout */}
      <div className="pt-4 border-t border-white/10">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
          <NavLink
            to="/proprietario/configuracoes"
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
          >
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80'
              }
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover border border-emerald-400 shrink-0"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                {user?.name || 'Gestor da Arena'}
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </p>
              <span className="text-[10px] font-semibold text-emerald-400 block truncate">
                Proprietário • MongoDB Sync
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

