import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Trophy,
  Flame,
  Shield,
  Award,
  Sparkles,
  CheckCircle2,
  Crown,
  Zap,
} from 'lucide-react';
import { FRIENDS_DATA } from '../data/mockData';
import { MONGO_CONFIG } from '../services/mongoClient';

const ARENA_TIERS = [
  {
    stars: 5,
    title: 'Padrão Série A',
    subtitle: 'Estrutura impecável, gramado/areia top e vestiário VIP!',
    badge: '5 Estrelas • Elite',
    color: 'border-amber-400 bg-amber-400/15 text-amber-300',
  },
  {
    stars: 4,
    title: 'Arena Top',
    subtitle: 'Muito boa de jogar, iluminação e piso excelentes.',
    badge: '4 Estrelas • Muito Boa',
    color: 'border-emerald-400 bg-emerald-400/15 text-emerald-300',
  },
  {
    stars: 3,
    title: 'Dá pro Gasto',
    subtitle: 'Cumpre o papel, mas tem pontos que podem melhorar.',
    badge: '3 Estrelas • Regular',
    color: 'border-sky-400 bg-sky-400/15 text-sky-300',
  },
  {
    stars: 2,
    title: 'Campo Pesado',
    subtitle: 'Piso desgastado ou estrutura básica abaixo do esperado.',
    badge: '2 Estrelas • Abaixo',
    color: 'border-orange-400 bg-orange-400/15 text-orange-300',
  },
  {
    stars: 1,
    title: 'Terrão',
    subtitle: 'Precisa de reforma urgente no piso e na estrutura.',
    badge: '1 Estrela • Crítico',
    color: 'border-red-400 bg-red-400/15 text-red-300',
  },
];

const PLAYER_BADGES = [
  { id: 'artilheiro', label: 'Artilheiro', icon: Flame },
  { id: 'paredao', label: 'Paredão', icon: Shield },
  { id: 'garcom', label: 'Garçom', icon: Zap },
  { id: 'fairplay', label: 'Fair Play', icon: Award },
];

function getScoreTheme(score) {
  if (score >= 9) {
    return {
      text: 'text-amber-300',
      badge: 'bg-amber-400/20 text-amber-300 border-amber-400/50',
      bar: 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500',
      label: 'Craque / Dourado',
    };
  }
  if (score >= 7) {
    return {
      text: 'text-emerald-300',
      badge: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/50',
      bar: 'bg-gradient-to-r from-sky-400 via-emerald-400 to-neon',
      label: 'Muito Bem',
    };
  }
  if (score >= 4.5) {
    return {
      text: 'text-sky-300',
      badge: 'bg-sky-400/20 text-sky-300 border-sky-400/50',
      bar: 'bg-gradient-to-r from-orange-400 via-sky-400 to-blue-500',
      label: 'Regular',
    };
  }
  if (score >= 2.5) {
    return {
      text: 'text-orange-300',
      badge: 'bg-orange-400/20 text-orange-300 border-orange-400/50',
      bar: 'bg-gradient-to-r from-red-500 to-orange-400',
      label: 'Abaixo',
    };
  }
  return {
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-500/50',
    bar: 'bg-gradient-to-r from-red-600 to-rose-500',
    label: 'Crítico',
  };
}

export default function MatchEvaluationPage({ myMatches = [], onEvaluationComplete }) {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const match =
    myMatches.find((m) => String(m.id) === String(matchId)) || myMatches[0];

  const [arenaStars, setArenaStars] = useState(5);
  const [arenaComment, setArenaComment] = useState('');
  const [mvpPlayerId, setMvpPlayerId] = useState(FRIENDS_DATA[0].id);

  // Notas de 0 a 10 e emblemas por jogador
  const [playerEvaluations, setPlayerEvaluations] = useState(() =>
    FRIENDS_DATA.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      sport: p.sport,
      ovr: p.ovr,
      score: 8.5,
      badges: ['artilheiro'],
    }))
  );

  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  const selectedTier =
    ARENA_TIERS.find((t) => t.stars === arenaStars) || ARENA_TIERS[0];

  const handleScoreChange = (playerId, newScore) => {
    const parsed = Number(newScore);
    setPlayerEvaluations((prev) => {
      const updated = prev.map((p) =>
        p.id === playerId ? { ...p, score: parsed } : p
      );
      // Atualiza automaticamente o selo de MVP para o jogador com a maior nota
      const highest = updated.reduce((best, curr) =>
        curr.score > best.score ? curr : best
      , updated[0]);
      if (highest) {
        setMvpPlayerId(highest.id);
      }
      return updated;
    });
  };

  const handleToggleBadge = (playerId, badgeLabel) => {
    setPlayerEvaluations((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        const exists = p.badges.includes(badgeLabel);
        return {
          ...p,
          badges: exists
            ? p.badges.filter((b) => b !== badgeLabel)
            : [...p.badges, badgeLabel],
        };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${MONGO_CONFIG.restApiUrl}/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match?.id,
          arenaName: match?.arena,
          arenaStars,
          arenaTierLabel: selectedTier.title,
          arenaComment,
          mvpPlayerId,
          playerRatings: playerEvaluations,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (onEvaluationComplete && match?.id) {
        onEvaluationComplete(match.id, {
          arenaStars,
          arenaTierLabel: selectedTier.title,
          mvpPlayerId,
        });
      }

      setSubmittedResult({
        arenaStars,
        arenaTier: selectedTier.title,
        mvpName:
          playerEvaluations.find((p) => p.id === mvpPlayerId)?.name ||
          'Craque da Partida',
        updatedArena: data.updatedArena,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedResult) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="glass-card rounded-3xl p-8 border border-emerald-400/40 text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-emerald-400/20 border border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-neon/15 text-neon text-xs font-black uppercase tracking-wider">
              Avaliação Computada no Perfil
            </span>
            <h2 className="font-display font-black text-3xl text-white">
              Notas & Craque Registrados!
            </h2>
            <p className="text-sm text-slate-300">
              A nota da arena (<strong>{submittedResult.arenaStars}★ • {submittedResult.arenaTier}</strong>) e as notas de 0 a 10 dos jogadores foram computadas aos respectivos perfis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-dark-950 border border-white/10">
              <span className="text-[11px] text-slate-400 block">Perfil da Arena</span>
              <p className="text-sm font-bold text-amber-400 mt-0.5">
                {match?.arena} • {submittedResult.arenaStars} Estrelas
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-dark-950 border border-white/10">
              <span className="text-[11px] text-slate-400 block">Craque Eleito (MVP)</span>
              <p className="text-sm font-bold text-neon mt-0.5">
                👑 {submittedResult.mvpName}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/app/minhas-partidas')}
            className="px-7 py-3.5 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-black text-sm transition-all"
          >
            Voltar para Minhas Partidas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Back */}
      <button
        onClick={() => navigate('/app/minhas-partidas')}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-all"
      >
        <ArrowLeft className="w-4 h-4 text-neon" />
        Voltar para Minhas Partidas
      </button>

      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-dark-900 to-dark-950 space-y-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Sparkles className="w-4 h-4" /> Pós-Jogo Oficial Sport Maker
        </span>
        <h1 className="font-display font-black text-2xl sm:text-4xl text-white">
          Avalie Como Foi Sua Partida
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Partida: <strong className="text-white">{match?.title || 'Partida Oficial'}</strong> •{' '}
          <span className="text-neon">{match?.arena}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: SOBRE A ARENA */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                1. Sobre a Arena
              </span>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                Qual foi o nível da quadra e estrutura?
              </h2>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  onClick={() => setArenaStars(s)}
                  className={`w-7 h-7 cursor-pointer transition-transform duration-200 hover:scale-125 ${
                    s <= arenaStars
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {ARENA_TIERS.map((tier) => {
              const active = arenaStars === tier.stars;
              return (
                <button
                  key={tier.stars}
                  type="button"
                  onClick={() => setArenaStars(tier.stars)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between space-y-2 ${
                    active
                      ? `${tier.color} scale-[1.03] shadow-xl`
                      : 'bg-dark-950/80 border-white/10 text-slate-300 hover:border-white/30 hover:-translate-y-1'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-lg">
                      {tier.stars}★
                    </span>
                    {active && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-white">
                      {tier.title}
                    </p>
                    <p className="text-[11px] opacity-80 leading-snug mt-1">
                      {tier.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={arenaComment}
            onChange={(e) => setArenaComment(e.target.value)}
            placeholder="Deixe um comentário opcional sobre o gramado/areia, iluminação ou atendimento..."
            className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* SECTION 2: VOTE NO CRAQUE DA PARTIDA & NOTA 0 A 10 */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
              <Crown className="w-4 h-4" /> 2. Vote no Craque da Partida & Avalie os Jogadores
            </span>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-0.5">
              Distribua Títulos (Artilheiro, Paredão) e Notas de 0 a 10
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {playerEvaluations.map((player) => {
              const isMvp = mvpPlayerId === player.id;
              return (
                <div
                  key={player.id}
                  className={`p-5 rounded-3xl border transition-all duration-300 space-y-4 ${
                    isMvp
                      ? 'bg-amber-400/10 border-amber-400 shadow-xl'
                      : 'bg-dark-950/90 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className={`w-12 h-12 rounded-full object-cover border-2 ${
                          isMvp ? 'border-amber-400' : 'border-neon'
                        }`}
                      />
                      <div>
                        <p className="font-display font-bold text-base text-white">
                          {player.name}
                        </p>
                        <span className="text-[11px] text-slate-400">
                          {player.sport} • OVR Atual: <strong className="text-neon">{player.ovr}</strong>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMvpPlayerId(player.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all ${
                        isMvp
                          ? 'bg-amber-400 text-dark-950 scale-105'
                          : 'bg-white/5 text-slate-300 hover:bg-amber-400/20 hover:text-amber-300'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      {isMvp ? 'Craque (MVP)' : 'Votar Craque'}
                    </button>
                  </div>

                  {/* Badges: Artilheiro, Paredão, Garçom, Fair Play */}
                  <div className="flex flex-wrap gap-1.5">
                    {PLAYER_BADGES.map((b) => {
                      const Icon = b.icon;
                      const selected = player.badges.includes(b.label);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => handleToggleBadge(player.id, b.label)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all ${
                            selected
                              ? 'bg-neon text-dark-950 border-neon'
                              : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/25'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {b.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Nota de 0 a 10 com Barra Animada em Gradiente */}
                  {(() => {
                    const theme = getScoreTheme(player.score);
                    const pct = Math.min(100, Math.max(0, (player.score / 10) * 100));
                    return (
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-semibold">
                            Nota da Partida (0 a 10):
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all duration-300 ${theme.badge}`}
                            >
                              {theme.label}
                            </span>
                            <span
                              className={`font-display font-black text-xl transition-colors duration-300 ${theme.text}`}
                            >
                              {player.score.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className="relative h-3.5 rounded-full bg-dark-900 border border-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ease-out ${theme.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={player.score}
                            onChange={(e) => handleScoreChange(player.id, e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-display font-black text-sm sm:text-base transition-all flex items-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            {submitting
              ? 'Computando Notas...'
              : 'Enviar Avaliação & Atualizar Perfis'}
          </button>
        </div>
      </form>
    </div>
  );
}

