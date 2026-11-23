import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import {
  isEvaluationUnlocked,
  isMatchEnded,
  isEvaluationClosed,
} from '../../utils/matchTimeUtils';
import {
  Calendar,
  MapPin,
  Users,
  ShoppingBag,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  Bell,
  ChevronRight,
} from 'lucide-react';

export function getMatchCategory(match) {
  const statusLower = (match?.status || '').toLowerCase();
  const isCancelled = statusLower.includes('cancelad');
  if (isCancelled) return 'cancelled';

  return isMatchEnded(match) ? 'played' : 'upcoming';
}

export function getMatchViewKey(match) {
  return `${match?.id}:${getMatchCategory(match)}`;
}

export default function MyMatchesTab({
  myMatches,
  onCancelMatch,
  viewedMatchKeys = {},
  onMarkMatchViewed,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');

  const categorizedMatches = useMemo(() => {
    const upcoming = [];
    const played = [];
    const cancelled = [];

    (myMatches || []).forEach((match) => {
      const cat = getMatchCategory(match);
      if (cat === 'cancelled') {
        cancelled.push(match);
      } else if (cat === 'played') {
        played.push(match);
      } else {
        upcoming.push(match);
      }
    });

    return { upcoming, played, cancelled };
  }, [myMatches]);

  const countUnread = (list) =>
    list.filter((m) => !viewedMatchKeys[getMatchViewKey(m)]).length;

  const tabs = [
    {
      id: 'upcoming',
      label: 'Futuras',
      unreadCount: countUnread(categorizedMatches.upcoming),
      icon: Calendar,
    },
    {
      id: 'played',
      label: 'Jogadas',
      unreadCount: countUnread(categorizedMatches.played),
      icon: CheckCircle2,
    },
    {
      id: 'cancelled',
      label: 'Canceladas',
      unreadCount: countUnread(categorizedMatches.cancelled),
      icon: XCircle,
    },
  ];

  const displayedMatches = categorizedMatches[activeTab] || [];

  const handleOpenMatch = (match, targetPath = `/app/partida/${match.id}`) => {
    if (onMarkMatchViewed) {
      onMarkMatchViewed(getMatchViewKey(match));
    }
    navigate(targetPath);
  };

  const emptyMessages = {
    upcoming: {
      title: 'Você não possui partidas futuras agendadas.',
      desc: 'Reserve um horário nas Arenas ou solicite entrada em um Lobby Público para começar a jogar!',
    },
    played: {
      title: 'Nenhuma partida jogada até o momento.',
      desc: 'Suas partidas concluídas e avaliadas aparecerão aqui.',
    },
    cancelled: {
      title: 'Nenhuma partida cancelada.',
      desc: 'Partidas desmarcadas ou canceladas ficam registradas nesta aba.',
    },
  };

  return (
    <div className="space-y-6">
      {/* Navegação por Abas: Futuras, Jogadas e Canceladas com animação deslizante Motion */}
      <div className="glass-card rounded-2xl p-1.5 border border-white/15 grid grid-cols-3 gap-1.5 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative z-10 py-2.5 px-3 rounded-xl font-display font-extrabold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 ${
                isActive
                  ? 'text-dark-950'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="myMatchesActiveTabBar"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-neon shadow-neon -z-10"
                />
              )}
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                    isActive
                      ? 'bg-dark-950 text-neon'
                      : 'bg-neon text-dark-950 shadow-[0_0_8px_rgba(204,255,0,0.45)]'
                  }`}
                >
                  {tab.unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Matches List */}
      {displayedMatches.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 border border-white/10 text-center space-y-3">
          <p className="font-display font-bold text-lg text-white">
            {emptyMessages[activeTab].title}
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {emptyMessages[activeTab].desc}
          </p>
          {activeTab === 'upcoming' && (
            <button
              onClick={() => navigate('/app/arenas')}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs shadow-neon transition-all"
            >
              <Plus className="w-4 h-4" />
              Explorar Arenas Disponíveis
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedMatches.map((match) => {
            const statusLower = (match.status || '').toLowerCase();
            const isPending = statusLower.includes('solicita');
            const isCancelled = statusLower.includes('cancelad');
            const isPlayed = activeTab === 'played';
            const isUnread = !viewedMatchKeys[getMatchViewKey(match)];
            const isHost =
              (user?._id && String(match.hostId) === String(user._id)) ||
              String(match.role || '').toLowerCase().includes('organizador') ||
              String(match.role || '').toLowerCase().includes('responsável');
            const pendingRequestsCount = isHost
              ? match.pendingRequestsCount ??
                (match.pendingParticipants ? match.pendingParticipants.length : 0)
              : 0;

            return (
              <div
                key={match.id}
                onClick={() => handleOpenMatch(match)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleOpenMatch(match);
                  }
                }}
                className={`glass-card rounded-3xl p-5 sm:p-6 border transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  isCancelled
                    ? 'border-red-500/40 bg-red-500/5 hover:border-red-400/60'
                    : isUnread
                      ? 'border-neon/50 bg-neon/[0.03] hover:border-neon'
                      : 'border-white/10 hover:border-neon/40'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {isUnread && (
                      <span className="px-2 py-0.5 rounded-full bg-neon text-dark-950 text-[10px] font-display font-black uppercase tracking-wider flex items-center gap-1 shadow-neon">
                        <span className="w-1.5 h-1.5 rounded-full bg-dark-950 animate-ping" />
                        Nova
                      </span>
                    )}

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isCancelled
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : isPending
                            ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isCancelled ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : isPending ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {isPlayed && !isCancelled ? 'Partida Encerrada' : match.status}
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-white/5 text-xs font-semibold text-neon border border-white/10">
                      {match.role}
                    </span>

                    <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neon" /> {match.date}
                    </span>

                    {pendingRequestsCount > 0 && !isCancelled && (
                      <span className="px-3 py-1 rounded-full bg-amber-400 text-dark-950 text-xs font-display font-black flex items-center gap-1.5 shadow-lg animate-pulse">
                        <Bell className="w-3.5 h-3.5 fill-dark-950" />
                        {pendingRequestsCount}{' '}
                        {pendingRequestsCount === 1
                          ? 'solicitação para aceitar'
                          : 'solicitações para aceitar'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-extrabold text-xl text-white group-hover:text-neon transition-colors flex items-center gap-2">
                    <span>{match.title}</span>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-neon group-hover:translate-x-0.5 transition-all" />
                  </h3>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neon" /> {match.arena} •{' '}
                    {match.neighborhood || 'Região Verificada'}
                  </p>

                  {match.extras && match.extras.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-neon" /> Detalhes / Extras:
                      </span>
                      {match.extras.map((item) => (
                        <span
                          key={item}
                          className="text-[11px] px-2.5 py-0.5 rounded-md bg-neon/10 text-neon border border-neon/25 font-semibold"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-row lg:flex-col items-center sm:justify-between lg:items-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
                  <div className="text-left lg:text-right">
                    <span className="text-xs text-slate-400 flex items-center lg:justify-end gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-400" /> Atletas: {match.playersCount}
                    </span>
                    <span className="font-display font-black text-xl text-white block">
                      R$ {match.pricePerPlayer},00{' '}
                      <span className="text-xs font-normal text-slate-400">/ pessoa</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenMatch(match);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-display font-extrabold transition-all flex items-center gap-1.5 ${
                        pendingRequestsCount > 0 && !isCancelled
                          ? 'bg-neon text-dark-950 shadow-neon hover:bg-neon-400'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        {pendingRequestsCount > 0 && !isCancelled
                          ? `Gerenciar Solicitações (${pendingRequestsCount})`
                          : 'Ver Detalhes e Jogadores'}
                      </span>
                    </button>

                    {!isPending && !isCancelled && (
                      match.evaluated ? (
                        <span className="px-3.5 py-2 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          Avaliada ({match.evaluationStars || 5}★)
                        </span>
                      ) : isEvaluationUnlocked(match) && isEvaluationClosed(match) ? (
                        <span className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Avaliação Encerrada
                        </span>
                      ) : isEvaluationUnlocked(match) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenMatch(match, `/app/avaliar/${match.id}`);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 text-xs font-display font-black transition-all flex items-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5 fill-dark-950" />
                          <span>Avalie como foi sua partida</span>
                        </button>
                      ) : null
                    )}

                    {!isCancelled && !isPlayed && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelMatch(match.id);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar / Sair</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
