import React, { useState, useRef } from 'react';
import { Users, Star, Plus, Lock } from 'lucide-react';
import LobbyCard from '../cards/LobbyCard';
import { useAuth } from '../../context/AuthContext';
import VariableProximity from '../ui/VariableProximity';

export default function CommunitySection({ lobbies, onCreateMatchClick }) {
  const titleRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const [friendRequestsSent, setFriendRequestsSent] = useState({});
  const [joinedLobbies, setJoinedLobbies] = useState({});
  const [mvpVoted, setMvpVoted] = useState('lucas');

  const handleToggleFriend = (lobbyId) => {
    setFriendRequestsSent((prev) => ({ ...prev, [lobbyId]: !prev[lobbyId] }));
  };

  const handleToggleJoin = (lobbyId) => {
    setJoinedLobbies((prev) => ({ ...prev, [lobbyId]: !prev[lobbyId] }));
  };

  const mvpCandidates = [
    {
      id: 'lucas',
      name: 'Lucas Mendes',
      stats: '3 Gols • 2 Assistências',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      votes: mvpVoted === 'lucas' ? 8 : 7,
    },
    {
      id: 'rafael',
      name: 'Rafael "Muralha" Lima',
      stats: 'Goleiro • 9 Defesas Difíceis',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      votes: mvpVoted === 'rafael' ? 6 : 5,
    },
  ];

  return (
    <section id="comunidade" className="py-16 sm:py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest block mb-2">
            Comunidade & Resenha Esportiva
          </span>
          <h2 ref={titleRef} className="font-display font-black text-3xl sm:text-5xl text-white mb-4">
            <VariableProximity
              label="Faltou Gente no Time? Crie sua Partida ou Entre em um Lobby."
              fromFontVariationSettings="'wght' 700, 'opsz' 18"
              toFontVariationSettings="'wght' 1000, 'opsz' 40"
              containerRef={titleRef}
              radius={100}
              falloff="linear"
              fromColor="#FFFFFF"
              toColor="#CCFF00"
            />
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Crie partidas abertas para convocar jogadores próximos, adicione parceiros de quadra à sua rede de amigos e vote no Craque da Partida (MVP).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Open Lobbies Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-neon" /> Partidas Abertas Procurando Jogadores
              </h3>

              <button
                onClick={onCreateMatchClick}
                className="px-4 py-2 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs shadow-neon transition-all flex items-center gap-1.5"
              >
                {isAuthenticated ? (
                  <>
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ Criar Partida Aberta</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Criar Partida (Fazer Login)</span>
                  </>
                )}
              </button>
            </div>

            {lobbies.map((lobby) => (
              <LobbyCard
                key={lobby.id}
                lobby={lobby}
                hasJoined={!!joinedLobbies[lobby.id]}
                isFriend={!!friendRequestsSent[lobby.id]}
                onToggleFriend={handleToggleFriend}
                onToggleJoin={handleToggleJoin}
              />
            ))}
          </div>

          {/* Interactive Post-Match Evaluation Widget */}
          <div className="lg:col-span-5">
            <div className="glass-card rounded-3xl p-6 border border-white/15 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400" /> Pós-Jogo Interativo
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300">
                    Simulador de Avaliação
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-xl text-white mb-2">
                  Avalie o Desempenho da Partida
                </h3>
                <p className="text-xs text-slate-400 mb-5">
                  Teste como os atletas votam no Craque da Partida (MVP) e atribuem notas que atualizam o perfil automaticamente:
                </p>

                {/* Candidate List */}
                <div className="space-y-3 mb-6">
                  {mvpCandidates.map((player) => {
                    const selected = mvpVoted === player.id;
                    return (
                      <div
                        key={player.id}
                        onClick={() => setMvpVoted(player.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          selected
                            ? 'bg-neon/10 border-neon shadow-neon'
                            : 'bg-dark-950/70 border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={player.avatar}
                            alt={player.name}
                            className="w-11 h-11 rounded-full object-cover border border-white/20"
                          />
                          <div>
                            <p className="text-sm font-bold text-white flex items-center gap-1.5">
                              {player.name}
                              {selected && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-neon text-dark-950 font-black">
                                  SEU VOTO MVP
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{player.stats}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-display font-black text-base text-neon">
                            {player.votes} votos
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-dark-950/90 border border-white/10 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-white font-bold block">Recompensa de Avaliação</span>
                  <span className="text-slate-400">+25 XP no seu Perfil & Conexão de Amizade</span>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  Ativo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
