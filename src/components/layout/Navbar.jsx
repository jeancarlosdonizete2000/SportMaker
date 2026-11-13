import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Users,
  Trophy,
  Store,
  Zap,
  Menu,
  X,
  ChevronRight,
  LogIn,
  LogOut,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onNavigateLogin, onCreateMatchClick, onEnterUserHome }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-dark-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-neon flex items-center justify-center text-dark-950 font-display font-black text-xl shadow-neon group-hover:scale-105 transition-transform">
            SM
          </div>
          <div>
            <span className="font-display font-extrabold text-xl tracking-tight text-white">
              SPORT<span className="text-neon">MAKER</span>
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={onCreateMatchClick}
            className="hover:text-neon transition-colors flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-neon" /> Lobby de Partidas
          </button>
          <a href="#explorar" className="hover:text-neon transition-colors flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-neon" /> Arenas Próximas
          </a>
          <a href="#comunidade" className="hover:text-neon transition-colors flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" /> Partidas & Amigos
          </a>
          <a href="#perfil-gamer" className="hover:text-neon transition-colors flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" /> Perfil & Rating
          </a>
          <a href="#proprietarios" className="hover:text-neon transition-colors flex items-center gap-1.5">
            <Store className="w-4 h-4 text-cyan-400" /> Para Arenas
          </a>
        </nav>

        {/* Right CTA Buttons & Auth Status */}
        <div className="hidden md:flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/login/atleta?mode=register')}
                className="min-w-[124px] px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/15 text-white backdrop-blur-md transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Criar Conta
              </button>
              <button
                onClick={() => onNavigateLogin('player')}
                className="min-w-[124px] px-4 py-2.5 rounded-xl text-xs font-bold bg-neon hover:bg-emerald-400 text-dark-950 transition-all flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" /> Entrar
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <img
                src={user.avatar}
                alt={user.name}
                onClick={onEnterUserHome}
                className="w-7 h-7 rounded-full object-cover border border-neon cursor-pointer"
              />
              <div onClick={onEnterUserHome} className="text-left cursor-pointer">
                <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                <span className="text-[10px] text-neon font-semibold uppercase">
                  Ir para Meu Painel →
                </span>
              </div>
              <button
                onClick={logout}
                title="Sair da conta"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:text-neon"
          aria-label="Abrir Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-dark-900/95 backdrop-blur-xl px-4 pt-4 pb-6 space-y-3">
          {isAuthenticated ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-neon/10 border border-neon/30">
              <div className="flex items-center gap-2.5">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover border border-neon"
                />
                <div>
                  <p className="text-xs font-bold text-white">{user.name}</p>
                  <p className="text-[10px] text-neon font-semibold uppercase">
                    {user.role === 'owner' ? 'Proprietário de Arena' : 'Atleta Verificado'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 text-xs font-bold text-red-300"
              >
                Sair
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateLogin('player');
                }}
                className="p-3 rounded-xl bg-neon text-dark-950 font-display font-extrabold text-xs flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" /> Login Atleta
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateLogin('owner');
                }}
                className="p-3 rounded-xl bg-emerald-400 text-dark-950 font-display font-extrabold text-xs flex items-center justify-center gap-1.5"
              >
                <Store className="w-4 h-4" /> Login Arena
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onCreateMatchClick();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-neon/15 border border-neon/40 text-neon font-bold"
          >
            <span className="flex items-center gap-2.5">
              <Users className="w-4 h-4" /> Lobby de Partidas
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <a
            href="#explorar"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-slate-100 font-semibold"
          >
            <span className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-neon" /> Arenas por Proximidade
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
          <a
            href="#comunidade"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-slate-100 font-semibold"
          >
            <span className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-emerald-400" /> Fazer Amizades & Lobbies
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
          <a
            href="#perfil-gamer"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-slate-100 font-semibold"
          >
            <span className="flex items-center gap-2.5">
              <Trophy className="w-4 h-4 text-amber-400" /> Perfil Personalizável & OVR
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>
      )}
    </header>
  );
}
