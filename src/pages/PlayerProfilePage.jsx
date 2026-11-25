import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Clock,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  ChevronRight,
  X,
  Calendar,
} from 'lucide-react';
import PlayerCard from '../components/cards/PlayerCard';
import { TeamEmblemPreview } from '../components/dashboard/TeamsTab';
import { CARD_THEMES } from '../data/mockData';
import { MONGO_CONFIG } from '../services/mongoClient';
import { ownerService } from '../services/ownerService';

export default function PlayerProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const statePlayer = location.state?.player || null;

  const [player, setPlayer] = useState(statePlayer);
  const [playerTeam, setPlayerTeam] = useState(statePlayer?.team || null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [friendStatus, setFriendStatus] = useState(
    statePlayer?.isFriend ? 'accepted' : statePlayer?.requestSent ? 'pending' : 'none'
  );
  const [loadingFriendAction, setLoadingFriendAction] = useState(false);

  useEffect(() => {
    let active = true;
    async function syncPlayerAndFriendStatus() {
      try {
        const res = await fetch(`${MONGO_CONFIG.restApiUrl}/users/${userId}`);
        if (res.ok && active) {
          const json = await res.json();
          if (json?.user) {
            setPlayer((prev) => ({ ...prev, ...json.user }));
          }
          if (json?.team || json?.user?.team) {
            setPlayerTeam(json.team || json.user.team);
          }
        }
      } catch {
        // mantém dados do state se offline
      }

      try {
        const data = await ownerService.getFriendsData();
        if (!active) return;
        const foundFriend = (data.friends || []).find(
          (f) => String(f.id) === String(userId)
        );
        if (foundFriend) {
          setPlayer((prev) => ({
            ...foundFriend,
            ...prev,
            cardThemeId: prev?.cardThemeId || foundFriend.cardThemeId,
          }));
          setFriendStatus('accepted');
          return;
        }
        const foundPending = (data.sentRequests || []).find(
          (r) => String(r.id) === String(userId)
        );
        if (foundPending) {
          setFriendStatus('pending');
        }
      } catch {
        // mantém estado atual caso offline
      }
    }
    syncPlayerAndFriendStatus();
    return () => {
      active = false;
    };
  }, [userId]);

  const handleAddFriend = async () => {
    if (loadingFriendAction || friendStatus !== 'none') return;
    setLoadingFriendAction(true);
    try {
      const res = await ownerService.addFriend(userId);
      if (res?.status === 'accepted') {
        setFriendStatus('accepted');
      } else {
        setFriendStatus('pending');
      }
    } catch {
      setFriendStatus('pending');
    } finally {
      setLoadingFriendAction(false);
    }
  };

  if (!player) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex flex-col items-center justify-center p-6">
        <p className="text-slate-400 mb-4">Perfil de jogador não encontrado.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-neon text-dark-950 font-bold text-sm"
        >
          Voltar
        </button>
      </div>
    );
  }

  const LEGACY_THEME_MAP = {
    'gold-toty': 'card-ouro-pro',
    'thunder-pro': 'card-future-stars-pro',
    'inferno-pro': 'card-fut-red-pro',
  };
  const resolvedThemeId =
    LEGACY_THEME_MAP[player.cardThemeId] || player.cardThemeId;
  const theme =
    CARD_THEMES.find((t) => t.id === resolvedThemeId) ||
    (player.isPro
      ? CARD_THEMES.find((t) => t.id === 'card-ouro-pro') || CARD_THEMES[0]
      : CARD_THEMES[0]);

  const cardPlayer = {
    id: player.id || userId,
    name: player.name || 'Atleta Sport Maker',
    nickname: player.nickname || '',
    role: player.positionRole || player.role || 'Atleta Sport Maker',
    ovr: player.ovr || 78,
    avatar: player.avatar || '',
    avatarScale: player.avatarScale || 100,
    matches: player.matches ?? 0,
    mvpCount: player.mvpCount ?? 0,
    friendsCount: player.friendsCount ?? 0,
    stats: player.stats || {
      ritmo: 76,
      finalizacao: 74,
      passe: 78,
      defesa: 70,
      fisico: 75,
      fairPlay: 90,
    },
    badgesList: player.badgesList || [],
    isPro: Boolean(player.isPro),
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-neon transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-dark-900 border border-white/15 flex items-center justify-center shrink-0">
              {cardPlayer.avatar ? (
                <img
                  src={cardPlayer.avatar}
                  alt={cardPlayer.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <span className="font-display font-black text-xl text-neon">
                  {cardPlayer.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {(player.teamTag || playerTeam?.emblem?.tag) && (
                  <span className="px-2 py-0.5 rounded-lg bg-neon/15 border border-neon/40 text-neon font-display font-black text-xs tracking-wider uppercase">
                    [{player.teamTag || playerTeam?.emblem?.tag}]
                  </span>
                )}
                <h1 className="font-display font-black text-2xl text-white">
                  {cardPlayer.nickname || cardPlayer.name}
                </h1>
                {cardPlayer.isPro && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{cardPlayer.role}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  OVR {cardPlayer.ovr}
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-neon" />
                  {cardPlayer.matches} jogos
                </span>
              </div>
            </div>
          </div>

          <div>
            {friendStatus === 'accepted' ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                <Check className="w-4 h-4" />
                Amigos
              </span>
            ) : friendStatus === 'pending' ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                <Clock className="w-4 h-4" />
                Solicitação Enviada
              </span>
            ) : (
              <button
                type="button"
                onClick={handleAddFriend}
                disabled={loadingFriendAction}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon hover:bg-neon-400 disabled:opacity-60 text-dark-950 font-display font-extrabold text-xs transition shadow-lg"
              >
                <UserPlus className="w-4 h-4" />
                {loadingFriendAction ? 'Enviando...' : 'Adicionar Amigo'}
              </button>
            )}
          </div>
        </div>

        {/* Card do Time do Jogador (clicável para ver elenco e partidas disputadas) */}
        {playerTeam && (
          <button
            type="button"
            onClick={() => setTeamModalOpen(true)}
            className="w-full glass-card rounded-3xl p-5 border border-white/15 hover:border-neon/50 transition-all flex items-center justify-between gap-4 text-left group"
          >
            <div className="flex items-center gap-4">
              <TeamEmblemPreview emblem={playerTeam.emblem} size="sm" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neon block">
                  Time Oficial do Atleta
                </span>
                <h2 className="font-display font-black text-lg sm:text-xl text-white group-hover:text-neon transition-colors flex items-center gap-2">
                  <span>{playerTeam.name}</span>
                  {playerTeam.emblem?.tag && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-neon">
                      [{playerTeam.emblem.tag}]
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {playerTeam.sport} • {(playerTeam.members || []).length} jogadores •{' '}
                  {playerTeam.matchesPlayed ?? 0} partidas disputadas
                </p>
              </div>
            </div>

            <span className="shrink-0 text-xs font-bold text-neon flex items-center gap-1">
              <span className="hidden sm:inline">Ver detalhes</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        )}

        <div className="flex justify-center pt-2">
          <PlayerCard
            player={cardPlayer}
            theme={theme}
            customTag={player.customTag}
          />
        </div>
      </div>

      {/* Modal de Detalhes do Time (Jogadores Participantes & Partidas Disputadas) */}
      {teamModalOpen && playerTeam && (
        <div
          onClick={() => setTeamModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-900 border border-white/15 w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl max-h-[88vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-4">
                <TeamEmblemPreview emblem={playerTeam.emblem} size="sm" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neon">
                    [{playerTeam.emblem?.tag || 'TIME'}] • {playerTeam.sport}
                  </span>
                  <h3 className="font-display font-black text-xl text-white">
                    {playerTeam.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Capitão: <strong className="text-slate-200">{playerTeam.captainName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTeamModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Estatísticas do Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-dark-950 border border-white/10 text-center">
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neon" /> Partidas Disputadas
                </span>
                <p className="font-display font-black text-2xl text-white mt-1">
                  {playerTeam.matchesPlayed ?? 0}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-dark-950 border border-white/10 text-center">
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" /> Jogadores no Elenco
                </span>
                <p className="font-display font-black text-2xl text-emerald-400 mt-1">
                  {(playerTeam.members || []).length}
                </p>
              </div>
            </div>

            {/* Lista de Jogadores Participantes */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-neon" /> Elenco Participante
              </h4>
              <div className="space-y-2">
                {(playerTeam.members || []).map((member) => (
                  <button
                    key={member.userId || member.id}
                    type="button"
                    onClick={() => {
                      setTeamModalOpen(false);
                      if (member.userId) navigate(`/jogador/${member.userId}`);
                    }}
                    className="w-full p-3 rounded-2xl bg-dark-950/90 border border-white/10 hover:border-neon/40 flex items-center justify-between gap-3 text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover border border-neon"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-dark-900 border border-neon flex items-center justify-center font-display font-black text-xs text-neon">
                          {(member.name || 'AT').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {member.isCaptain && (
                            <span className="px-1.5 py-0.5 rounded bg-neon text-dark-950 text-[9px] font-black uppercase">
                              Capitão
                            </span>
                          )}
                        </p>
                        <span className="text-[11px] text-slate-400">
                          {member.sport || 'Atleta'} •{' '}
                          {member.ovr > 0 ? `OVR ${member.ovr}` : 'Sem OVR'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
