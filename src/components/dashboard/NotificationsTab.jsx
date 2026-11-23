import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  CheckCheck,
  Wallet,
  Calendar,
  MapPin,
  CheckCircle2,
  UserPlus,
  ChevronRight,
} from 'lucide-react';

export default function NotificationsTab({
  notifications = [],
  onMarkRead,
  onMarkAllRead,
}) {
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoDate));
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
            <Bell className="w-4 h-4" /> Central de Avisos do Atleta
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
            Notificações {unreadCount > 0 && `(${unreadCount} novas)`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Acompanhe avisos de cancelamento de partidas pela arena, status de reembolsos e atualizações importantes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-neon hover:text-dark-950 text-white font-display font-extrabold text-xs transition-all flex items-center gap-2 border border-white/15"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <Bell className="w-6 h-6" />
          </div>
          <p className="font-display font-bold text-lg text-white">
            Você não possui notificações no momento.
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Quando houver cancelamento de reserva pela arena, informações sobre reembolso ou novidades das suas partidas, elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {notifications.map((notif) => {
            const isCancelled = notif.type === 'match_cancelled';
            const isJoinRequest = notif.type === 'match_join_request';
            const isMatchInvite = notif.type === 'match_invite';
            const isPaymentRequired = notif.type === 'match_payment_required';
            const isRequestAccepted = notif.type === 'match_request_accepted';
            const hasMatchAction = Boolean(
              notif.matchId &&
                (isJoinRequest ||
                  isMatchInvite ||
                  isPaymentRequired ||
                  isRequestAccepted ||
                  notif.type === 'match_payment_confirmed' ||
                  notif.type === 'match_full')
            );
            return (
              <div
                key={notif.id || notif._id}
                onClick={() => {
                  if (!notif.read && onMarkRead) onMarkRead(notif.id || notif._id);
                  if (hasMatchAction) {
                    navigate(`/app/partida/${notif.matchId}`);
                  }
                }}
                className={`glass-card rounded-3xl p-5 sm:p-6 border transition-all cursor-pointer ${
                  !notif.read
                    ? isCancelled
                      ? 'border-red-500/50 bg-red-500/10'
                      : isJoinRequest
                      ? 'border-amber-400/50 bg-amber-400/10'
                      : 'border-neon/40 bg-neon/5'
                    : 'border-white/10 opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isCancelled
                          ? 'bg-red-500/20 border-red-500/40 text-red-400'
                          : isJoinRequest
                          ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                          : 'bg-neon/15 border-neon/30 text-neon'
                      }`}
                    >
                      {isCancelled ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : isJoinRequest || isMatchInvite ? (
                        <UserPlus className="w-5 h-5" />
                      ) : (
                        <Bell className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {!notif.read && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isJoinRequest
                                ? 'bg-amber-400 text-dark-950'
                                : isMatchInvite
                                ? 'bg-neon text-dark-950'
                                : 'bg-red-500 text-white'
                            }`}
                          >
                            Nova
                          </span>
                        )}
                        <h3 className="font-display font-extrabold text-base sm:text-lg text-white">
                          {notif.title}
                        </h3>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {notif.message}
                      </p>

                      {(notif.arenaName || notif.dateLabel || notif.refundAmount > 0 || ((isJoinRequest || isMatchInvite) && notif.matchId)) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {notif.arenaName && (
                            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-neon" /> {notif.arenaName}
                            </span>
                          )}
                          {(notif.dateLabel || notif.slotTime) && (
                            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-neon" /> {notif.dateLabel}{' '}
                              {notif.slotTime ? `• ${notif.slotTime}` : ''}
                            </span>
                          )}
                          {isCancelled && (
                            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold flex items-center gap-1">
                              <Wallet className="w-3 h-3" />
                              {notif.refundAmount > 0
                                ? `Reembolso de R$ ${notif.refundAmount},00 garantido`
                                : 'Reembolso integral garantido'}
                            </span>
                          )}
                          {hasMatchAction && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!notif.read && onMarkRead) onMarkRead(notif.id || notif._id);
                                navigate(`/app/partida/${notif.matchId}`);
                              }}
                              className={`text-[11px] px-3 py-1 rounded-lg font-display font-extrabold flex items-center gap-1 transition-all ${
                                isPaymentRequired
                                  ? 'bg-amber-400 hover:bg-amber-300 text-dark-950'
                                  : 'bg-neon hover:bg-neon-400 text-dark-950'
                              }`}
                            >
                              <span>
                                {isPaymentRequired
                                  ? 'Realizar Pagamento'
                                  : isMatchInvite
                                    ? 'Ver Partida e Participar'
                                    : isJoinRequest
                                      ? 'Ver e Responder Solicitação'
                                      : 'Ver Partida'}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400">
                      {formatDate(notif.createdAt)}
                    </span>
                    {notif.read ? (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Lida
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onMarkRead) onMarkRead(notif.id || notif._id);
                        }}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all"
                      >
                        Marcar como lida
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
