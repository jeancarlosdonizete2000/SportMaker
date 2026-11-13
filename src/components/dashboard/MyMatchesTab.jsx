import React from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

export default function MyMatchesTab({
  myMatches,
  onOpenCreateMatch,
  onCancelMatch,
}) {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> Agenda Pessoal do Atleta
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
            Minhas Partidas ({myMatches.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Acompanhe suas reservas de arena, partidas que você organizou e solicitações de entrada em lobbies públicos.
          </p>
        </div>

        <button
          onClick={() => navigate('/app/arenas')}
          className="shrink-0 px-5 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Agendar / Criar Partida
        </button>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {myMatches.map((match) => {
          const isPending = match.status.toLowerCase().includes('solicita');
          return (
            <div
              key={match.id}
              className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      isPending
                        ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isPending ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {match.status}
                  </span>

                  <span className="px-2.5 py-1 rounded-lg bg-white/5 text-xs font-semibold text-neon border border-white/10">
                    {match.role}
                  </span>

                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neon" /> {match.date}
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-xl text-white">
                  {match.title}
                </h3>

                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neon" /> {match.arena} •{' '}
                  {match.neighborhood || 'Região Verificada'}
                </p>

                {match.extras && match.extras.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-neon" /> Produtos inclusos:
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
                  {!isPending && (
                    match.evaluated ? (
                      <span className="px-3.5 py-2 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        Avaliada ({match.evaluationStars || 5}★)
                      </span>
                    ) : (
                      <button
                        onClick={() => navigate(`/app/avaliar/${match.id}`)}
                        className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 text-xs font-display font-black transition-all flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 fill-dark-950" />
                        <span>Avalie como foi sua partida</span>
                      </button>
                    )
                  )}

                  <button
                    onClick={() => onCancelMatch(match.id)}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancelar / Sair</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

