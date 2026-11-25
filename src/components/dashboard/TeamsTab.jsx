import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Trophy,
  Flame,
  Zap,
  Crown,
  Star,
  Award,
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  Palette,
  Sparkles,
  Plus,
  ArrowLeft,
  Bell,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ownerService } from '../../services/ownerService';

const EMBLEM_ICONS = [
  { id: 'shield', label: 'Escudo', Icon: Shield },
  { id: 'trophy', label: 'Troféu', Icon: Trophy },
  { id: 'flame', label: 'Chama', Icon: Flame },
  { id: 'zap', label: 'Raio', Icon: Zap },
  { id: 'crown', label: 'Coroa', Icon: Crown },
  { id: 'star', label: 'Estrela', Icon: Star },
  { id: 'award', label: 'Medalha', Icon: Award },
];

const EMBLEM_COLORS = [
  { id: 'neon', name: 'Cyber Lime', bg: 'from-lime-400 to-emerald-700', border: 'border-lime-300', text: 'text-dark-950' },
  { id: 'gold', name: 'Ouro Real', bg: 'from-amber-300 via-yellow-500 to-amber-800', border: 'border-amber-200', text: 'text-dark-950' },
  { id: 'crimson', name: 'Rubro Negro', bg: 'from-red-500 via-red-700 to-zinc-950', border: 'border-red-400', text: 'text-white' },
  { id: 'royal', name: 'Azul Imperial', bg: 'from-cyan-400 via-blue-600 to-indigo-950', border: 'border-cyan-300', text: 'text-white' },
  { id: 'purple', name: 'Galáctico Neon', bg: 'from-fuchsia-400 via-purple-600 to-slate-950', border: 'border-fuchsia-300', text: 'text-white' },
  { id: 'emerald', name: 'Esmeralda', bg: 'from-emerald-400 via-teal-600 to-slate-950', border: 'border-emerald-300', text: 'text-white' },
];

const EMBLEM_SHAPES = [
  { id: 'shield', name: 'Escudo Clássico', className: 'rounded-t-2xl rounded-b-[36px]' },
  { id: 'circle', name: 'Redondo Oficial', className: 'rounded-full' },
  { id: 'diamond', name: 'Hexa Moderno', className: 'rounded-3xl rotate-3' },
];

export function TeamEmblemPreview({ emblem, size = 'lg' }) {
  const colorObj = EMBLEM_COLORS.find((c) => c.id === emblem?.colorId) || EMBLEM_COLORS[0];
  const shapeObj = EMBLEM_SHAPES.find((s) => s.id === emblem?.shapeId) || EMBLEM_SHAPES[0];
  const iconObj = EMBLEM_ICONS.find((i) => i.id === emblem?.iconId) || EMBLEM_ICONS[0];
  const IconComp = iconObj.Icon;

  const dimensions =
    size === 'sm' ? 'w-14 h-16' : 'w-28 h-32 sm:w-32 sm:h-36';

  return (
    <div
      className={`${dimensions} ${shapeObj.className} bg-gradient-to-b ${colorObj.bg} border-4 ${colorObj.border} shadow-2xl flex flex-col items-center justify-center relative select-none shrink-0`}
    >
      <IconComp
        className={
          size === 'sm'
            ? `w-5 h-5 ${colorObj.text}`
            : `w-10 h-10 ${colorObj.text} drop-shadow`
        }
      />
      <span
        className={`font-display font-black uppercase tracking-widest mt-1 ${colorObj.text} ${
          size === 'sm' ? 'text-[10px]' : 'text-sm sm:text-base'
        }`}
      >
        {(emblem?.tag || 'SM').slice(0, 3)}
      </span>
    </div>
  );
}

export default function TeamsTab() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const [teamName, setTeamName] = useState('Real Sport Maker FC');
  const [teamSport, setTeamSport] = useState('Futebol Society');
  const [emblem, setEmblem] = useState({
    tag: 'RSM',
    colorId: 'neon',
    shapeId: 'shield',
    iconId: 'shield',
  });

  const [friends, setFriends] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [savedTeams, setSavedTeams] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState('');

  const loadTeamsData = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const data = await ownerService.getMyTeams();
      setSavedTeams(data.teams || []);
      setPendingInvites(data.pendingInvites || []);
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    loadTeamsData();
    ownerService
      .getFriendsData()
      .then((data) => {
        if (Array.isArray(data?.friends)) {
          setFriends(data.friends);
        }
      })
      .catch(() => {});
  }, [loadTeamsData]);

  const toggleFriendInTeam = (friend) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((m) => String(m.id) === String(friend.id));
      if (exists) {
        return prev.filter((m) => String(m.id) !== String(friend.id));
      }
      return [
        ...prev,
        {
          id: friend.id,
          userId: friend.id,
          name: friend.name,
          nickname: friend.nickname || '',
          avatar: friend.avatar || '',
          ovr: friend.ovr || 0,
          sport: friend.sport || 'Atleta',
        },
      ];
    });
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setSaving(true);
    try {
      const res = await ownerService.createTeam({
        name: teamName.trim(),
        sport: teamSport,
        emblem: {
          ...emblem,
          tag: (emblem.tag || teamName.slice(0, 3)).toUpperCase(),
        },
        invitedMembers: selectedMembers,
      });
      if (res?.team) {
        setSavedTeams((prev) => [res.team, ...prev]);
      }
      setSelectedMembers([]);
      setIsCreating(false);
      setSavedBanner(
        res?.message ||
          `Time "${teamName.trim()}" criado! Os amigos convocados receberam uma notificação.`
      );
      setTimeout(() => setSavedBanner(''), 4500);
    } catch (err) {
      setSavedBanner(err.message || 'Não foi possível criar o time.');
    } finally {
      setSaving(false);
    }
  };

  const handleRespondInvite = async (teamId, action) => {
    try {
      const res = await ownerService.respondToTeamInvite(teamId, action);
      setPendingInvites((prev) => prev.filter((t) => String(t.id) !== String(teamId)));
      if (action === 'accept' && res?.team) {
        setSavedTeams((prev) => [
          res.team,
          ...prev.filter((t) => String(t.id) !== String(teamId)),
        ]);
      }
      if (res?.message) {
        setSavedBanner(res.message);
        setTimeout(() => setSavedBanner(''), 4000);
      }
    } catch {
      // ignora
    }
  };

  const handleDeleteTeam = async (teamId) => {
    await ownerService.deleteTeam(teamId).catch(() => {});
    setSavedTeams((prev) => prev.filter((t) => String(t.id) !== String(teamId)));
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header em Evidência: Meus Times + Botão Criar Time */}
      <div className="glass-card rounded-3xl p-6 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> Equipes & Escudos Oficiais
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
            {isCreating ? 'Criar Novo Time' : `Meus Times (${savedTeams.length})`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {isCreating
              ? 'Monte o escudo, escolha a modalidade e convoque seus amigos (eles receberão notificação para aceitar).'
              : 'Gerencie suas equipes oficiais, acompanhe convocações aceitas e dispute campeonatos.'}
          </p>
        </div>

        {isCreating ? (
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="shrink-0 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-display font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-neon" />
            Voltar para Meus Times
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="shrink-0 px-5 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Criar Time
          </button>
        )}
      </div>

      {savedBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      {/* ===================================================================
          VISÃO PRINCIPAL: MEUS TIMES EM EVIDÊNCIA + CONVOCAÇÕES PENDENTES
         =================================================================== */}
      {!isCreating ? (
        <div className="space-y-6">
          {/* Convocações Pendentes Recebidas */}
          {pendingInvites.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border-2 border-amber-400/40 bg-amber-400/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-lg text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  Convocações para Times ({pendingInvites.length})
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-amber-400 text-dark-950 text-[10px] font-black uppercase">
                  Aguardando sua resposta
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingInvites.map((team) => (
                  <div
                    key={team.id}
                    className="p-4 rounded-2xl bg-dark-950/90 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <TeamEmblemPreview emblem={team.emblem} size="sm" />
                      <div>
                        <h4 className="font-display font-extrabold text-base text-white">
                          {team.name}
                        </h4>
                        <p className="text-xs text-slate-300">
                          {team.sport} • Capitão: <strong>{team.captainName}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRespondInvite(team.id, 'accept')}
                        className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-dark-950 text-xs font-display font-extrabold flex items-center gap-1"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" /> Aceitar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespondInvite(team.id, 'decline')}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 text-xs font-bold flex items-center gap-1"
                      >
                        <X className="w-4 h-4" /> Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista em Evidência de Meus Times */}
          {loadingTeams ? (
            <div className="glass-card rounded-3xl p-8 border border-white/10 text-center text-xs text-slate-400">
              Carregando seus times...
            </div>
          ) : savedTeams.length === 0 ? (
            <div className="glass-card rounded-3xl p-10 border border-white/10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-neon/10 border border-neon/30 text-neon mx-auto flex items-center justify-center">
                <Shield className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="font-display font-bold text-lg text-white">
                  Você ainda não faz parte de nenhum time.
                </p>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Crie seu próprio time com escudo personalizado e convoque seus amigos para jogar campeonatos!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Criar Meu Primeiro Time
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {savedTeams.map((team) => {
                const isCaptain = String(team.captainId) === String(user?._id);
                const acceptedMembers = (team.members || []).filter(
                  (m) => m.status !== 'pending'
                );
                const pendingMembers = (team.members || []).filter(
                  (m) => m.status === 'pending'
                );

                return (
                  <div
                    key={team.id}
                    className="glass-card rounded-3xl p-5 sm:p-6 border border-white/15 hover:border-neon/40 transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <TeamEmblemPreview emblem={team.emblem} size="sm" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display font-black text-xl text-white">
                              {team.name}
                            </h3>
                            {isCaptain && (
                              <span className="px-2 py-0.5 rounded-full bg-neon/15 border border-neon/30 text-neon text-[10px] font-black uppercase">
                                Capitão
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {team.sport} •{' '}
                            <strong className="text-emerald-400">
                              {acceptedMembers.length} confirmados
                            </strong>
                            {pendingMembers.length > 0 && (
                              <span className="text-amber-300">
                                {' '}
                                • {pendingMembers.length} aguardando aceite
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTeam(team.id)}
                        title={isCaptain ? 'Excluir time' : 'Sair do time'}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Elenco Confirmado */}
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
                      {acceptedMembers.map((m) => (
                        <span
                          key={m.userId || m.id}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-200 font-semibold"
                        >
                          {m.isCaptain ? '👑 ' : ''}
                          {m.name}
                        </span>
                      ))}
                      {pendingMembers.map((m) => (
                        <span
                          key={m.userId || m.id}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 font-semibold flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" /> {m.name} (Convocado)
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ===================================================================
           FORMULÁRIO: CRIAR TIME + ESCUDO + CONVOCAÇÃO DE AMIGOS
           =================================================================== */
        <form
          onSubmit={handleSaveTeam}
          className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6 max-w-3xl mx-auto"
        >
          {/* Preview do Emblema no topo */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-dark-950/90 border border-white/10">
            <TeamEmblemPreview emblem={emblem} size="lg" />
            <div className="space-y-2 text-center sm:text-left flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-neon">
                Preview do Escudo Oficial
              </span>
              <h3 className="font-display font-black text-2xl text-white">
                {teamName || 'Nome do Time'}
              </h3>
              <p className="text-xs text-slate-400">
                Modalidade: <strong className="text-slate-200">{teamSport}</strong> •{' '}
                <strong className="text-neon">{selectedMembers.length + 1} atletas</strong>{' '}
                (você + {selectedMembers.length} convocados)
              </p>
            </div>
          </div>

          {/* 1. Nome, Sigla e Esporte */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                1. Nome do Time
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Ex: Galácticos FC"
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Abreviação / Tag do Time
              </label>
              <input
                type="text"
                maxLength={4}
                value={emblem.tag}
                onChange={(e) =>
                  setEmblem((prev) => ({
                    ...prev,
                    tag: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                  }))
                }
                placeholder="Ex: RSM"
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white uppercase font-black tracking-widest focus:outline-none focus:border-neon"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Aparecerá como <strong className="text-neon">[{emblem.tag || 'TAG'}]</strong> no nome dos jogadores
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              2. Modalidade Principal
            </label>
            <select
              value={teamSport}
              onChange={(e) => setTeamSport(e.target.value)}
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
            >
              <option value="Futebol Society">Futebol Society</option>
              <option value="Beach Tennis">Beach Tennis</option>
              <option value="Vôlei">Vôlei</option>
              <option value="Futevôlei">Futevôlei</option>
            </select>
          </div>

          {/* 3. Cores, Formato e Ícone do Escudo */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-neon" /> 3. Cor do Escudo
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {EMBLEM_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setEmblem((prev) => ({ ...prev, colorId: c.id }))}
                    className={`p-2 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1 ${
                      emblem.colorId === c.id
                        ? 'border-neon bg-neon/10 text-white'
                        : 'border-white/10 bg-dark-950 text-slate-400'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full bg-gradient-to-b ${c.bg} border ${c.border}`} />
                    <span className="truncate w-full text-center">{c.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Formato do Escudo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EMBLEM_SHAPES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setEmblem((prev) => ({ ...prev, shapeId: s.id }))}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all ${
                        emblem.shapeId === s.id
                          ? 'border-neon bg-neon/15 text-neon'
                          : 'border-white/10 bg-dark-950 text-slate-300'
                      }`}
                    >
                      {s.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Ícone Central
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EMBLEM_ICONS.map(({ id, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setEmblem((prev) => ({ ...prev, iconId: id }))}
                      className={`p-2.5 rounded-xl border transition-all ${
                        emblem.iconId === id
                          ? 'border-neon bg-neon text-dark-950'
                          : 'border-white/10 bg-dark-950 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Convocar Amigos */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-neon" /> 4. Convocar Amigos para o Elenco ({selectedMembers.length} selecionados):
            </label>

            {friends.length === 0 ? (
              <p className="text-xs text-slate-400 p-3.5 rounded-xl bg-dark-950 border border-white/10">
                Você ainda não tem amigos adicionados. Adicione atletas na aba Amigos para convocá-los!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {friends.map((friend) => {
                  const selected = selectedMembers.some(
                    (m) => String(m.id) === String(friend.id)
                  );
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => toggleFriendInTeam(friend)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all ${
                        selected
                          ? 'border-neon bg-neon/10 text-white'
                          : 'border-white/10 bg-dark-950 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{friend.name}</p>
                        <span className="text-[10px] text-slate-400">
                          {friend.sport || 'Atleta'} • {friend.ovr > 0 ? `OVR ${friend.ovr}` : 'Sem OVR'}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-lg font-extrabold shrink-0 ${
                          selected
                            ? 'bg-neon text-dark-950'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        {selected ? 'Convocado ✓' : 'Convocar'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-black text-xs sm:text-sm shadow-neon flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{saving ? 'Criando Time...' : 'Criar Time & Enviar Convocações'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
