import React, { useState } from 'react';
import {
  Users,
  MapPin,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Crown,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PublicLobbiesTab({
  lobbies,
  requestedLobbyIds,
  onRequestJoinLobby,
  onOpenCreateMatch,
}) {
  const { isPro } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLobbies = lobbies.filter(
    (l) =>
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.arena.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.host.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Matchmaking & Comunidade
            {isPro && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-dark-950 text-[10px] font-black uppercase flex items-center gap-1 ml-1">
                <Zap className="w-3 h-3" /> Prioridade PRO de Fila Ativa
              </span>
            )}
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
            Lobby de Partidas Públicas
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Partidas criadas por outros jogadores procurando atletas na região. Solicite entrada para garantir sua vaga!
          </p>
        </div>

        <button
          onClick={onOpenCreateMatch}
          className="shrink-0 px-5 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Criar Minha Partida Pública
        </button>
      </div>

      {/* Filter Input */}
      <div className="flex items-center gap-2.5 bg-dark-900 border border-white/10 rounded-2xl px-4 py-3 max-w-md focus-within:border-neon">
        <Search className="w-4 h-4 text-neon" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filtrar por esporte, arena ou organizador..."
          className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Public Lobbies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredLobbies.map((lobby) => {
          const isRequested = requestedLobbyIds.includes(lobby.id);
          const spotsLeft = lobby.totalSlots - lobby.filledSlots;

          return (
            <div
              key={lobby.id}
              className="glass-card rounded-3xl p-5 border border-white/10 hover:border-neon/40 transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                {/* Top Meta Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-neon/15 text-neon flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {lobby.time}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {lobby.distance}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 text-slate-200 border border-white/10">
                    {spotsLeft} {spotsLeft === 1 ? 'vaga restante' : 'vagas restantes'}
                  </span>
                </div>

                {/* Title & Arena */}
                <div>
                  <h3 className="font-display font-extrabold text-lg sm:text-xl text-white">
                    {lobby.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{lobby.arena}</p>
                </div>

                {/* Host Player Info */}
                <div className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={lobby.host.avatar}
                      alt={lobby.host.name}
                      className="w-10 h-10 rounded-full object-cover border border-neon"
                    />
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        Organizador: {lobby.host.name}
                        <ShieldCheck className="w-3.5 h-3.5 text-neon" />
                      </p>
                      <span className="text-[11px] text-neon font-semibold">
                        OVR {lobby.host.rating} • Fair Play Verificado
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Cota Pix</span>
                    <span className="font-display font-black text-base text-white">
                      R$ {lobby.pricePerPlayer},00
                    </span>
                  </div>
                </div>

                {/* Positions Needed */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 mr-1">Posições abertas:</span>
                  {lobby.neededPositions.map((pos) => (
                    <span
                      key={pos}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/20"
                    >
                      {pos}
                    </span>
                  ))}
                </div>
              </div>

              {/* Request Entry Footer Button */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  Lotação:{' '}
                  <strong className="text-white">
                    {isRequested ? lobby.filledSlots + 1 : lobby.filledSlots}/{lobby.totalSlots} atletas
                  </strong>
                </span>

                <button
                  onClick={() => onRequestJoinLobby(lobby)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-display font-extrabold transition-all flex items-center gap-1.5 ${
                    isRequested
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : isPro
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-dark-950 shadow-lg'
                      : 'bg-neon hover:bg-neon-400 text-dark-950 shadow-neon'
                  }`}
                >
                  {isRequested ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isPro ? 'Topo da Fila PRO Garantido' : 'Solicitação Enviada (Ver em Minhas Partidas)'}
                      </span>
                    </>
                  ) : (
                    <>
                      {isPro ? <Crown className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                      <span>{isPro ? 'Entrar com Prioridade PRO' : 'Solicitar Entrada'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

