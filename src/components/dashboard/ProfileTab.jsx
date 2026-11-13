import React, { useState, useRef } from 'react';
import {
  Trophy,
  SlidersHorizontal,
  Award,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  Crown,
  Lock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PLAYER_ARCHETYPES, CARD_THEMES } from '../../data/mockData';
import PlayerCard from '../cards/PlayerCard';
import { useAuth } from '../../context/AuthContext';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
];

const STANDARD_TAGS = [
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

  const [nickname, setNickname] = useState(user?.nickname || 'Flash');
  const [selectedAvatar, setSelectedAvatar] = useState(
    user?.avatar || PLAYER_ARCHETYPES[0].avatar
  );
  const [activeThemeIndex, setActiveThemeIndex] = useState(isPro ? 2 : 0);
  const [customTag, setCustomTag] = useState(user?.customTag || STANDARD_TAGS[0]);
  const [positionRole, setPositionRole] = useState(
    user?.positionRole || 'Atacante / Ala • Futebol Society'
  );
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({
        nickname: nickname.trim(),
        avatar: selectedAvatar,
        positionRole,
        customTag,
      });
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const basePlayer = {
    ...PLAYER_ARCHETYPES[0],
    name: user?.name || PLAYER_ARCHETYPES[0].name,
    nickname: nickname.trim(),
    avatar: selectedAvatar,
    ovr: isPro ? 95 : user?.ovr || 91,
    role: positionRole,
    isPro,
    badgesList: isPro
      ? [
          '👑 Assinante PRO VIP',
          '⚡ Prioridade na Fila',
          '⚽ Bola Oficial Grátis',
          ...PLAYER_ARCHETYPES[0].badgesList.slice(0, 2),
        ]
      : PLAYER_ARCHETYPES[0].badgesList,
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

          {/* 1. Photo Customization (Upload from Device or Choose Avatar Preset) */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-neon" /> 1. Foto de Perfil do Atleta:
            </label>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-dark-950/90 border border-white/10">
              <img
                src={selectedAvatar}
                alt="Preview"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-neon shrink-0"
              />
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
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Enviar Foto do Dispositivo
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ou selecione um dos avatares esportivos rápidos abaixo:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {AVATAR_PRESETS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(url)}
                  className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedAvatar === url
                      ? 'border-neon scale-105 shadow-neon'
                      : 'border-white/15 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
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
              <input
                type="text"
                value={positionRole}
                onChange={(e) => setPositionRole(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
              />
            </div>
          </div>

          {/* 3. Card Skin Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neon" /> 4. Tema Visual do Card:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {CARD_THEMES.map((theme, idx) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setActiveThemeIndex(idx)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    activeThemeIndex === idx
                      ? `${theme.accentBg} border-transparent`
                      : 'bg-dark-950 text-slate-300 border-white/10 hover:border-white/30'
                  }`}
                >
                  {theme.name}
                </button>
              ))}
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
        />
      </div>
    </div>
  );
}
