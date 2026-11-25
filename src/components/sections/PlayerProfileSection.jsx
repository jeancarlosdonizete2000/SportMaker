import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Sparkles, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { CARD_THEMES } from '../../data/mockData';
import PlayerCard from '../cards/PlayerCard';
import VariableProximity from '../ui/VariableProximity';

const PRO_THEMES = CARD_THEMES.filter((t) => t.isPremium);
const FUTURE_STARS_INDEX = Math.max(
  0,
  PRO_THEMES.findIndex((t) => t.id === 'card-future-stars-pro')
);

const HERO_PRO_PLAYER_BASE = {
  id: 'showcase-pro-16',
  name: 'Lucas Mendes',
  nickname: 'LUCAS #16',
  role: 'Atacante • Futebol / Society',
  ovr: 94,
  matches: 142,
  mvpCount: 38,
  fairPlay: 4.98,
  friendsCount: 284,
  avatar: '/players/hero-player-16.jpg',
  isPro: true,
  stats: {
    ritmo: 95,
    finalizacao: 93,
    passe: 89,
    defesa: 72,
    fisico: 91,
    fairPlay: 99,
  },
};

const CUTOUT_CACHE_KEY = 'sm_hero_player_16_cutout_v1';

export default function PlayerProfileSection() {
  const titleRef = useRef(null);
  const navigate = useNavigate();
  const [activeThemeIndex, setActiveThemeIndex] = useState(FUTURE_STARS_INDEX);
  const [cutoutAvatar, setCutoutAvatar] = useState(() => {
    try {
      return sessionStorage.getItem(CUTOUT_CACHE_KEY) || '/players/hero-player-16.jpg';
    } catch {
      return '/players/hero-player-16.jpg';
    }
  });

  // Recorta automaticamente o fundo da foto do jogador via IA (e guarda em cache na sessão)
  useEffect(() => {
    let cancelled = false;
    try {
      if (sessionStorage.getItem(CUTOUT_CACHE_KEY)) return;
    } catch {
      // ignora
    }

    (async () => {
      try {
        const response = await fetch('/players/hero-player-16.jpg');
        if (!response.ok) return;
        const inputBlob = await response.blob();
        const { removeBackground } = await import('@imgly/background-removal');
        const blob = await removeBackground(inputBlob);
        if (cancelled || !blob) return;
        const reader = new FileReader();
        reader.onload = () => {
          if (!cancelled && typeof reader.result === 'string') {
            setCutoutAvatar(reader.result);
            try {
              sessionStorage.setItem(CUTOUT_CACHE_KEY, reader.result);
            } catch {
              // storage cheio, segue com estado em memória
            }
          }
        };
        reader.readAsDataURL(blob);
      } catch {
        // mantém imagem original caso falhe
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentTheme = PRO_THEMES[activeThemeIndex] || PRO_THEMES[0];
  const showcasePlayer = {
    ...HERO_PRO_PLAYER_BASE,
    avatar: cutoutAvatar,
  };

  return (
    <section
      id="perfil-gamer"
      className="py-16 sm:py-24 bg-gradient-to-b from-dark-900/90 via-dark-950 to-dark-900/90 border-y border-white/10 relative z-10 overflow-hidden"
    >
      {/* Ambient Neon Glow */}
      <div className="absolute -top-32 right-0 w-96 h-96 bg-fuchsia-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 left-0 w-96 h-96 bg-neon/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Aggressive Marketing Pitch + PRO Cards Selector */}
          <div className="lg:col-span-6 space-y-6">
            <h2
              ref={titleRef}
              className="font-display font-black text-3xl sm:text-5xl text-white leading-[1.08]"
            >
              <VariableProximity
                label="Transforme sua Pelada em Carreira. Tenha seu Próprio Card PRO."
                fromFontVariationSettings="'wght' 700, 'opsz' 18"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={titleRef}
                radius={100}
                falloff="linear"
                fromColor="#FFFFFF"
                toColor="#CCFF00"
              />
            </h2>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Chega de jogar e ninguém lembrar dos seus golaços. No <strong className="text-white">Sport Maker</strong>, você sobe sua foto com <strong className="text-neon">recorte automático de fundo por IA</strong>, recebe avaliações reais de <strong className="text-white">OVR e MVP</strong> após cada partida e coleciona <strong className="text-amber-300">Cartas PRO com efeito prismático 3D</strong> dignas de craque profissional.
            </p>

            {/* Mobile Player Card Preview logo abaixo do parágrafo */}
            <div className="lg:hidden flex flex-col items-center justify-center space-y-3 py-2">
              <PlayerCard
                player={showcasePlayer}
                theme={currentTheme}
                customTag="👑 Lenda PRO Oficial"
                alwaysExpanded
              />
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 text-center">
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                Segure e incline a carta para testar o efeito prismático 3D
              </span>
            </div>

            {/* Exclusively PRO Cards Selector */}
            <div className="glass-card p-5 rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 via-dark-950/90 to-dark-950 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" /> Teste as Cartas Colecionáveis PRO:
                </span>
                <span className="text-[11px] font-bold text-neon">
                  Segure o card para girar ✨
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRO_THEMES.map((theme, idx) => {
                  const isSelected = activeThemeIndex === idx;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setActiveThemeIndex(idx)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-display font-extrabold border transition-all truncate ${
                        isSelected
                          ? `${theme.accentBg} border-transparent scale-[1.03] shadow-lg`
                          : 'bg-dark-900/90 text-slate-200 border-white/15 hover:border-amber-400/50'
                      }`}
                    >
                      {theme.name}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => navigate('/login/atleta?mode=register')}
                className="w-full py-3.5 px-5 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-black text-xs sm:text-sm shadow-neon transition-all flex items-center justify-center gap-2"
              >
                <span>Criar Meu Player Card Agora</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Right Interactive Pro Player Card Preview (Desktop) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col items-center justify-center space-y-3">
            <PlayerCard
              player={showcasePlayer}
              theme={currentTheme}
              customTag="👑 Lenda PRO Oficial"
              alwaysExpanded
            />
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              Passe o mouse ou segure a carta para testar o efeito prismático 3D
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
