import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Check,
  MessageSquare,
  Trophy,
  Search,
  Sparkles,
} from 'lucide-react';
import { FRIENDS_DATA, FRIEND_SUGGESTIONS } from '../../data/mockData';

export default function FriendsTab() {
  const [friends, setFriends] = useState(FRIENDS_DATA);
  const [suggestions, setSuggestions] = useState(FRIEND_SUGGESTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedIds, setInvitedIds] = useState({});

  const handleAddSuggestion = (person) => {
    setFriends((prev) => [
      ...prev,
      {
        id: person.id,
        name: person.name,
        handle: `@${person.name.toLowerCase().replace(/\s+/g, '')}`,
        sport: person.sport,
        ovr: person.ovr,
        status: 'Novo Amigo • Online',
        isOnline: true,
        avatar: person.avatar,
        mutualMatches: 1,
      },
    ]);
    setSuggestions((prev) => prev.filter((item) => item.id !== person.id));
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.sport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Rede Social de Atletas
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
            Meus Amigos ({friends.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Convide seus amigos para fechar time, acompanhe quem está online nas arenas e adicione novos parceiros.
          </p>
        </div>

        <div className="w-full sm:w-72 flex items-center gap-2 bg-dark-950 border border-white/15 rounded-2xl px-3.5 py-2.5">
          <Search className="w-4 h-4 text-neon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar amigo ou esporte..."
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Friends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFriends.map((friend) => {
          const invited = invitedIds[friend.id];
          return (
            <div
              key={friend.id}
              className="glass-card rounded-2xl p-5 border border-white/10 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-white/20"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-dark-900 ${
                      friend.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-white">
                      {friend.name}
                    </h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-neon/15 text-neon">
                      OVR {friend.ovr}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{friend.sport}</p>
                  <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                    {friend.status} • {friend.mutualMatches} jogos juntos
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setInvitedIds((prev) => ({ ...prev, [friend.id]: !prev[friend.id] }))
                }
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  invited
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-neon text-dark-950 hover:bg-neon-400'
                }`}
              >
                {invited ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Convocado
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5" /> Chamar p/ Jogo
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Friend Suggestions Near You */}
      {suggestions.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neon" /> Sugestões de Atletas Próximos de Você
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((person) => (
              <div
                key={person.id}
                className="p-4 rounded-2xl bg-dark-900/90 border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-12 h-12 rounded-full object-cover border border-neon"
                  />
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      {person.name}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neon">
                        OVR {person.ovr}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {person.sport} • {person.distance}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAddSuggestion(person)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-neon hover:text-dark-950 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

