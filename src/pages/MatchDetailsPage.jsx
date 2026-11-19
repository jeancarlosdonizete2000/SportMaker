import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Check,
  X,
  CheckCircle2,
  ShieldCheck,
  Star,
  ShoppingBag,
  Bell,
  Crown,
  ExternalLink,
  XCircle,
  Share2,
  Copy,
  UserPlus,
  MessageCircle,
  Send,
} from 'lucide-react';
import { ownerService } from '../services/ownerService';
import { useAuth } from '../context/AuthContext';
import { isEvaluationUnlocked } from '../utils/matchTimeUtils';

export default function MatchDetailsPage({
  myMatches = [],
  arenas = [],
  onMatchUpdated,
  onCancelMatch,
}) {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialMatch =
    myMatches.find((m) => String(m.id) === String(matchId)) || null;
  const [match, setMatch] = useState(initialMatch);
  const [loading, setLoading] = useState(!initialMatch);
  const [actionUserId, setActionUserId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [friendsList, setFriendsList] = useState(
    () => ownerService.getCachedFriendsData()?.friends || []
  );
  const [invitedFriendIds, setInvitedFriendIds] = useState({});
  const [invitingFriendId, setInvitingFriendId] = useState(null);
  const [joiningMatch, setJoiningMatch] = useState(false);
  const [respondingInvite, setRespondingInvite] = useState(false);

  useEffect(() => {
    ownerService
      .getFriendsData()
      .then((data) => {
        if (data && Array.isArray(data.friends)) {
          setFriendsList(data.friends);
        }
      })
      .catch(() => {});
  }, []);

  const loadMatchDetails = useCallback(async () => {
    if (!matchId || String(matchId).startsWith('book_') || String(matchId).startsWith('my_')) {
      setLoading(false);
      return;
    }
    try {
      const fresh = await ownerService.getMatchById(matchId);
      if (fresh) {
        setMatch(fresh);
        if (onMatchUpdated) onMatchUpdated(fresh);
      }
    } catch {
      // mantém dados locais
    } finally {
      setLoading(false);
    }
  }, [matchId, onMatchUpdated]);

  useEffect(() => {
    loadMatchDetails();
  }, [loadMatchDetails]);

  if (loading && !match) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neon border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="glass-card rounded-3xl p-8 border border-white/10 text-center space-y-4">
        <p className="font-display font-bold text-lg text-white">
          Partida não encontrada.
        </p>
        <button
          onClick={() => navigate('/app/minhas-partidas')}
          className="px-5 py-2.5 rounded-xl bg-neon text-dark-950 font-display font-extrabold text-xs"
        >
          Voltar para Minhas Partidas
        </button>
      </div>
    );
  }

  const isHost =
    String(match.hostId) === String(user?._id) ||
    String(match.role || '').toLowerCase().includes('organizador') ||
    String(match.role || '').toLowerCase().includes('responsável');

  const allParticipants = Array.isArray(match.participants) ? match.participants : [];

  const pendingParticipants = Array.isArray(match.pendingParticipants)
    ? match.pendingParticipants
    : allParticipants.filter(
        (p) =>
          p.requestStatus === 'pending' ||
          String(p.status || '').toLowerCase().includes('aguardando host')
      );

  const approvedParticipants = Array.isArray(match.approvedParticipants)
    ? match.approvedParticipants
    : allParticipants.filter(
        (p) =>
          (p.requestStatus || 'approved') === 'approved' &&
          !String(p.status || '').toLowerCase().includes('aguardando host')
      );

  const linkedArena = arenas.find(
    (a) =>
      (match.arenaId &&
        (String(a._id) === String(match.arenaId) ||
          String(a.id) === String(match.arenaId))) ||
      (match.arena &&
        a.name &&
        match.arena.toLowerCase().includes(a.name.toLowerCase()))
  );

  const handleRespondRequest = async (targetUserId, action) => {
    if (!targetUserId) {
      setErrorMsg('Identificador do atleta não encontrado.');
      return;
    }
    setActionUserId(targetUserId);
    setFeedbackMsg('');
    setErrorMsg('');
    try {
      const res = await ownerService.respondToMatchRequest(
        match.id || match._id,
        targetUserId,
        action
      );
      if (res.match) {
        setMatch(res.match);
        if (onMatchUpdated) onMatchUpdated(res.match);
      }
      if (res.message) {
        setFeedbackMsg(res.message);
        setTimeout(() => setFeedbackMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Não foi possível processar a solicitação.');
    } finally {
      setActionUserId(null);
    }
  };

  const matchShareUrl = `${window.location.origin}/app/partida/${match.id || match._id}`;
  const matchShareText = `Bora jogar! ⚽🔥\n\nPartida: ${match.title}\nLocal: ${match.arena}\nHorário: ${
    match.date || match.time
  }\nValor: R$ ${match.pricePerPlayer || 20},00 / atleta\n\nEntre pelo link do Sport Maker:\n${matchShareUrl}`;

  const handleCopyMatchLink = async () => {
    try {
      await navigator.clipboard.writeText(matchShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      window.prompt('Copie o link da partida:', matchShareUrl);
    }
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(matchShareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sport Maker • ${match.title}`,
          text: matchShareText,
          url: matchShareUrl,
        });
      } catch {
        // cancelado pelo usuário
      }
    } else {
      handleCopyMatchLink();
    }
  };

  const handleInviteFriend = async (friend) => {
    setInvitingFriendId(friend.id);
    setErrorMsg('');
    try {
      await ownerService.inviteFriendToMatch(match.id || match._id, friend.id);
      setInvitedFriendIds((prev) => ({ ...prev, [friend.id]: true }));
      setFeedbackMsg(`Convite enviado para ${friend.name}! Ele receberá na aba Notificações.`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Não foi possível enviar o convite.');
    } finally {
      setInvitingFriendId(null);
    }
  };

  const isAlreadyInMatch =
    isHost ||
    allParticipants.some((p) => String(p.userId) === String(user?._id));

  const handleJoinMatchDirectly = async () => {
    setJoiningMatch(true);
    setErrorMsg('');
    try {
      const res = await ownerService.toggleJoinLobby(match.id || match._id);
      if (res.match) {
        setMatch(res.match);
        if (onMatchUpdated) onMatchUpdated(res.match);
      }
      setFeedbackMsg('Solicitação de entrada enviada ao organizador da partida!');
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao solicitar entrada na partida.');
    } finally {
      setJoiningMatch(false);
    }
  };

  const handleRespondInvite = async (action) => {
    setRespondingInvite(true);
    setErrorMsg('');
    setFeedbackMsg('');
    try {
      const res = await ownerService.respondToMatchInvite(match.id || match._id, action);
      if (res.match) {
        setMatch(res.match);
        if (onMatchUpdated) onMatchUpdated(res.match);
      }
      if (res.message) {
        setFeedbackMsg(res.message);
        setTimeout(() => setFeedbackMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Não foi possível responder ao convite.');
    } finally {
      setRespondingInvite(false);
    }
  };

  const availableFriendsToInvite = friendsList.filter(
    (f) => !allParticipants.some((p) => String(p.userId) === String(f.id))
  );

  const renderAvatar = (person, size = 'w-11 h-11') => {
    if (person?.avatar) {
      return (
        <img
          src={person.avatar}
          alt={person.name}
          className={`${size} rounded-full object-cover border border-neon shrink-0`}
        />
      );
    }
    const initials = (person?.name || 'AT')
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
    return (
      <div
        className={`${size} rounded-full bg-dark-950 border border-neon flex items-center justify-center font-display font-black text-xs text-neon shrink-0`}
      >
        {initials}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/app/minhas-partidas')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-bold text-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-neon" />
          Voltar para Minhas Partidas
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {!isAlreadyInMatch &&
            !String(match.status || '').toLowerCase().includes('cancelad') && (
              <button
                type="button"
                disabled={joiningMatch}
                onClick={handleJoinMatchDirectly}
                className="px-4 py-2.5 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs shadow-neon transition-all flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>{joiningMatch ? 'Enviando...' : 'Solicitar Entrada na Partida'}</span>
              </button>
            )}

          {match.evaluated ? (
            <span className="px-3.5 py-2 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Avaliada ({match.evaluationStars || 5}★)
            </span>
          ) : isEvaluationUnlocked(match) &&
            !String(match.status || '').toLowerCase().includes('cancelad') ? (
            <button
              onClick={() => navigate(`/app/avaliar/${match.id}`)}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-display font-black text-xs transition-all flex items-center gap-1.5"
            >
              <Star className="w-4 h-4 fill-dark-950" />
              <span>Avaliar Partida</span>
            </button>
          ) : null}

          {onCancelMatch && (
            <button
              onClick={() => {
                onCancelMatch(match.id);
                navigate('/app/minhas-partidas');
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>{isHost ? 'Cancelar Partida' : 'Sair da Partida'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Match Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {match.status}
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-neon/15 text-neon border border-neon/30 text-xs font-bold">
              {match.role}
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neon" /> {match.date || match.time}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Valor por Atleta</span>
            <span className="font-display font-black text-2xl text-neon">
              R$ {match.pricePerPlayer || 20},00
            </span>
          </div>
        </div>

        <div>
          <h1 className="font-display font-black text-2xl sm:text-4xl text-white">
            {match.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 mt-1.5">
            <MapPin className="w-4 h-4 text-neon shrink-0" />
            <span>
              {match.arena} • {match.neighborhood || 'Região Verificada'}
            </span>
          </p>
        </div>

        {/* Extras & Products */}
        {match.extras && match.extras.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-neon" /> Detalhes & Produtos:
            </span>
            {match.extras.map((item, idx) => (
              <span
                key={idx}
                className="text-xs px-2.5 py-1 rounded-lg bg-neon/10 text-neon border border-neon/25 font-semibold"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-400/40 text-red-300 text-xs sm:text-sm font-bold flex items-center gap-2">
          <XCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* BANNER DE CONVITE RECEBIDO (PARA O ATLETA CONVIDADO ACEITAR OU RECUSAR A PARTIDA) */}
      {match.isInvited &&
        !isAlreadyInMatch &&
        !String(match.status || '').toLowerCase().includes('cancelad') && (
          <div className="glass-card rounded-3xl p-6 sm:p-7 border-2 border-neon/50 bg-neon/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
                <Bell className="w-4 h-4" /> Convite de Partida Recebido
              </span>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                Você foi convidado para jogar esta partida!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Aceite o convite para garantir sua vaga imediatamente no elenco confirmado ou recuse caso não possa participar.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={respondingInvite}
                onClick={() => handleRespondInvite('accept')}
                className="px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-dark-950 font-display font-extrabold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(52,211,153,0.4)]"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{respondingInvite ? 'Confirmando...' : 'Aceitar Partida'}</span>
              </button>

              <button
                type="button"
                disabled={respondingInvite}
                onClick={() => handleRespondInvite('decline')}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-200 hover:text-red-300 border border-white/15 font-display font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Recusar</span>
              </button>
            </div>
          </div>
        )}

      {/* SEÇÃO DE SOLICITAÇÕES PENDENTES (EXCLUSIVA PARA O ORGANIZADOR ACEITAR OU RECUSAR) */}
      {isHost && (
      <div className="glass-card rounded-3xl p-6 sm:p-8 border-2 border-amber-400/40 bg-amber-400/5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Bell className="w-4 h-4" /> Controle de Entrada na Partida
            </span>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-0.5">
              Solicitações para Entrar na Partida ({pendingParticipants.length})
            </h2>
          </div>

          {pendingParticipants.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-400 text-dark-950 text-xs font-black uppercase">
              {pendingParticipants.length}{' '}
              {pendingParticipants.length === 1
                ? 'Atleta Aguardando'
                : 'Atletas Aguardando'}
            </span>
          )}
        </div>

        {pendingParticipants.length === 0 ? (
          <div className="p-5 rounded-2xl bg-dark-950/80 border border-white/10 text-xs sm:text-sm text-slate-400">
            Nenhuma solicitação pendente no momento. Quando outros jogadores pedirem para entrar no lobby desta partida, eles aparecerão aqui para você aceitar ou recusar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingParticipants.map((person) => (
              <div
                key={person.userId || person._id}
                className="p-4 rounded-2xl bg-dark-950/90 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  {renderAvatar(person)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{person.name}</p>
                      {person.isPro && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-400 text-dark-950 text-[9px] font-black uppercase flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neon font-bold">
                        {person.ovr > 0 ? `OVR ${person.ovr}` : 'Sem OVR'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-300 mt-0.5">
                      Solicitou entrada nesta partida
                    </p>
                  </div>
                </div>

                {isHost ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={actionUserId === (person.userId || person._id)}
                      onClick={() =>
                        handleRespondRequest(person.userId || person._id, 'accept')
                      }
                      className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-dark-950 text-xs font-display font-extrabold transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.35)]"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Aceitar</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionUserId === (person.userId || person._id)}
                      onClick={() =>
                        handleRespondRequest(person.userId || person._id, 'reject')
                      }
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Recusar</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-amber-300">
                    Aguardando aprovação do Host
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* GRID: JOGADORES CONFIRMADOS + DETALHES DA ARENA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Jogadores Confirmados na Partida */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 border border-white/15 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Elenco da Partida
              </span>
              <h3 className="font-display font-black text-xl text-white mt-0.5">
                Jogadores Confirmados ({approvedParticipants.length}/{match.totalSlots || 14})
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-neon/15 text-neon text-xs font-extrabold">
              {(match.totalSlots || 14) - approvedParticipants.length} vagas livres
            </span>
          </div>

          {approvedParticipants.length === 0 ? (
            <div className="p-4 rounded-2xl bg-dark-950 border border-white/10 flex items-center gap-3">
              {renderAvatar({ name: match.host?.name || user?.name, avatar: match.host?.avatar || user?.avatar })}
              <div>
                <p className="text-sm font-bold text-white">
                  {match.host?.name || user?.name || 'Organizador da Partida'}
                </p>
                <span className="text-xs text-neon font-semibold">
                  Organizador (Host) • Confirmado
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {approvedParticipants.map((player, idx) => {
                const isPlayerHost = String(player.userId) === String(match.hostId) || idx === 0;
                return (
                  <div
                    key={player.userId || idx}
                    className="p-3.5 rounded-2xl bg-dark-950/90 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {renderAvatar(player)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">{player.name}</p>
                          {isPlayerHost && (
                            <span className="px-2 py-0.5 rounded bg-neon text-dark-950 text-[10px] font-black uppercase">
                              Host
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neon font-bold">
                            {player.ovr > 0 ? `OVR ${player.ovr}` : 'Sem OVR'}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-400">
                          {isPlayerHost ? 'Organizador da Partida' : 'Atleta Confirmado'}
                        </p>
                      </div>
                    </div>

                    {isHost && !isPlayerHost && (
                      <button
                        type="button"
                        disabled={actionUserId === (player.userId || player._id)}
                        onClick={() =>
                          handleRespondRequest(player.userId || player._id, 'reject')
                        }
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 text-xs font-bold transition-all"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalhes da Arena da Partida */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-white/15 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Local do Jogo
              </span>
              <h3 className="font-display font-black text-xl text-white mt-0.5 flex items-center gap-1.5">
                <span>{linkedArena?.name || match.arena}</span>
                <ShieldCheck className="w-5 h-5 text-neon shrink-0" />
              </h3>
            </div>

            {linkedArena?.image && (
              <div className="h-44 rounded-2xl overflow-hidden border border-white/10">
                <img
                  src={linkedArena.image}
                  alt={linkedArena.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                <strong className="text-white">Quadra / Espaço:</strong> {match.arena}
              </p>
              <p>
                <strong className="text-white">Endereço / Bairro:</strong>{' '}
                {linkedArena?.address || match.neighborhood || 'Local Verificado'}
              </p>
              <p>
                <strong className="text-white">Horário Agendado:</strong>{' '}
                <span className="text-neon font-bold">{match.date || match.time}</span>
              </p>
            </div>
          </div>

          {linkedArena && (
            <button
              type="button"
              onClick={() => navigate(`/app/arena/${linkedArena.id || linkedArena._id}`)}
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-neon hover:text-dark-950 text-white font-display font-extrabold text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Ver Página Completa da Arena</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SEÇÃO: CONVIDAR JOGADORES (LINK EXTERNO, WHATSAPP, COPIAR URL E AMIGOS) */}
      {!String(match.status || '').toLowerCase().includes('cancelad') && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
              <Share2 className="w-4 h-4" /> Convocar Atletas para o Jogo
            </span>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-0.5">
              Convidar Jogadores
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Envie o convite direto para seus amigos da plataforma ou compartilhe o link da partida no WhatsApp e redes sociais.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Link Externo, WhatsApp & Copiar URL */}
            <div className="lg:col-span-6 p-5 rounded-2xl bg-dark-950/80 border border-white/10 space-y-4">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-neon" /> Compartilhar por Link Externo
              </h3>

              <div className="flex items-center gap-2 bg-dark-900 border border-white/10 rounded-xl p-1.5">
                <input
                  type="text"
                  readOnly
                  value={matchShareUrl}
                  onFocus={(e) => e.target.select()}
                  className="w-full bg-transparent px-2.5 text-xs text-slate-300 focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyMatchLink}
                  className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-display font-extrabold transition-all flex items-center gap-1.5 ${
                    copiedLink
                      ? 'bg-emerald-400 text-dark-950'
                      : 'bg-neon hover:bg-neon-400 text-dark-950'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar URL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-display font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chamar no WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-display font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-neon" />
                  <span>Compartilhar Link</span>
                </button>
              </div>
            </div>

            {/* Convidar Amigos da Plataforma */}
            <div className="lg:col-span-6 p-5 rounded-2xl bg-dark-950/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-neon" /> Convidar Amigos ({availableFriendsToInvite.length})
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/app/amigos')}
                  className="text-[11px] font-bold text-neon hover:underline"
                >
                  Ver Amigos →
                </button>
              </div>

              {availableFriendsToInvite.length === 0 ? (
                <div className="p-4 rounded-xl bg-dark-900/70 border border-white/5 text-xs text-slate-400">
                  {friendsList.length === 0
                    ? 'Você ainda não tem amigos adicionados. Adicione atletas na aba Amigos ou compartilhe o link ao lado!'
                    : 'Todos os seus amigos já estão nesta partida.'}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {availableFriendsToInvite.map((friend) => {
                    const isInvited = Boolean(invitedFriendIds[friend.id]);
                    return (
                      <div
                        key={friend.id}
                        className="p-2.5 rounded-xl bg-dark-900 border border-white/10 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {renderAvatar(friend, 'w-9 h-9')}
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">
                              {friend.name}
                            </p>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {friend.sport || 'Atleta'} •{' '}
                              {friend.ovr > 0 ? `OVR ${friend.ovr}` : 'Sem OVR'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isInvited || invitingFriendId === friend.id}
                          onClick={() => handleInviteFriend(friend)}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-display font-extrabold transition-all flex items-center gap-1 ${
                            isInvited
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-neon hover:bg-neon-400 text-dark-950'
                          }`}
                        >
                          {isInvited ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Convidado</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              <span>
                                {invitingFriendId === friend.id ? 'Enviando...' : 'Convidar'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
