import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ownerService } from '../../services/ownerService';

const STORAGE_TEAMS_KEY = 'sportmaker_user_teams';

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
    size === 'sm'
      ? 'w-14 h-16'
      : 'w-28 h-32 sm:w-32 sm:h-36';

  return (
    <div
      className={`${dimensions} ${shapeObj.className} bg-gradient-to-b ${colorObj.bg} border-4 ${colorObj.border} shadow-2xl flex flex-col items-center justify-center relative select-none shrink-0`}
    >
      <IconComp className={size === 'sm' ? `w-5 h-5 ${colorObj.text}` : `w-10 h-10 ${colorObj.text} drop-shadow`} />
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
  const [savedBanner, setSavedBanner] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_TEAMS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedTeams(parsed);
      }
    } catch {
      // ignora erro
    }

    ownerService
      .getFriendsData()
      .then((data) => {
        if (Array.isArray(data?.friends)) {
          setFriends(data.friends);
        }
      })
      .catch(() => {});
  }, []);

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
          name: friend.name,
          nickname: friend.nickname || '',
          avatar: friend.avatar || '',
          ovr: friend.ovr || 75,
          sport: friend.sport || 'Atleta',
        },
      ];
    });
  };

  const handleSaveTeam = (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    const captain = {
      id: user?._id || 'captain',
      name: user?.name || 'Você (Capitão)',
      nickname: user?.nickname || '',
      avatar: user?.avatar || '',
      ovr: user?.ovr || 80,
      isCaptain: true,
    };

    const newTeam = {
      id: `team_${Date.now()}`,
      name: teamName.trim(),
      sport: teamSport,
      emblem: {
        ...emblem,
        tag: (emblem.tag || teamName.slice(0, 3)).toUpperCase(),
      },
      members: [captain, ...selectedMembers],
      createdAt: new Date().toISOString(),
    };

    const updated = [newTeam, ...savedTeams];
    setSavedTeams(updated);
    try {
      localStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(updated));
    } catch {
      // ignora erro
    }

    setSavedBanner(`Time "${newTeam.name}" criado e salvo com sucesso!`);
    setTimeout(() => setSavedBanner(''), 4000);
  };

  const handleDeleteTeam = (teamId) => {
    const updated = savedTeams.filter((t) => t.id !== teamId);
    setSavedTeams(updated);
    try {
      localStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(updated));
    } catch {
      // ignora erro
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 border border-white/15">
        <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
          <Shield className="w-4 h-4" /> Criador de Equipes & Escudos
        </span>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
          Meus Times & Emblema
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Personalize o escudo do seu time, convoque seus amigos da lista para o elenco e utilize sua equipe nos Campeonatos.
        </p>
      </div>

      {savedBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Criador de Emblema + Dados do Time + Convocação de Amigos */}
        <form
          onSubmit={handleSaveTeam}
          className="lg:col-span-7 glass-card rounded-3xl p-6 border border-white/15 space-y-6"
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
                <strong className="text-neon">{selectedMembers.length + 1} atletas</strong> no elenco
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
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Ex: Galácticos FC"
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Sigla (3 Letras)
              </label>
              <input
                type="text"
                maxLength={3}
                value={emblem.tag}
                onChange={(e) =>
                  setEmblem((prev) => ({ ...prev, tag: e.target.value.toUpperCase() }))
                }
                placeholder="GAL"
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white uppercase font-display font-black focus:outline-none focus:border-neon"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              2. Modalidade do Time
            </label>
            <select
              value={teamSport}
              onChange={(e) => setTeamSport(e.target.value)}
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
            >
              <option value="Futebol Society">Futebol Society</option>
              <option value="Beach Tennis">Beach Tennis</option>
              <option value="Padel & Tênis">Padel & Tênis</option>
              <option value="Futevôlei">Futevôlei</option>
            </select>
          </div>

          {/* 3. Personalizar Emblema (Formato, Cor e Símbolo) */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-neon" /> 3. Montar Emblema do Time:
            </label>

            {/* Formato do Escudo */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Formato do Escudo:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {EMBLEM_SHAPES.map((shape) => (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => setEmblem((prev) => ({ ...prev, shapeId: shape.id }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      emblem.shapeId === shape.id
                        ? 'bg-neon text-dark-950 border-neon'
                        : 'bg-dark-950 text-slate-300 border-white/10 hover:border-white/25'
                    }`}
                  >
                    {shape.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Cores do Escudo */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Cores do Escudo:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EMBLEM_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setEmblem((prev) => ({ ...prev, colorId: color.id }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                      emblem.colorId === color.id
                        ? 'border-neon bg-white/10 text-white'
                        : 'border-white/10 bg-dark-950 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-gradient-to-b ${color.bg} border ${color.border} shrink-0`}
                    />
                    <span className="truncate">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ícone / Símbolo */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Símbolo Central:
              </span>
              <div className="flex flex-wrap gap-2">
                {EMBLEM_ICONS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEmblem((prev) => ({ ...prev, iconId: id }))}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      emblem.iconId === id
                        ? 'bg-neon text-dark-950 border-neon'
                        : 'bg-dark-950 text-slate-300 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Chamar Amigos para o Time */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-neon" /> 4. Chamar Amigos para o Elenco ({selectedMembers.length} convocados):
              </label>
            </div>

            {friends.length === 0 ? (
              <div className="p-4 rounded-2xl bg-dark-950/70 border border-white/10 text-xs text-slate-400">
                Você ainda não possui amigos adicionados na sua lista. Adicione amigos na aba <strong>Amigos</strong> para convocá-los para o seu time!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {friends.map((friend) => {
                  const isSelected = selectedMembers.some(
                    (m) => String(m.id) === String(friend.id)
                  );
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => toggleFriendInTeam(friend)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-neon/15 border-neon text-white'
                          : 'bg-dark-950 border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-9 h-9 rounded-full object-cover border border-neon shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-dark-900 border border-white/15 flex items-center justify-center font-display font-black text-xs text-neon shrink-0">
                            {(friend.name || 'AT').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">
                            {friend.name}
                          </p>
                          <span className="text-[10px] text-slate-400 block truncate">
                            OVR {friend.ovr || 75} • {friend.sport || 'Atleta'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 flex items-center gap-1 ${
                          isSelected
                            ? 'bg-neon text-dark-950'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> No Time
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" /> Chamar
                          </>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Salvar Time & Emblema</span>
            </button>
          </div>
        </form>

        {/* Coluna Direita: Lista de Times Criados */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="font-display font-black text-lg text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-neon" /> Times Montados ({savedTeams.length})
          </h3>

          {savedTeams.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 border border-white/10 text-center space-y-2">
              <Shield className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="font-display font-bold text-base text-white">
                Nenhum time salvo ainda
              </p>
              <p className="text-xs text-slate-400">
                Configure o emblema ao lado, convoque seus amigos e clique em "Salvar Time & Emblema".
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedTeams.map((team) => (
                <div
                  key={team.id}
                  className="glass-card rounded-3xl p-5 border border-white/15 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <TeamEmblemPreview emblem={team.emblem} size="sm" />
                      <div>
                        <h4 className="font-display font-black text-lg text-white">
                          {team.name}
                        </h4>
                        <span className="text-xs text-neon font-semibold">
                          {team.sport} • {team.members?.length || 1} jogadores
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(team.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition"
                      title="Excluir Time"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Elenco do Time */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Elenco Convocado:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(team.members || []).map((member) => (
                        <span
                          key={member.id}
                          className="px-2.5 py-1 rounded-xl bg-dark-950 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                        >
                          <span>{member.name}</span>
                          {member.isCaptain && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon/20 text-neon font-black">
                              CAP
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
