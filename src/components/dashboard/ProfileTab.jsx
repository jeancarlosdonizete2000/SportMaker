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

export default function ProfileTab() {
  const { user, isPro, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Customization Controls */}
      <div className="lg:col-span-7 space-y-6">
        {/* Atalho Mobile / Rápido para Seja PRO */}
        <div className="md:hidden glass-card rounded-2xl p-4 border border-amber-400/30 bg-amber-400/10 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
              <Crown className="w-4 h-4" /> {isPro ? 'Sport Maker PRO Ativo' : 'Assine o Sport Maker PRO'}
            </p>
            <p className="text-[11px] text-slate-300">
              {isPro ? 'Gerencie seus benefícios e campeonatos.' : 'Prioridade de fila, bola grátis e descontos.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/seja-pro')}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-display font-black text-xs shrink-0"
          >
            {isPro ? 'Ver PRO' : 'Seja PRO'}
          </button>
        </div>
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

          {/* 1. Photo Customization (Upload from Device only, no fictitious images) */}
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
              </div>
            </div>
          </div>

          {/* 2. Nickname (Apelido de Quadra) & Position */}
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
                <option value="Padel / Tênis">Padel / Tênis (PDL)</option>
                <option value="Futevôlei">Futevôlei (FTV)</option>
              </select>
            </div>
          </div>

          {/* 3. Card Skin Selector (Standard + Exclusive Animated EA FC PRO Cards) */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-neon" /> 4. Cartinhas Básicas (Estilo EA Sports FC):
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {CARD_THEMES.map((theme, idx) => {
                  if (theme.isPremium) return null;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setActiveThemeIndex(idx);
                        updateUserProfile({ cardThemeId: theme.id });
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        activeThemeIndex === idx
                          ? `${theme.accentBg} border-transparent`
                          : 'bg-dark-950 text-slate-300 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {theme.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-dark-950 to-dark-950 border border-amber-400/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" /> Cartinhas Animadas Exclusivas PRO (Ouro, Raio ⚡ & Fogo 🔥):
                </span>
                {!isPro && (
                  <span className="text-[10px] font-bold text-amber-300">
                    Requer Sport Maker PRO
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {CARD_THEMES.map((theme, idx) => {
                  if (!theme.isPremium) return null;
                  const isSelected = activeThemeIndex === idx;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        if (!isPro) {
                          navigate('/app/seja-pro');
                          return;
                        }
                        setActiveThemeIndex(idx);
                        updateUserProfile({ cardThemeId: theme.id });
                      }}
                      className={`py-3 px-3 rounded-xl text-xs font-display font-extrabold border transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? `${theme.accentBg} border-transparent scale-[1.02] shadow-lg`
                          : isPro
                            ? 'bg-dark-900/90 text-amber-200 border-amber-400/40 hover:border-amber-300'
                            : 'bg-dark-950/70 text-slate-400 border-white/10 hover:border-amber-400/40'
                      }`}
                    >
                      {!isPro && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <span className="truncate">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
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

            {/* Exclusive PRO Emblems */}
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

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Salvar Foto & Apelido no Perfil'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right Live Player Card */}
      <div className="lg:col-span-5 flex justify-center">
        <PlayerCard
          player={basePlayer}
          theme={currentTheme}
          customTag={customTag}
          enableDownload
        />
      </div>
    </div>
  );
}
