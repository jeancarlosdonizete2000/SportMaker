import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Crown,
  Users,
  Eye,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SPORTS_CATEGORIES } from '../../data/mockData';
import {
  isEligibleForPublicLobby,
  formatLobbyDateLabel,
} from '../../utils/matchTimeUtils';

function detectLobbySport(lobby) {
  if (lobby.sport && SPORTS_CATEGORIES.some((c) => c.id === lobby.sport)) {
    return lobby.sport;
  }
  const text = `${lobby.title || ''} ${lobby.arena || ''} ${lobby.sport || ''}`.toLowerCase();
  if (/beach\s*tennis|\bbt\b/.test(text)) return 'beachtennis';
  if (/padel|t[eê]nis/.test(text)) return 'padel';
  if (/futev[oô]lei/.test(text)) return 'futevolei';
  return 'society';
}

export default function PublicLobbiesTab({
  lobbies,
  requestedLobbyIds,
  onRequestJoinLobby,
  maxRadius = 10,
  onRadiusChange,
  userLocation,
  onOpenLocationModal,
}) {
  const { user, isPro } = useAuth();
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState('all');

  // Filtra apenas partidas válidas: hoje ou 1 dia futuro (amanhã), não encerradas e não canceladas
  const activeValidLobbies = useMemo(
    () => (lobbies || []).filter((lobby) => isEligibleForPublicLobby(lobby)),
    [lobbies]
  );

  const filteredLobbies = useMemo(
    () =>
      activeValidLobbies.filter((lobby) => {
        if (selectedSport === 'all') return true;
        return detectLobbySport(lobby) === selectedSport;
      }),
    [activeValidLobbies, selectedSport]
  );

  return (
    <div className="space-y-6">
      {/* Barra de Esportes + Filtro de Região & Raio de Distância */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {SPORTS_CATEGORIES.map((cat) => {
            const active = selectedSport === cat.id;
            const count =
              cat.id === 'all'
                ? activeValidLobbies.length
                : activeValidLobbies.filter((l) => detectLobbySport(l) === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedSport(cat.id)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 ${
                  active
                    ? 'bg-neon text-dark-950 border-neon shadow-neon'
                    : 'bg-dark-900/90 text-slate-300 border-white/10 hover:border-white/25'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                    active ? 'bg-dark-950/20 text-dark-950' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenLocationModal && (
            <button
              type="button"
              onClick={onOpenLocationModal}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                userLocation?.label
                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                  : 'bg-amber-400/15 border-amber-400/40 text-amber-300'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span className="max-w-[140px] truncate">
                {userLocation?.label || 'Definir Região'}
              </span>
            </button>
          )}

          {onRadiusChange && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-0.5">
                <MapPin className="w-3.5 h-3.5 text-neon" /> Raio:
              </span>
              {[2, 5, 10, 20].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => onRadiusChange(km)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    maxRadius === km
                      ? 'bg-neon text-dark-950'
                      : 'bg-dark-900/90 text-slate-300 border border-white/10 hover:border-white/25'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Public Lobbies Grid */}
      {filteredLobbies.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 border border-white/10 text-center space-y-3">
          <p className="font-display font-bold text-lg text-white">
            Nenhuma partida pública aberta para hoje ou amanhã neste esporte.
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Toque no botão + no topo para agendar em uma arena e inaugurar um lobby para convocar atletas da sua região!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredLobbies.map((lobby) => {
            const isRequested = requestedLobbyIds.includes(String(lobby.id));
            const isMyOwnMatch = Boolean(
              user &&
                ((user._id &&
                  (String(lobby.hostId) === String(user._id) ||
                    String(lobby.host?.id) === String(user._id))) ||
                  (user.name && lobby.host?.name === user.name))
            );
            const totalSlots = Number(lobby.totalSlots) || 14;
            const filledSlots = Number(lobby.filledSlots) || 1;
            const spotsLeft = Math.max(0, totalSlots - filledSlots);
            const isFull = spotsLeft === 0;
            const queueCount = Number(lobby.pendingRequestsCount) || 0;

            return (
              <div
                key={lobby.id}
                className="glass-card rounded-3xl p-5 border border-white/10 hover:border-neon/40 transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Top Meta Info */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-neon/15 text-neon flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {formatLobbyDateLabel(lobby)}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {lobby.distance}
                      </span>
                    </div>
                    {isFull ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/35 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Lotada • Fila Aberta{queueCount > 0 ? ` (${queueCount})` : ''}
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 text-slate-200 border border-white/10">
                        {spotsLeft} {spotsLeft === 1 ? 'vaga restante' : 'vagas restantes'}
                      </span>
                    )}
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
                      {lobby.host?.avatar ? (
                        <img
                          src={lobby.host.avatar}
                          alt={lobby.host.name}
                          className="w-10 h-10 rounded-full object-cover border border-neon"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-dark-900 border border-neon flex items-center justify-center font-display font-black text-xs text-neon shrink-0">
                          {(lobby.host?.name || 'AT')
                            .split(' ')
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          Organizador: {lobby.host?.name}
                          <ShieldCheck className="w-3.5 h-3.5 text-neon" />
                        </p>
                        <span className="text-[11px] text-neon font-semibold">
                          {lobby.host?.rating > 0 ? `OVR ${lobby.host.rating}` : 'Sem OVR'} • Fair Play Verificado
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
                    {(lobby.neededPositions || []).map((pos) => (
                      <span
                        key={pos}
                        className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/20"
                      >
                        {pos}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Request Entry / Waitlist Footer Button */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    Lotação:{' '}
                    <strong className={isFull ? 'text-amber-300' : 'text-white'}>
                      {filledSlots}/{totalSlots} atletas
                    </strong>
                  </span>

                  {isMyOwnMatch ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/app/partida/${lobby.id}`)}
                      className="px-4 py-2.5 rounded-xl text-xs font-display font-extrabold transition-all flex items-center gap-1.5 bg-white/10 hover:bg-neon hover:text-dark-950 text-white border border-white/15"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Verificar Partida</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRequestJoinLobby(lobby)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-display font-extrabold transition-all flex items-center gap-1.5 ${
                        isRequested
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : isPro
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-dark-950 shadow-lg'
                            : isFull
                              ? 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40'
                              : 'bg-neon hover:bg-neon-400 text-dark-950 shadow-neon'
                      }`}
                    >
                      {isRequested ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isFull
                              ? isPro
                                ? '1º da Fila (Prioridade PRO 👑)'
                                : 'Na Fila de Espera (Sair da Fila)'
                              : isPro
                                ? 'Topo da Fila PRO Garantido'
                                : 'Solicitação Enviada'}
                          </span>
                        </>
                      ) : isFull ? (
                        <>
                          {isPro ? <Crown className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          <span>
                            {isPro ? 'Entrar no Topo da Fila PRO' : 'Entrar na Fila de Espera'}
                          </span>
                        </>
                      ) : (
                        <>
                          {isPro ? <Crown className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                          <span>{isPro ? 'Entrar com Prioridade PRO' : 'Solicitar Entrada'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
