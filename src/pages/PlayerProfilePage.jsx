import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock, ShieldCheck, Trophy, UserPlus } from 'lucide-react';
import PlayerCard from '../components/cards/PlayerCard';
import { CARD_THEMES } from '../data/mockData';
import { MONGO_CONFIG } from '../services/mongoClient';
import { ownerService } from '../services/ownerService';

export default function PlayerProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const statePlayer = location.state?.player || null;

  const [player, setPlayer] = useState(statePlayer);
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

        <div className="flex justify-center pt-2">
          <PlayerCard
            player={cardPlayer}
            theme={theme}
            customTag={player.customTag}
            enableDownload
          />
        </div>
      </div>
    </div>
  );
}
