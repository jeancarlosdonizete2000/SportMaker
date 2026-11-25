import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  SlidersHorizontal,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  Crown,
  Lock,
  User,
  Trash2,
  Edit3,
  Grid,
  Settings,
  X,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CARD_THEMES } from '../../data/mockData';
import PlayerCard from '../cards/PlayerCard';
import { useAuth } from '../../context/AuthContext';

const STANDARD_TAGS = [
  'Atleta Iniciante',
  'Capitão & Artilheiro',
  'Rei do 3º Tempo 🍻',
  'Paredão Invicto 🛡️',
  '100% Fair Play 🤝',
];

const PRO_EXCLUSIVE_TAGS = [
  '👑 Lenda PRO Oficial',
  '⚡ Prioridade VIP de Fila',
  '🏆 Organizador de Copas PRO',
];

/**
 * Miniatura limpa do próprio Player Card (sem textos/nomes) para a grade de coleção
 */
function MiniCleanPlayerCardIcon({ theme, isEquipped, isLocked }) {
  const shieldBorderGradient =
    theme.id === 'emerald-pro'
      ? 'bg-gradient-to-b from-emerald-300 via-emerald-500 to-teal-900'
      : theme.id === 'silver-slate'
        ? 'bg-gradient-to-b from-slate-200 via-slate-400 to-slate-800'
        : 'bg-gradient-to-b from-neon via-lime-500 to-emerald-900';

  return (
    <div className="relative flex items-center justify-center group">
      {theme.bgImage ? (
        <img
          src={theme.bgImage}
          alt={theme.name}
          className={`w-20 h-28 sm:w-24 sm:h-32 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] transition-transform duration-300 ${
            isEquipped ? 'scale-105' : 'group-hover:scale-105'
          } ${isLocked ? 'grayscale opacity-55' : ''}`}
        />
      ) : (
        <div
          className={`w-[72px] h-[102px] sm:w-[86px] sm:h-[120px] fc-card-shield p-[2px] transition-transform duration-300 ${shieldBorderGradient} ${
            isEquipped ? 'scale-105' : 'group-hover:scale-105'
          } ${isLocked ? 'grayscale opacity-55' : ''}`}
        >
          <div
            className={`w-full h-full fc-card-shield relative overflow-hidden bg-gradient-to-b ${theme.gradient}`}
          >
            <div className="absolute inset-0 bg-grid-pattern opacity-40" />
            <div className="absolute inset-x-3 top-1/2 h-[1px] bg-white/15" />
          </div>
        </div>
      )}

      {/* Tag PRO nos cards que são exclusivos PRO */}
      {theme.isPremium && (
        <span className="absolute -bottom-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-dark-950 text-[9px] font-display font-black uppercase tracking-wider flex items-center gap-0.5 shadow-[0_2px_10px_rgba(251,191,36,0.5)] ring-2 ring-dark-950">
          <Crown className="w-2.5 h-2.5" /> PRO
        </span>
      )}

      {/* Indicador de Card Equipado */}
      {isEquipped && (
        <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-neon text-dark-950 flex items-center justify-center shadow-neon ring-2 ring-dark-950">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </span>
      )}

      {/* Indicador de Card PRO Bloqueado */}
      {isLocked && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-8 h-8 rounded-full bg-dark-950/85 border border-amber-400/50 text-amber-400 flex items-center justify-center shadow-lg">
            <Lock className="w-4 h-4" />
          </span>
        </span>
      )}
    </div>
  );
}

export default function ProfileTab() {
  const { user, isPro, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [avatarScale, setAvatarScale] = useState(user?.avatarScale || 100);
  const [activeThemeIndex, setActiveThemeIndex] = useState(() => {
    const legacyMap = {
      'gold-toty': 'card-ouro-pro',
      'thunder-pro': 'card-future-stars-pro',
      'inferno-pro': 'card-fut-red-pro',
    };
    const targetId = legacyMap[user?.cardThemeId] || user?.cardThemeId;
    if (targetId) {
      const idx = CARD_THEMES.findIndex((t) => t.id === targetId);
      if (idx >= 0) return idx;
    }
    return isPro ? 3 : 0;
  });

  useEffect(() => {
    if (!user?.cardThemeId) return;
    const legacyMap = {
      'gold-toty': 'card-ouro-pro',
      'thunder-pro': 'card-future-stars-pro',
      'inferno-pro': 'card-fut-red-pro',
    };
    const targetId = legacyMap[user.cardThemeId] || user.cardThemeId;
    const idx = CARD_THEMES.findIndex((t) => t.id === targetId);
    if (idx >= 0) {
      setActiveThemeIndex(idx);
    }
  }, [user?.cardThemeId]);

  const [customTag, setCustomTag] = useState(user?.customTag || STANDARD_TAGS[0]);
  const [positionRole, setPositionRole] = useState(
    user?.positionRole || 'Atleta Sport Maker'
  );
  const [saving, setSaving] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const compressImageBlobToDataUrl = (blobOrFile) =>
    new Promise((resolve) => {
      const url = URL.createObjectURL(blobOrFile);
      const img = new Image();
      img.onload = () => {
        const maxW = 480;
        const maxH = 600;
        let { width, height } = img;
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/webp', 0.86));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.readAsDataURL(blobOrFile);
      };
      img.src = url;
    });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRemovingBg(true);
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const resultBlob = await removeBackground(file);
      const compressed = await compressImageBlobToDataUrl(resultBlob);
      if (compressed) setSelectedAvatar(compressed);
    } catch {
      const compressed = await compressImageBlobToDataUrl(file);
      if (compressed) setSelectedAvatar(compressed);
    } finally {
      setRemovingBg(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const chosenTheme = CARD_THEMES[activeThemeIndex] || CARD_THEMES[0];
      await updateUserProfile({
        nickname: nickname.trim(),
        avatar: selectedAvatar,
        avatarScale: Number(avatarScale) || 100,
        positionRole,
        customTag,
        cardThemeId: chosenTheme.id,
      });
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const userStats = user?.stats || {
    ritmo: 0,
    finalizacao: 0,
    passe: 0,
    defesa: 0,
    fisico: 0,
    fairPlay: 0,
  };

  const basePlayer = {
    name: user?.name || 'Atleta Sport Maker',
    nickname: nickname.trim(),
    avatar: selectedAvatar,
    avatarScale: Number(avatarScale) || 100,
    ovr: user?.ovr ?? 0,
    matches: user?.matchesCount ?? 0,
    mvpCount: user?.mvpCount ?? 0,
    friendsCount: Array.isArray(user?.friends) ? user.friends.length : 0,
    fairPlay: user?.fairPlay ?? 0,
    stats: userStats,
    role: positionRole,
    isPro,
    badgesList: isPro
      ? [
          '👑 Assinante PRO VIP',
          '⚡ Prioridade na Fila',
          '⚽ Bola Oficial Grátis',
        ]
      : [],
  };

  const currentTheme = CARD_THEMES[activeThemeIndex];
  const unlockedCards = CARD_THEMES.filter((t) => !t.isPremium || isPro);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {!isEditingProfile ? (
        /* ===================================================================
           INSTAGRAM-STYLE PROFILE VIEW (MOBILE & DESKTOP)
           =================================================================== */
        <div className="space-y-8">
          {/* Top Profile Header Card: PlayerCard + Info + Counters + Actions */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15">
            <div className="flex flex-col md:flex-row items-center md:items-center justify-center gap-6 md:gap-12">
              {/* Player Card Oficial (Intacto: compacto c/ animação no mobile, completo no desktop) */}
              <div className="w-full md:w-[380px] lg:w-[400px] shrink-0 flex justify-center">
                <PlayerCard
                  player={basePlayer}
                  theme={currentTheme}
                  customTag={customTag}
                />
              </div>

              {/* Coluna Direita (ou Inferior no Mobile): Identidade, Contadores e Botão Editar Perfil */}
              <div className="flex-1 w-full max-w-md space-y-6 text-center md:text-left">
                {/* Nickname, Nome e Bio Esportiva */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                    {user?.teamTag && (
                      <span className="px-2 py-0.5 rounded-lg bg-neon/15 border border-neon/40 text-neon font-display font-black text-xs tracking-wider uppercase">
                        [{user.teamTag}]
                      </span>
                    )}
                    <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
                      {nickname.trim() ? `@${nickname.trim()}` : basePlayer.name}
                    </h1>
                    {isPro && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-dark-950 text-[10px] font-black uppercase flex items-center gap-1">
                        <Crown className="w-3 h-3" /> PRO
                      </span>
                    )}
                  </div>

                  {nickname.trim() && (
                    <p className="text-sm font-semibold text-slate-300">{basePlayer.name}</p>
                  )}

                  <p className="text-xs sm:text-sm text-neon font-semibold">
                    {positionRole} • {customTag}
                  </p>
                </div>

                {/* Contadores Estilo Instagram (Partidas • Amigos • OVR) */}
                <div className="grid grid-cols-3 divide-x divide-white/10 py-3.5 rounded-2xl bg-dark-950/75 border border-white/10">
                  <button
                    type="button"
                    onClick={() => navigate('/app/minhas-partidas')}
                    className="flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <span className="font-display font-black text-xl sm:text-2xl text-white">
                      {basePlayer.matches}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-400 font-semibold">
                      Partidas
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/app/amigos')}
                    className="flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <span className="font-display font-black text-xl sm:text-2xl text-white">
                      {basePlayer.friendsCount}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-400 font-semibold">
                      Amigos
                    </span>
                  </button>

                  <div className="flex flex-col items-center justify-center">
                    <span className="font-display font-black text-xl sm:text-2xl text-neon">
                      {basePlayer.ovr > 0 ? basePlayer.ovr : '—'}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-400 font-semibold">
                      OVR
                    </span>
                  </div>
                </div>

                {/* Botões de Ação: Editar Perfil + Seja PRO + Configurações */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Edit3 className="w-4 h-4 text-neon" />
                    <span>Editar Perfil</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/app/seja-pro')}
                    className={`py-3 px-4 rounded-xl font-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                      isPro
                        ? 'bg-amber-400/15 border border-amber-400/40 text-amber-300'
                        : 'bg-amber-400 hover:bg-amber-300 text-dark-950'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    <span>{isPro ? 'PRO' : 'Seja PRO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/app/configuracoes')}
                    aria-label="Configurações"
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Coleção de Player Cards Obtidos (Miniaturas Limpas dos Próprios Player Cards) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 px-1">
              <span className="text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-neon" />
                Coleção de Player Cards ({unlockedCards.length}/{CARD_THEMES.length})
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400">
                Clique em um card para equipar
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
              {CARD_THEMES.map((theme, idx) => {
                const isLocked = theme.isPremium && !isPro;
                const isEquipped = activeThemeIndex === idx;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    title={theme.name}
                    onClick={() => {
                      if (isLocked) {
                        navigate('/app/seja-pro');
                        return;
                      }
                      setActiveThemeIndex(idx);
                      updateUserProfile({ cardThemeId: theme.id });
                    }}
                    className={`rounded-2xl p-3 sm:p-4 border transition-all flex flex-col items-center justify-between gap-3 ${
                      isEquipped
                        ? 'border-neon bg-neon/10 shadow-[0_0_22px_rgba(204,255,0,0.2)]'
                        : isLocked
                          ? 'border-white/10 bg-dark-900/50 hover:border-amber-400/40'
                          : 'border-white/10 bg-dark-900/80 hover:border-white/30 hover:bg-white/5'
                    }`}
                  >
                    <MiniCleanPlayerCardIcon
                      theme={theme}
                      isEquipped={isEquipped}
                      isLocked={isLocked}
                    />
                    <span
                      className={`text-[11px] font-display font-bold text-center leading-tight line-clamp-2 ${
                        isEquipped
                          ? 'text-neon'
                          : isLocked
                            ? 'text-slate-400'
                            : 'text-slate-200'
                      }`}
                    >
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ===================================================================
           MODO EDIÇÃO DE PERFIL (ABERTO AO CLICAR EM "EDITAR PERFIL")
           =================================================================== */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-black text-xl sm:text-2xl text-white">
              Editar Perfil & Personalizar Card
            </h2>
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 transition-all"
            >
              <X className="w-4 h-4 text-neon" /> Voltar ao Perfil
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Customization Controls (abaixo do card no mobile, à esquerda no desktop) */}
            <div className="order-2 lg:order-1 lg:col-span-7 space-y-6">
              <form
                onSubmit={handleSaveProfile}
                className="glass-card rounded-3xl p-6 border border-white/15 space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
                      <Trophy className="w-4 h-4" /> Meu Player Card Oficial
                    </span>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
                      Personalizar Foto, Apelido & Card
                    </h2>
                  </div>

                  {!isPro ? (
                    <button
                      type="button"
                      onClick={() => navigate('/app/seja-pro')}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-display font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Seja PRO</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" /> Assinante PRO Ativo
                    </span>
                  )}
                </div>

                {savedBanner && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Foto, apelido e personalizações salvas com sucesso no seu perfil!
                  </div>
                )}

                {/* 1. Photo Customization */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-neon" /> 1. Foto de Perfil do Atleta:
                  </label>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-dark-950/90 border border-white/10">
                    {selectedAvatar ? (
                      <img
                        src={selectedAvatar}
                        alt="Preview"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-neon shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-dark-900 border-2 border-white/15 flex items-center justify-center text-neon font-display font-black text-xl shrink-0">
                        {user?.name ? (
                          user.name
                            .split(' ')
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                        ) : (
                          <User className="w-7 h-7 text-slate-400" />
                        )}
                      </div>
                    )}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={removingBg}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl bg-neon hover:bg-neon-400 disabled:opacity-60 text-dark-950 font-display font-extrabold text-xs flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {removingBg ? 'Recortando fundo...' : 'Enviar Minha Foto do Dispositivo'}
                        </button>
                        {selectedAvatar && (
                          <button
                            type="button"
                            onClick={() => setSelectedAvatar('')}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remover Foto
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Envie uma foto real do seu dispositivo. Caso não envie, suas iniciais serão exibidas no card.
                      </p>

                      {/* Controle de Tamanho da Foto no Player Card */}
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-200">
                            Tamanho da Foto no Player Card:
                          </span>
                          <span className="text-[11px] font-display font-black text-neon">
                            {avatarScale}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={70}
                            max={140}
                            step={5}
                            value={avatarScale}
                            onChange={(e) => setAvatarScale(Number(e.target.value))}
                            className="w-full accent-neon cursor-pointer"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: 'Pequena (85%)', val: 85 },
                            { label: 'Padrão (100%)', val: 100 },
                            { label: 'Grande (115%)', val: 115 },
                            { label: 'Extra (130%)', val: 130 },
                          ].map((preset) => (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={() => setAvatarScale(preset.val)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                Number(avatarScale) === preset.val
                                  ? 'bg-neon text-dark-950 border-neon'
                                  : 'bg-dark-900 text-slate-300 border-white/10 hover:border-white/30'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Nickname & Position */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      2. Apelido de Quadra (Exibido no Card):
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder='Ex: "Flash", "Paredão", "Camisa 10"'
                      className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-neon"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      3. Posição & Modalidade Principal:
                    </label>
                    <select
                      value={positionRole}
                      onChange={(e) => setPositionRole(e.target.value)}
                      className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
                    >
                      <option value="Atacante • Futebol / Society">Atacante (ATA) • Futebol / Society</option>
                      <option value="Ala / Ponta • Futebol / Futsal">Ala / Ponta (ALA) • Futebol / Futsal</option>
                      <option value="Meia / Armador • Futebol / Society">Meia / Armador (MEI) • Futebol / Society</option>
                      <option value="Zagueiro / Fixo • Futebol / Futsal">Zagueiro / Fixo (ZAG) • Futebol / Futsal</option>
                      <option value="Goleiro • Futebol / Society">Goleiro (GOL) • Futebol / Society</option>
                      <option value="Beach Tennis">Beach Tennis (BT)</option>
                      <option value="Vôlei">Vôlei (VOL)</option>
                      <option value="Futevôlei">Futevôlei (FTV)</option>
                    </select>
                  </div>
                </div>

                {/* 3. Card Skin Selector */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-neon" /> 4. Escolher Modelo do Player Card:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {CARD_THEMES.map((theme, idx) => {
                      const isLocked = theme.isPremium && !isPro;
                      const isSelected = activeThemeIndex === idx;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          title={theme.name}
                          onClick={() => {
                            if (isLocked) {
                              navigate('/app/seja-pro');
                              return;
                            }
                            setActiveThemeIndex(idx);
                            updateUserProfile({ cardThemeId: theme.id });
                          }}
                          className={`rounded-2xl p-2.5 border transition-all flex flex-col items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'border-neon bg-neon/10'
                              : 'border-white/10 bg-dark-950 hover:border-white/30'
                          }`}
                        >
                          <MiniCleanPlayerCardIcon
                            theme={theme}
                            isEquipped={isSelected}
                            isLocked={isLocked}
                          />
                          <span
                            className={`text-[10px] font-display font-bold text-center leading-tight line-clamp-2 ${
                              isSelected
                                ? 'text-neon'
                                : isLocked
                                  ? 'text-slate-400'
                                  : 'text-slate-200'
                            }`}
                          >
                            {theme.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Standard & Exclusive PRO Badges */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300">
                    5. Insígnias & Emblemas de Destaque:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STANDARD_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setCustomTag(tag)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          customTag === tag
                            ? 'bg-neon/20 border-neon text-neon'
                            : 'bg-dark-950 border-white/10 text-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                      <Crown className="w-3.5 h-3.5" /> Emblemas Exclusivos para Assinantes PRO:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {PRO_EXCLUSIVE_TAGS.map((proTag) => (
                        <button
                          key={proTag}
                          type="button"
                          onClick={() => {
                            if (!isPro) {
                              navigate('/app/seja-pro');
                              return;
                            }
                            setCustomTag(proTag);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            customTag === proTag
                              ? 'bg-amber-400 text-dark-950 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                              : isPro
                                ? 'bg-amber-400/10 border-amber-400/40 text-amber-300 hover:bg-amber-400/20'
                                : 'bg-dark-950/60 border-white/10 text-slate-500'
                          }`}
                        >
                          {!isPro && <Lock className="w-3 h-3 text-amber-400" />}
                          <span>{proTag}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-display font-bold text-xs sm:text-sm transition-all"
                  >
                    Voltar ao Perfil
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Live Player Card Preview (no topo no mobile para visualizar ao ajustar a foto) */}
            <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center">
              <PlayerCard
                player={basePlayer}
                theme={currentTheme}
                customTag={customTag}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
