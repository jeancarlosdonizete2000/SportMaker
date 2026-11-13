import React, { useRef } from 'react';
import { Star, Crown, Flame, Shield, Trophy, Sparkles } from 'lucide-react';
import VariableProximity from '../ui/VariableProximity';

export default function EvaluationShowcaseSection() {
  const titleRef = useRef(null);
  return (
    <section className="py-16 sm:py-24 border-t border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Pós-Jogo Interativo & Gamificado
          </span>
          <h2 ref={titleRef} className="font-display font-black text-3xl sm:text-5xl text-white">
            <VariableProximity
              label="Avalie a Arena, Dê Notas de 0 a 10 e Eleja o Craque da Partida"
              fromFontVariationSettings="'wght' 700, 'opsz' 18"
              toFontVariationSettings="'wght' 1000, 'opsz' 40"
              containerRef={titleRef}
              radius={100}
              falloff="linear"
              fromColor="#FFFFFF"
              toColor="#FBBF24"
            />
          </h2>
          <p className="text-slate-300 text-sm sm:text-base">
            Ao término de cada jogo em <strong>Minhas Partidas</strong>, você avalia a estrutura do local e vota nos destaques da resenha. Todas as notas atualizam automaticamente o perfil das arenas e o OVR dos atletas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Avaliação da Arena */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-400/30 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Sobre a Arena
                </span>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white mt-0.5">
                  De "Terrão" a "Padrão Série A"
                </h3>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-amber-400/15 border border-amber-400 text-amber-200 space-y-1">
                <span className="font-display font-black text-lg text-white block">
                  5★ • Padrão Série A
                </span>
                <p className="text-xs opacity-90">
                  Gramado/areia impecável, vestiário VIP e iluminação de estádio.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-dark-950 border border-white/10 text-slate-300 space-y-1">
                <span className="font-display font-black text-lg text-red-400 block">
                  1★ • Terrão
                </span>
                <p className="text-xs text-slate-400">
                  Transparência total para ajudar outros atletas a escolherem o melhor espaço.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Vote no Craque */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-neon/30 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neon">
                  Vote no Craque da Partida
                </span>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white mt-0.5">
                  Títulos & Notas de 0 a 10 no Perfil
                </h3>
              </div>
              <Trophy className="w-7 h-7 text-neon" />
            </div>

            <div className="p-4 rounded-2xl bg-dark-950 border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-amber-400 text-dark-950 font-display font-black flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Craque Eleito (MVP)</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded bg-neon text-dark-950 text-[10px] font-black flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Artilheiro
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-400 text-dark-950 text-[10px] font-black flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Paredão
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Nota da Galera</span>
                <span className="font-display font-black text-2xl text-neon">9.5 / 10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

