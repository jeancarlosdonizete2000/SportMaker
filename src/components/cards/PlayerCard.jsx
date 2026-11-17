import React from 'react';
import { Award, User, Zap, Flame, Crown } from 'lucide-react';

function extractShortPosition(role = '') {
  const r = role.toLowerCase();
  if (r.includes('goleiro') || r.includes('gk')) return 'GOL';
  if (r.includes('zagueiro') || r.includes('fixo') || r.includes('def')) return 'ZAG';
  if (r.includes('meia') || r.includes('armador')) return 'MEI';
  if (r.includes('ala') || r.includes('ponta')) return 'ALA';
  if (r.includes('beach') || r.includes('bt')) return 'BT';
  if (r.includes('padel') || r.includes('tenis') || r.includes('tênis')) return 'PDL';
  if (r.includes('futevolei') || r.includes('futevôlei')) return 'FTV';
  return 'ATA';
}

export default function PlayerCard({ player, theme, customTag }) {
  const stats = player.stats || {
    ritmo: 0,
    finalizacao: 0,
    passe: 0,
    defesa: 0,
    fisico: 0,
    fairPlay: 0,
  };

  const effect = theme?.effect || 'none';
  const isGold = effect === 'gold';
  const isLightning = effect === 'lightning';
  const isFire = effect === 'fire';
  const posCode = extractShortPosition(player.role);

  const initials = (player.name || 'SM')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const sixAttributesLeft = [
    { code: 'RIT', label: 'Ritmo', val: stats.ritmo ?? 0 },
    { code: 'FIN', label: 'Finalização', val: stats.finalizacao ?? 0 },
    { code: 'PAS', label: 'Passe', val: stats.passe ?? 0 },
  ];

  const sixAttributesRight = [
    { code: 'DEF', label: 'Defesa', val: stats.defesa ?? 0 },
    { code: 'FIS', label: 'Físico', val: stats.fisico ?? 0 },
    { code: 'FPL', label: 'Fair Play', val: stats.fairPlay ?? 0 },
  ];

  return (
    <div className="relative w-full max-w-[350px] mx-auto select-none group">
      {/* Aura Externa Animada para Cards PRO (Ouro, Raio ou Fogo) */}
      {isLightning && (
        <div className="absolute -inset-2 rounded-[42px] bg-gradient-to-b from-cyan-400/40 via-blue-500/25 to-sky-400/40 blur-xl animate-pulse pointer-events-none" />
      )}
      {isFire && (
        <div className="absolute -inset-2 rounded-[42px] bg-gradient-to-t from-red-600/50 via-orange-500/35 to-amber-400/35 blur-xl animate-pulse pointer-events-none" />
      )}
      {isGold && (
        <div className="absolute -inset-2 rounded-[42px] bg-gradient-to-b from-amber-300/45 via-yellow-500/25 to-amber-400/45 blur-xl pointer-events-none" />
      )}

      {/* Moldura Externa em Formato de Escudo EA Sports FC (Ultimate Team) */}
      <div
        className={`fc-card-shield p-[3px] transition-all duration-500 ${
          isGold
            ? 'bg-gradient-to-b from-amber-200 via-yellow-500 to-amber-700'
            : isLightning
              ? 'bg-gradient-to-b from-cyan-200 via-sky-400 to-blue-700 fc-electric-card'
              : isFire
                ? 'bg-gradient-to-b from-amber-300 via-orange-500 to-red-700 fc-fire-card'
                : theme.id === 'emerald-pro'
                  ? 'bg-gradient-to-b from-emerald-300 via-emerald-500 to-teal-900'
                  : theme.id === 'silver-slate'
                    ? 'bg-gradient-to-b from-slate-200 via-slate-400 to-slate-800'
                    : 'bg-gradient-to-b from-neon via-lime-500 to-emerald-900'
        } ${theme.glow}`}
      >
        {/* Interior do Escudo EA FC */}
        <div
          className={`fc-card-shield relative overflow-hidden bg-gradient-to-b ${theme.gradient} pt-6 pb-11 px-6 text-white`}
        >
          {/* Textura Geométrica Interna Estilo FUT */}
          <div className="absolute inset-0 bg-grid-pattern opacity-35 pointer-events-none" />

          {/* Efeito 1: Brilho Holográfico Dourado (Ouro Imperial PRO) */}
          {isGold && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(251,191,36,0.32),transparent_65%)] pointer-events-none" />
              <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-amber-200/35 to-transparent fc-shimmer-sweep pointer-events-none" />
            </>
          )}

          {/* Efeito 2: Tempestade de Raios Animados (Thunderstruck PRO) */}
          {isLightning && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(34,211,238,0.35),transparent_70%)] pointer-events-none" />
              <svg
                viewBox="0 0 300 420"
                className="absolute inset-0 w-full h-full pointer-events-none fc-lightning-svg"
                fill="none"
              >
                <path
                  d="M65 0 L42 110 L82 118 L30 250 L95 140 L58 130 L98 0 Z"
                  fill="url(#boltGrad1)"
                  opacity="0.75"
                />
                <path
                  d="M245 15 L210 125 L252 135 L195 285 L270 150 L232 140 L275 15 Z"
                  fill="url(#boltGrad1)"
                  opacity="0.65"
                />
                <defs>
                  <linearGradient id="boltGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E0F2FE" />
                    <stop offset="50%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </>
          )}

          {/* Efeito 3: Chamas e Brasas Subindo (Chama Imortal PRO) */}
          {isFire && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_85%,rgba(249,115,22,0.42),transparent_65%)] pointer-events-none" />
              <div className="absolute bottom-6 left-8 w-3 h-3 rounded-full bg-amber-300 blur-[1px] fc-ember pointer-events-none" />
              <div
                className="absolute bottom-4 left-1/3 w-2.5 h-2.5 rounded-full bg-orange-400 blur-[1px] fc-ember pointer-events-none"
                style={{ animationDelay: '0.6s' }}
              />
              <div
                className="absolute bottom-8 right-1/4 w-3.5 h-3.5 rounded-full bg-red-400 blur-[1px] fc-ember pointer-events-none"
                style={{ animationDelay: '1.1s' }}
              />
              <div
                className="absolute bottom-5 right-10 w-2 h-2 rounded-full bg-yellow-300 blur-[1px] fc-ember pointer-events-none"
                style={{ animationDelay: '1.7s' }}
              />
            </>
          )}

          {/* Selo de Edição no Topo do Card */}
          <div className="relative z-10 flex items-center justify-between mb-3">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${theme.accentBg}`}
            >
              {isLightning && <Zap className="w-3 h-3 fill-current" />}
              {isFire && <Flame className="w-3 h-3 fill-current" />}
              {isGold && <Crown className="w-3 h-3 fill-current" />}
              {theme.badgeLabel || (player.isPro ? '👑 PRO VIP' : 'SPORT MAKER FC')}
            </span>

            {customTag && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/45 border border-white/15 text-slate-100 truncate max-w-[155px]">
                {customTag}
              </span>
            )}
          </div>

          {/* UPPER SECTION EA FC: Coluna Esquerda (OVR + Posição + Bandeira/Clube) + Retrato à Direita */}
          <div className="relative z-10 grid grid-cols-12 items-center gap-2 pt-1 pb-3">
            {/* Coluna Esquerda Estilo FUT */}
            <div className="col-span-4 flex flex-col items-center text-center border-r border-white/15 pr-2 space-y-1.5">
              <span
                className={`font-display font-black text-4xl sm:text-5xl leading-none tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${theme.accentText}`}
              >
                {player.ovr > 0 ? player.ovr : '—'}
              </span>
              <span className="font-display font-extrabold text-sm tracking-widest text-white uppercase">
                {posCode}
              </span>

              <div className="w-8 h-[1px] bg-white/20 my-0.5" />

              {/* Bandeira Brasil + Emblema Sport Maker */}
              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 tracking-wider"
                  title="Brasil"
                >
                  🇧🇷 BRA
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-display font-black text-[10px] shadow-md ${theme.accentBg}`}
                >
                  SM
                </div>
              </div>
            </div>

            {/* Retrato do Jogador Estilo Cartinha EA FC */}
            <div className="col-span-8 flex flex-col items-center justify-center relative">
              <div className="relative">
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 shadow-2xl ${
                      isGold
                        ? 'border-amber-300'
                        : isLightning
                          ? 'border-cyan-300'
                          : isFire
                            ? 'border-orange-400'
                            : 'border-white/25'
                    }`}
                  />
                ) : (
                  <div
                    className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-dark-950/90 border-2 flex flex-col items-center justify-center shadow-2xl ${
                      isGold
                        ? 'border-amber-300 text-amber-300'
                        : isLightning
                          ? 'border-cyan-300 text-cyan-300'
                          : isFire
                            ? 'border-orange-400 text-orange-400'
                            : 'border-white/25 text-neon'
                    }`}
                  >
                    <span className="font-display font-black text-3xl">
                      {player.name ? initials : <User className="w-10 h-10" />}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 mt-1">
                      Sem Foto
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FAIXA CENTRAL DE NOME DO JOGADOR (ESTILO EA SPORTS FC) */}
          <div className="relative z-10 text-center py-2 border-y border-white/20 bg-black/35 backdrop-blur-sm my-1">
            <h3 className="font-display font-black text-xl sm:text-2xl uppercase tracking-wider text-white truncate px-2 drop-shadow">
              {player.nickname ? player.nickname : player.name}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 truncate px-2">
              {player.nickname ? `${player.name} • ` : ''}
              {player.role}
            </p>
          </div>

          {/* GRADE DE 6 ATRIBUTOS EM 2 COLUNAS (PAC, SHO, PAS | DRI/DEF, PHY, FPL) */}
          <div className="relative z-10 grid grid-cols-2 gap-4 py-3 px-2 border-b border-white/15">
            <div className="space-y-1.5 border-r border-white/15 pr-3">
              {sixAttributesLeft.map((attr) => (
                <div
                  key={attr.code}
                  className="flex items-center justify-between text-xs"
                  title={attr.label}
                >
                  <span className={`font-display font-black text-sm ${theme.accentText}`}>
                    {attr.val}
                  </span>
                  <span className="font-display font-bold tracking-wider text-slate-200">
                    {attr.code}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 pl-1">
              {sixAttributesRight.map((attr) => (
                <div
                  key={attr.code}
                  className="flex items-center justify-between text-xs"
                  title={attr.label}
                >
                  <span className={`font-display font-black text-sm ${theme.accentText}`}>
                    {attr.val}
                  </span>
                  <span className="font-display font-bold tracking-wider text-slate-200">
                    {attr.code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RODAPÉ DA CARTINHA: JOGOS, MVPs & AMIGOS */}
          <div className="relative z-10 pt-2.5 flex items-center justify-around text-center text-[11px]">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Jogos</span>
              <span className="font-display font-black text-sm text-white">
                {player.matches ?? 0}
              </span>
            </div>
            <div className="h-5 w-[1px] bg-white/15" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">MVPs</span>
              <span className={`font-display font-black text-sm ${theme.accentText}`}>
                {player.mvpCount ?? 0} 🏆
              </span>
            </div>
            <div className="h-5 w-[1px] bg-white/15" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Amigos</span>
              <span className="font-display font-black text-sm text-white">
                {player.friendsCount ?? 0}
              </span>
            </div>
          </div>

          {/* PlayStyles+ Icons no Bico Inferior do Escudo */}
          {player.badgesList && player.badgesList.length > 0 && (
            <div className="relative z-10 pt-2 flex justify-center gap-1 flex-wrap">
              {player.badgesList.slice(0, 2).map((badge) => (
                <span
                  key={badge}
                  className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-black/50 border border-white/15 text-slate-200 flex items-center gap-1"
                >
                  <Award className={`w-2.5 h-2.5 ${theme.accentText}`} />
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

