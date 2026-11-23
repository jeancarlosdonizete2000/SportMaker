import React from 'react';
import { AlertTriangle, Calendar, MapPin, X, XCircle } from 'lucide-react';

export default function CancelMatchModal({
  match,
  isHost,
  loading = false,
  errorMsg = '',
  onClose,
  onConfirm,
}) {
  if (!match) return null;

  return (
    <div
      data-modal-overlay="true"
      onClick={() => !loading && onClose()}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-dark-900 border border-red-500/40 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 block">
                Confirmação Obrigatória
              </span>
              <h3 className="font-display font-black text-xl text-white">
                {isHost ? 'Cancelar Partida?' : 'Sair da Partida?'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-dark-950 border border-white/10 space-y-2">
          <p className="font-display font-extrabold text-sm text-white">
            {match.title}
          </p>
          <p className="text-xs text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-neon shrink-0" />
            <span>{match.arena}</span>
          </p>
          <p className="text-xs text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neon shrink-0" />
            <span>{match.date || match.time}</span>
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {isHost
            ? 'Tem certeza que deseja cancelar esta partida? Todos os participantes serão notificados automaticamente, o horário voltará a ficar disponível na arena (se dentro do prazo permitido) e a partida será movida para a aba Canceladas.'
            : 'Tem certeza que deseja sair desta partida? Sua vaga será liberada para outros jogadores.'}
        </p>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold flex items-start gap-2">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-display font-bold text-xs sm:text-sm transition-all"
          >
            Voltar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="py-3 px-4 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white font-display font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(239,68,68,0.35)] transition-all"
          >
            {loading
              ? isHost
                ? 'Cancelando...'
                : 'Saindo...'
              : isHost
                ? 'Sim, Cancelar'
                : 'Sim, Sair'}
          </button>
        </div>
      </div>
    </div>
  );
}
