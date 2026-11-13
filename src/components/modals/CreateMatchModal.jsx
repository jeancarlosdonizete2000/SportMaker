import React, { useState } from 'react';
import { X, Plus, Calendar, Clock, Users, DollarSign, ShieldCheck, Crown } from 'lucide-react';
import { ARENAS_DATA } from '../../data/mockData';

export default function CreateMatchModal({ isOpen, onClose, onCreateMatch, currentUser }) {
  const isPro = !!currentUser?.isPro && currentUser?.proStatus === 'active';
  const [title, setTitle] = useState('');
  const [arenaId, setArenaId] = useState(ARENAS_DATA[0].id);
  const [time, setTime] = useState('Hoje, 20:30');
  const [totalSlots, setTotalSlots] = useState(14);
  const [pricePerPlayer, setPricePerPlayer] = useState(isPro ? 17 : 20);
  const [positionsInput, setPositionsInput] = useState('Goleiro, Fixo, Ala');

  if (!isOpen) return null;

  const selectedArena = ARENAS_DATA.find((a) => a.id === Number(arenaId)) || ARENAS_DATA[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newLobby = {
      id: `lobby_${Date.now()}`,
      title: title.trim(),
      arena: `${selectedArena.name} • Quadra Principal`,
      time,
      distance: selectedArena.distance,
      totalSlots: Number(totalSlots),
      filledSlots: 1,
      pricePerPlayer: Number(pricePerPlayer),
      isProHost: isPro,
      freeBallIncluded: isPro,
      host: {
        name: currentUser?.nickname
          ? `${currentUser.name} "${currentUser.nickname}"`
          : currentUser?.name || 'Atleta Verificado',
        rating: currentUser?.ovr || 88,
        isPro,
        avatar:
          currentUser?.avatar ||
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      },
      neededPositions: positionsInput
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
    };

    onCreateMatch(newLobby);
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-dark-900 border border-white/15 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Organizador Autenticado:{' '}
              {currentUser?.name}
              {isPro && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-dark-950 text-[9px] font-black uppercase flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Host PRO
                </span>
              )}
            </span>
            <h3 className="font-display font-black text-xl text-white mt-0.5">
              Criar Nova Partida Aberta (Lobby)
            </h3>
            <p className="text-xs text-slate-400">
              Convide amigos e abra vagas para atletas próximos completarem o seu time.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isPro && (
          <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-200 flex items-center justify-between">
            <span>
              👑 <strong>Benefício PRO Ativo:</strong> Taxa reduzida (-15%) na criação da partida +{' '}
              <strong>Bola Oficial Grátis</strong> garantida na arena!
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Título da Partida / Nível
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Society Quinta Nível Intermediário"
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-neon"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Escolha a Arena
              </label>
              <select
                value={arenaId}
                onChange={(e) => setArenaId(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
              >
                {ARENAS_DATA.map((arena) => (
                  <option key={arena.id} value={arena.id} className="bg-dark-900 text-white">
                    {arena.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Data & Horário
              </label>
              <div className="flex items-center gap-2 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5">
                <Clock className="w-4 h-4 text-neon shrink-0" />
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-transparent text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Total de Jogadores
              </label>
              <div className="flex items-center gap-2 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5">
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                <input
                  type="number"
                  min={2}
                  max={30}
                  value={totalSlots}
                  onChange={(e) => setTotalSlots(e.target.value)}
                  className="w-full bg-transparent text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Valor por Atleta (R$)
              </label>
              <div className="flex items-center gap-2 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5">
                <DollarSign className="w-4 h-4 text-neon shrink-0" />
                <input
                  type="number"
                  min={0}
                  value={pricePerPlayer}
                  onChange={(e) => setPricePerPlayer(e.target.value)}
                  className="w-full bg-transparent text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Posições Procuradas (separadas por vírgula)
            </label>
            <input
              type="text"
              value={positionsInput}
              onChange={(e) => setPositionsInput(e.target.value)}
              placeholder="Goleiro, Zagueiro, Atacante"
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-neon"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Publicar Partida
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

