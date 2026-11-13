import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-10 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-neon text-dark-950 font-display font-black flex items-center justify-center">
            SM
          </span>
          <span className="font-display font-bold text-slate-300">SPORT MAKER</span>
          <span>© 2026 • Agendamento Esportivo & Rede Social de Atletas</span>
        </div>
        <div className="flex gap-6 text-slate-400">
          <a href="#explorar" className="hover:text-neon">Arenas</a>
          <a href="#perfil-gamer" className="hover:text-neon">Player Card</a>
          <a href="#comunidade" className="hover:text-neon">Comunidade</a>
          <a href="#proprietarios" className="hover:text-neon">Para Proprietários</a>
        </div>
      </div>
    </footer>
  );
}

