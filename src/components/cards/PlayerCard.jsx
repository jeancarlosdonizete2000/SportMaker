import React from 'react';
import { BarChart3, Award } from 'lucide-react';

export default function PlayerCard({ player, theme, customTag }) {
  return (
    <div
      className={`w-full max-w-md rounded-3xl p-6 sm:p-7 bg-gradient-to-b ${theme.gradient} border-2 ${theme.border} ${theme.glow} transition-all duration-500 relative overflow-hidden`}
    >
      {/* Top Card Header: OVR & Badges */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={player.avatar}
              alt={player.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20"
            />
            <span
              className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                player.isPro
                  ? 'bg-amber-400 text-dark-950 shadow-[0_0_12px_rgba(251,191,36,0.7)]'
                  : theme.accentBg
              }`}
            >
              {player.isPro ? '👑 PRO VIP' : 'ATLETA'}
            </span>
          </div>
          <div>
            <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white mb-1">
              {customTag}
            </span>
            <h3 className="font-display font-black text-2xl text-white">
              {player.name}
            </h3>
            {player.nickname && (
              <p className="text-xs font-extrabold text-neon">"{player.nickname}"</p>
            )}
            <p className="text-xs text-slate-300">{player.role}</p>
          </div>
        </div>

        {/* Overall Rating Shield */}
        <div className="text-center bg-dark-950/80 border border-white/15 px-3.5 py-2 rounded-2xl">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
            OVR
          </span>
          <span className={`font-display font-black text-3xl ${theme.accentText}`}>
            {player.ovr}
          </span>
        </div>
      </div>

      {/* Quick Summary Counters */}
      <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
        <div className="bg-dark-950/70 border border-white/10 rounded-xl p-2.5">
          <span className="text-xs text-slate-400 block">Partidas</span>
          <span className="font-display font-extrabold text-lg text-white">
            {player.matches}
          </span>
        </div>
        <div className="bg-dark-950/70 border border-white/10 rounded-xl p-2.5">
          <span className="text-xs text-slate-400 block">Prêmios MVP</span>
          <span className={`font-display font-extrabold text-lg ${theme.accentText}`}>
            {player.mvpCount} 🏆
          </span>
        </div>
        <div className="bg-dark-950/70 border border-white/10 rounded-xl p-2.5">
          <span className="text-xs text-slate-400 block">Amigos</span>
          <span className="font-display font-extrabold text-lg text-white">
            {player.friendsCount}
          </span>
        </div>
      </div>

      {/* Performance Attribute Bars (Voted by Peers) */}
      <div className="space-y-3 mb-6 bg-dark-950/75 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-white flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-neon" /> Atributos Avaliados nas Partidas
          </span>
          <span className="text-emerald-400 font-bold">★ {player.fairPlay} Fair Play</span>
        </div>

        {[
          { label: 'Ritmo & Velocidade', val: player.stats.ritmo },
          { label: 'Finalização / Ataque', val: player.stats.finalizacao },
          { label: 'Visão & Passe', val: player.stats.passe },
          { label: 'Espírito Esportivo (Fair Play)', val: player.stats.fairPlay },
        ].map((stat) => (
          <div key={stat.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">{stat.label}</span>
              <span className="font-bold text-white">{stat.val}/100</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full ${theme.accentBg} transition-all duration-500`}
                style={{ width: `${stat.val}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Unlocked Badges */}
      <div className="flex flex-wrap gap-1.5">
        {player.badgesList.map((badge) => (
          <span
            key={badge}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 flex items-center gap-1"
          >
            <Award className={`w-3.5 h-3.5 ${theme.accentText}`} />
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

