import React, { useState, useRef, useCallback } from 'react';
import { User } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';

function extractShortPosition(role = '') {
  const r = role.toLowerCase();
  if (r.includes('goleiro') || r.includes('gk')) return 'GOL';
  if (r.includes('zagueiro') || r.includes('fixo') || r.includes('def')) return 'ZAG';
  if (r.includes('meia') || r.includes('armador')) return 'MEI';
  if (r.includes('ala') || r.includes('ponta')) return 'ALA';
  if (r.includes('beach') || r.includes('bt')) return 'BT';
  if (r.includes('volei') || r.includes('vôlei')) return 'VOL';
  if (r.includes('futevolei') || r.includes('futevôlei')) return 'FTV';
  return 'ATA';
}

export default function PlayerCard({ player, theme, customTag, alwaysExpanded = false }) {
  const [isMobileExpandedState, setIsMobileExpandedState] = useState(alwaysExpanded);
  const isMobileExpanded = alwaysExpanded || isMobileExpandedState;
  const [isInteracting, setIsInteracting] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const cardSurfaceRef = useRef(null);
  const pointerStartRef = useRef({ x: 0, y: 0, time: 0, dragged: false });

  const isProCard = Boolean(theme?.isPremium);

  // Define a cor do efeito prismático por carta PRO (Bronze = sem brilho, apenas movimento 3D)
  const prismaticConfig = (() => {
    if (!isProCard) return { hasGlow: false };
    switch (theme?.id) {
      case 'card-bronze-pro':
        return { hasGlow: false };
      case 'card-ouro-pro':
      case 'card-totw-black-gold-pro':
        return {
          hasGlow: true,
          holoClass: 'prismatic-variant-gold',
          beamsClass: 'prismatic-beams-gold',
          auraGradient: 'from-amber-300/30 via-yellow-400/20 to-amber-500/30',
        };
      case 'card-icon-pro':
        return {
          hasGlow: true,
          holoClass: 'prismatic-variant-white',
          beamsClass: 'prismatic-beams-white',
          auraGradient: 'from-white/30 via-slate-200/20 to-white/30',
        };
      case 'card-fut-red-pro':
        return {
          hasGlow: true,
          holoClass: 'prismatic-variant-red-silver',
          beamsClass: 'prismatic-beams-red-silver',
          auraGradient: 'from-slate-200/30 via-red-500/25 to-red-600/30',
        };
      case 'card-future-stars-pro':
      default:
        return {
          hasGlow: true,
          holoClass: 'prismatic-variant-rainbow',
          beamsClass: 'prismatic-beams-rainbow',
          auraGradient: 'from-fuchsia-500/35 via-amber-300/20 to-cyan-400/35',
        };
    }
  })();

  // Física 3D suave (60fps sem re-render) para inclinação prismática nos cards PRO
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 260, damping: 20, mass: 0.6 });
  const rotateY = useSpring(rawRotateY, { stiffness: 260, damping: 20, mass: 0.6 });

  const updatePrismaticPosition = useCallback(
    (clientX, clientY, boost = false) => {
      if (!isProCard || !cardSurfaceRef.current) return;
      const rect = cardSurfaceRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const relX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const relY = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));

      const maxTilt = boost ? 18 : 13;
      const tiltY = (relX - 0.5) * 2 * maxTilt;
      const tiltX = (0.5 - relY) * 2 * maxTilt;

      rawRotateX.set(tiltX);
      rawRotateY.set(tiltY);

      const px = (relX * 100).toFixed(1);
      const py = (relY * 100).toFixed(1);
      const bgX = (20 + relX * 60).toFixed(1);
      const bgY = (20 + relY * 60).toFixed(1);
      const bgInvX = (80 - relX * 60).toFixed(1);
      const bgInvY = (80 - relY * 60).toFixed(1);

      const el = cardSurfaceRef.current;
      el.style.setProperty('--holo-x', `${px}%`);
      el.style.setProperty('--holo-y', `${py}%`);
      el.style.setProperty('--holo-bg-x', `${bgX}%`);
      el.style.setProperty('--holo-bg-y', `${bgY}%`);
      el.style.setProperty('--holo-bg-inv-x', `${bgInvX}%`);
      el.style.setProperty('--holo-bg-inv-y', `${bgInvY}%`);
    },
    [isProCard, rawRotateX, rawRotateY]
  );

  const resetPrismatic = useCallback(() => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    setIsInteracting(false);
    setIsHolding(false);
  }, [rawRotateX, rawRotateY]);

  const handlePointerDown = (e) => {
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      dragged: false,
    };
    if (isProCard) {
      setIsHolding(true);
      setIsInteracting(true);
      updatePrismaticPosition(e.clientX, e.clientY, true);
    }
  };

  const handlePointerMove = (e) => {
    if (isHolding) {
      const dx = Math.abs(e.clientX - pointerStartRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartRef.current.y);
      if (dx > 8 || dy > 8) {
        pointerStartRef.current.dragged = true;
      }
    }
    if (isProCard && (isHolding || e.pointerType === 'mouse')) {
      setIsInteracting(true);
      updatePrismaticPosition(e.clientX, e.clientY, isHolding);
    }
  };

  const handlePointerUp = () => {
    if (isHolding) {
      setIsHolding(false);
    }
  };

  const handleCardClick = () => {
    if (alwaysExpanded) return;
    // Se o usuário segurou/arrastou para admirar o brilho prismático, não alterna o estado compacto no mobile
    const heldMs = Date.now() - pointerStartRef.current.time;
    if (pointerStartRef.current.dragged || (isProCard && heldMs > 260)) {
      return;
    }
    setIsMobileExpandedState((prev) => !prev);
  };

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

  // Máscara pixel-perfect para que o brilho prismático siga o contorno exato da carta .webp
  const prismaticMaskStyle = theme.bgImage
    ? {
      WebkitMaskImage: `url(${theme.bgImage})`,
      maskImage: `url(${theme.bgImage})`,
      WebkitMaskSize: '100% 100%',
      maskSize: '100% 100%',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
    }
    : undefined;

  const renderDetailsContent = () => (
    <>
      {/* FAIXA CENTRAL DE NOME DO JOGADOR (ESTILO EA SPORTS FC) */}
      <div className="relative z-10 max-w-[88%] mx-auto rounded-lg text-center py-2 border-y border-white/20 bg-black/35 backdrop-blur-sm my-1">
        <h3 className="font-display font-black text-xl sm:text-2xl uppercase tracking-wider text-white truncate px-2 drop-shadow">
          {player.nickname ? player.nickname : player.name}
        </h3>
        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-300 truncate px-2">
          {player.nickname ? `${player.name} • ` : ''}
          {player.role}
        </p>
      </div>

      {/* GRADE DE 6 ATRIBUTOS EM 2 COLUNAS (PAC, SHO, PAS | DRI/DEF, PHY, FPL) */}
      <div className="relative z-10 grid grid-cols-2 gap-4 py-1.5 px-2 border-b border-white/15">
        <div className="space-y-0.5 border-r border-white/15 pr-3">
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

        <div className="space-y-0.5 pl-1">
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
      <div className="relative z-10 pt-1.5 flex items-center justify-around text-center text-[11px]">
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
    </>
  );

  return (
    <motion.div
      layout
      ref={cardSurfaceRef}
      onClick={handleCardClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={resetPrismatic}
      onPointerLeave={resetPrismatic}
      style={{
        perspective: 1000,
        touchAction: isProCard && isHolding ? 'none' : 'pan-y',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={`relative w-full mx-auto select-none group ${isProCard ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer md:cursor-default'
        } ${theme.bgImage
          ? `${isMobileExpanded ? 'max-w-[350px] scale-[1.02]' : 'max-w-[235px]'
          } md:scale-100 md:max-w-[400px]`
          : `${isMobileExpanded ? 'max-w-[330px] scale-[1.02]' : 'max-w-[220px]'
          } md:scale-100 md:max-w-[360px]`
        }`}
    >
      {/* Wrapper 3D com Inclinação Prismática (Cards PRO) */}
      <motion.div
        layout
        style={
          isProCard
            ? {
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }
            : undefined
        }
        animate={
          isProCard
            ? {
              scale: isHolding ? 1.04 : 1,
            }
            : undefined
        }
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="relative"
      >
        {/* Aura Prismática Externa para Cards PRO (ativa apenas ao interagir/segurar) */}
        {prismaticConfig.hasGlow && (
          <div
            className={`absolute -inset-2.5 rounded-[40px] bg-gradient-to-tr ${prismaticConfig.auraGradient} blur-2xl pointer-events-none transition-opacity duration-300 ${isHolding
                ? 'opacity-65'
                : isInteracting
                  ? 'opacity-45'
                  : 'opacity-0'
              }`}
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, black 18%, black 85%, transparent 100%)',
              maskImage:
                'linear-gradient(to bottom, transparent 0%, black 18%, black 85%, transparent 100%)',
            }}
          />
        )}

        {/* Moldura Externa em Formato de Escudo EA Sports FC (Ultimate Team) */}
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className={
            theme.bgImage
              ? 'relative transition-all duration-300'
              : `fc-card-shield p-[3px] transition-all duration-300 ${isGold
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
              } ${theme.glow}`
          }
        >
          {/* Interior do Escudo EA FC */}
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className={
              theme.bgImage
                ? `relative overflow-hidden text-white flex flex-col justify-between ${isMobileExpanded
                  ? 'pt-9 pb-14 px-7 min-h-[480px]'
                  : 'pt-6 pb-8 px-5 min-h-[250px]'
                } md:pt-10 md:pb-16 md:px-9 md:min-h-[540px]`
                : `fc-card-shield relative overflow-hidden bg-gradient-to-b ${theme.gradient} ${isMobileExpanded ? 'pt-6 pb-10 px-5' : 'pt-4 pb-6 px-4'
                } md:pt-6 md:pb-11 md:px-6 text-white`
            }
            style={
              theme.bgImage
                ? {
                  backgroundImage: `url(${theme.bgImage})`,
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }
                : undefined
            }
          >
            {/* Textura Geométrica Interna Estilo FUT (apenas nos cards sem imagem) */}
            {!theme.bgImage && (
              <div className="absolute inset-0 bg-grid-pattern opacity-35 pointer-events-none" />
            )}

            {/* Efeito 1: Brilho Holográfico Dourado (Ouro Imperial PRO) */}
            {isGold && (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(251,191,36,0.32),transparent_65%)] pointer-events-none" />
                <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-amber-200/35 to-transparent fc-shimmer-sweep pointer-events-none" />
              </>
            )}

            {/* UPPER SECTION EA FC: Coluna Esquerda (OVR + Posição + Bandeira/Clube) + Retrato à Direita */}
            <motion.div
              layout
              className="relative z-10 grid grid-cols-12 items-center gap-2 pt-1 pb-2 md:pb-3"
            >
              {/* Coluna Esquerda Estilo FUT */}
              <div className="col-span-4 flex flex-col items-center text-center border-r border-white/15 pr-2 space-y-1 md:space-y-1.5">
                <span
                  className={`font-display font-black ${isMobileExpanded ? 'text-4xl' : 'text-3xl'
                    } md:text-5xl leading-none tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${theme.accentText}`}
                >
                  {player.ovr > 0 ? player.ovr : '—'}
                </span>
                <span className="font-display font-extrabold text-xs md:text-sm tracking-widest text-white uppercase">
                  {posCode}
                </span>

                <div className="w-7 md:w-8 h-[1px] bg-white/20 my-0.5" />

                {/* Bandeira Brasil + Emblema Sport Maker */}
                <div className="flex flex-col items-center gap-1 md:gap-1.5">
                  <img
                    src="/flags/br.png"
                    alt="Brasil"
                    className="w-7 h-5 md:w-9 md:h-6 rounded-[4px] object-cover shadow-md border border-white/25"
                  />
                  <div
                    className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center font-display font-black text-[9px] md:text-[10px] shadow-md ${theme.accentBg}`}
                  >
                    SM
                  </div>
                </div>
              </div>

              {/* Retrato do Jogador Estilo Cartinha EA FC (Tamanho Máximo) */}
              <div className="col-span-8 flex flex-col items-center justify-center relative">
                <div className="relative w-full flex items-center justify-center">
                  {player.avatar && !avatarError ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className={
                        theme.bgImage
                          ? `w-full ${isMobileExpanded ? 'h-52' : 'h-40'
                          } md:h-60 object-contain object-bottom scale-110 transition-all duration-300 drop-shadow-[0_12px_20px_rgba(0,0,0,0.7)]`
                          : `w-full ${isMobileExpanded ? 'h-44' : 'h-32'
                          } md:h-48 rounded-2xl object-cover object-top border-2 shadow-2xl transition-all duration-300 ${isGold
                            ? 'border-amber-300'
                            : isLightning
                              ? 'border-cyan-300'
                              : isFire
                                ? 'border-orange-400'
                                : 'border-white/25'
                          }`
                      }
                      style={{
                        transform: `scale(${(player.avatarScale || 100) / 100})`,
                        transformOrigin: 'center bottom',
                        ...(theme.bgImage
                          ? {
                            WebkitMaskImage:
                              'linear-gradient(to bottom, black 70%, transparent 100%)',
                            maskImage:
                              'linear-gradient(to bottom, black 70%, transparent 100%)',
                          }
                          : {}),
                      }}
                    />
                  ) : (
                    <div
                      className={`${isMobileExpanded ? 'w-28 h-28' : 'w-24 h-24'
                        } md:w-32 md:h-32 rounded-2xl bg-dark-950/90 border-2 flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ${isGold
                          ? 'border-amber-300 text-amber-300'
                          : isLightning
                            ? 'border-cyan-300 text-cyan-300'
                            : isFire
                              ? 'border-orange-400 text-orange-400'
                              : 'border-white/25 text-neon'
                        }`}
                    >
                      <span className="font-display font-black text-2xl md:text-3xl">
                        {player.name ? initials : <User className="w-8 h-8 md:w-10 md:h-10" />}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-slate-400 mt-1">
                        Sem Foto
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* DESKTOP: Sempre exibe Faixa de Nome + Grade de Atributos + Rodapé */}
            <div className="hidden md:block">{renderDetailsContent()}</div>

            {/* MOBILE: Animação ao tocar no card (expande e revela Nome + Grade de Estatísticas + Rodapé) */}
            <div className="md:hidden">
              <AnimatePresence initial={false}>
                {isMobileExpanded && (
                  <motion.div
                    key="mobile-expanded-details"
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="overflow-hidden"
                  >
                    {renderDetailsContent()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* =================================================================
                CAMADAS PRISMÁTICAS HOLOGRÁFICAS (ATIVAS APENAS AO INTERAGIR/SEGURAR)
                Enquanto estática, opacidade = 0 para manter a foto 100% nítida
               ================================================================= */}
            {prismaticConfig.hasGlow && (
              <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={prismaticMaskStyle}
              >
                {/* Camada 1: Refração Prismática Customizada (Color-Dodge suave) */}
                <div
                  className={`absolute inset-0 prismatic-holo-layer ${prismaticConfig.holoClass}`}
                  style={{
                    opacity: isHolding ? 0.56 : isInteracting ? 0.4 : 0,
                  }}
                />

                {/* Camada 2: Micro-feixes Metálicos Diagonais (Foil TCG) */}
                <div
                  className={`absolute inset-0 prismatic-foil-beams ${prismaticConfig.beamsClass}`}
                  style={{
                    opacity: isHolding ? 0.48 : isInteracting ? 0.32 : 0,
                  }}
                />

                {/* Camada 3: Ponto de Luz Especular Dinâmico seguindo o dedo/mouse */}
                <div
                  className="absolute inset-0 prismatic-glare-spot"
                  style={{
                    opacity: isHolding ? 0.58 : isInteracting ? 0.42 : 0,
                  }}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
