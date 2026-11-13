import React, { useState, useRef } from 'react';
import { Trophy, SlidersHorizontal } from 'lucide-react';
import { PLAYER_ARCHETYPES, CARD_THEMES } from '../../data/mockData';
import PlayerCard from '../cards/PlayerCard';
import VariableProximity from '../ui/VariableProximity';

const CUSTOM_TAGS = [
  'Capitão & Artilheiro',
  'Rei do 3º Tempo 🍻',
  'Paredão Invicto 🛡️',
  '100% Fair Play 🤝',
];

export default function PlayerProfileSection() {
  const titleRef = useRef(null);
  const [activeArchetypeIndex, setActiveArchetypeIndex] = useState(0);
  const [activeThemeIndex, setActiveThemeIndex] = useState(0);
  const [customTag, setCustomTag] = useState(CUSTOM_TAGS[0]);

  const currentPlayer = PLAYER_ARCHETYPES[activeArchetypeIndex];
  const currentTheme = CARD_THEMES[activeThemeIndex];

  return (
    <section
      id="perfil-gamer"
      className="py-16 sm:py-24 bg-dark-900/70 border-y border-white/10 relative z-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Explanation & Interactive Customizer Controls */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5" /> Evolua seu Status no Esporte
            </div>

            <h2 ref={titleRef} className="font-display font-black text-3xl sm:text-5xl text-white leading-tight">
              <VariableProximity
                label="Personalize seu Perfil. Avalie Partidas e Suba de Nível."
                fromFontVariationSettings="'wght' 700, 'opsz' 18"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={titleRef}
                radius={100}
                falloff="linear"
                fromColor="#FFFFFF"
                toColor="#CCFF00"
              />
            </h2>

            <p className="text-slate-300 text-base leading-relaxed">
              No Sport Maker, cada partida conta para a sua reputação. Após o apito final, os jogadores avaliam o{' '}
              <strong className="text-white">desempenho técnico</strong>,{' '}
              <strong className="text-white">pontualidade</strong> e{' '}
              <strong className="text-white">Fair Play</strong> dos colegas, desbloqueando novos temas e insígnias para o seu card.
            </p>

            {/* Interactive Customizer Controls */}
            <div className="glass-card p-5 rounded-2xl border border-white/15 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" /> Experimente Personalizar o Perfil:
                </span>
                <span className="text-xs text-slate-400">Preview em Tempo Real</span>
              </div>

              {/* 1. Switch Player Archetype */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  1. Escolha o Atleta / Esporte Favorito:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {PLAYER_ARCHETYPES.map((arch, idx) => (
                    <button
                      key={arch.id}
                      onClick={() => setActiveArchetypeIndex(idx)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        activeArchetypeIndex === idx
                          ? 'bg-white/10 border-neon text-white'
                          : 'bg-dark-950/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <img
                        src={arch.avatar}
                        alt={arch.name}
                        className="w-10 h-10 rounded-full object-cover border border-neon"
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate">{arch.name}</p>
                        <p className="text-[11px] text-neon truncate">{arch.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Switch Card Skin Theme */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  2. Escolha o Tema Visual do seu Card:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {CARD_THEMES.map((theme, idx) => (
                    <button
                      key={theme.id}
                      onClick={() => setActiveThemeIndex(idx)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        activeThemeIndex === idx
                          ? `${theme.accentBg} border-transparent`
                          : 'bg-dark-950/80 text-slate-300 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Custom Title Tag */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  3. Título de Destaque no Perfil:
                </label>
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setCustomTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        customTag === tag
                          ? 'bg-neon/20 border-neon text-neon'
                          : 'bg-dark-950/70 border-white/10 text-slate-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Interactive Pro Player Card Preview */}
          <div className="lg:col-span-6 flex justify-center">
            <PlayerCard
              player={currentPlayer}
              theme={currentTheme}
              customTag={customTag}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

