import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  UserMinus,
  Check,
  MessageSquare,
  Search,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { ownerService } from '../../services/ownerService';

export default function FriendsTab() {
  const [friends, setFriends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [invitedIds, setInvitedIds] = useState({});
  const [actionId, setActionId] = useState(null);

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ownerService.getFriendsData();
      setFriends(data.friends || []);
      setSuggestions(data.suggestions || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Busca usuários reais no MongoDB conforme o usuário digita na barra de pesquisa
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const users = await ownerService.searchUsers(q);
        if (!cancelled) {
          setSearchResults(users || []);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleAddFriend = async (person) => {
    setActionId(person.id);
    try {
      const added = await ownerService.addFriend(person.id);
      const newFriend = added || {
        ...person,
        status: 'Novo Amigo • Online',
        isOnline: true,
        mutualMatches: 0,
      };
      setFriends((prev) =>
        prev.some((f) => f.id === newFriend.id) ? prev : [newFriend, ...prev]
      );
      setSuggestions((prev) => prev.filter((item) => item.id !== person.id));
      setSearchResults((prev) =>
        prev.map((u) => (u.id === person.id ? { ...u, isFriend: true } : u))
      );
    } catch {
      // erro ignorado
    } finally {
      setActionId(null);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    setActionId(friendId);
    try {
      await ownerService.removeFriend(friendId);
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      setSearchResults((prev) =>
        prev.map((u) => (u.id === friendId ? { ...u, isFriend: false } : u))
      );
    } finally {
      setActionId(null);
    }
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.nickname && f.nickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.sport && f.sport.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const nonFriendSearchResults = searchResults.filter(
    (u) => !friends.some((f) => f.id === u.id)
  );

  const renderAvatar = (person, sizeClass = 'w-12 h-12', roundedClass = 'rounded-full') => {
    if (person.avatar) {
      return (
        <img
          src={person.avatar}
          alt={person.name}
          className={`${sizeClass} ${roundedClass} object-cover border border-neon`}
        />
      );
    }
    const initials = (person.name || 'AT')
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
    return (
      <div
        className={`${sizeClass} ${roundedClass} bg-dark-950 border border-neon flex items-center justify-center font-display font-black text-xs text-neon shrink-0`}
      >
        {initials}
      </div>
    );
  };

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
            Procure qualquer usuário cadastrado pelo nome ou apelido para adicionar como amigo e convocar para jogos.
          </p>
        </div>

        <div className="w-full sm:w-80 flex items-center gap-2 bg-dark-950 border border-white/15 rounded-2xl px-3.5 py-2.5 focus-within:border-neon">
          {searching ? (
            <Loader2 className="w-4 h-4 text-neon animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-neon shrink-0" />
          )}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Procurar usuário pelo nome..."
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Resultados da Busca de Usuários no Banco de Dados */}
      {searchQuery.trim() !== '' && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-neon" /> Resultados da Busca por "{searchQuery.trim()}"
          </h3>

          {searching ? (
            <div className="glass-card rounded-2xl p-6 border border-white/10 text-center text-xs text-slate-400">
              Buscando atletas no banco de dados...
            </div>
          ) : nonFriendSearchResults.length === 0 && filteredFriends.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 border border-white/10 text-center text-xs text-slate-400">
              Nenhum usuário encontrado com esse nome no banco de dados.
            </div>
          ) : (
            nonFriendSearchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nonFriendSearchResults.map((person) => (
                  <div
                    key={person.id}
                    className="p-4 rounded-2xl bg-dark-900/90 border border-neon/30 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {renderAvatar(person, 'w-12 h-12', 'rounded-full')}
                      <div>
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          {person.name}
                          {person.nickname && (
                            <span className="text-xs text-neon">"{person.nickname}"</span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neon">
                            {person.ovr > 0 ? `OVR ${person.ovr}` : 'Sem OVR'}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400">{person.sport}</p>
                      </div>
                    </div>
                    <button
                      disabled={actionId === person.id}
                      onClick={() => handleAddFriend(person)}
                      className="px-3.5 py-2 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {actionId === person.id ? 'Adicionando...' : 'Adicionar Amigo'}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* Friends Grid */}
      {loading ? (
        <div className="glass-card rounded-3xl p-8 border border-white/10 text-center text-xs text-slate-400">
          Carregando sua lista de amigos...
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 border border-white/10 text-center space-y-2">
          <p className="font-display font-bold text-base text-white">
            {friends.length === 0
              ? 'Você ainda não adicionou amigos na sua conta.'
              : 'Nenhum amigo corresponde ao filtro digitado.'}
          </p>
          <p className="text-xs text-slate-400">
            Use o campo de busca acima para procurar outros atletas pelo nome e adicioná-los!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFriends.map((friend) => {
            const invited = invitedIds[friend.id];
            const renderAvatar = (person, sizeClass = 'w-12 h-12', roundedClass = 'rounded-full') => {
    if (person.avatar) {
      return (
        <img
          src={person.avatar}
          alt={person.name}
          className={`${sizeClass} ${roundedClass} object-cover border border-neon`}
        />
      );
    }
    const initials = (person.name || 'AT')
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
    return (
      <div
        className={`${sizeClass} ${roundedClass} bg-dark-950 border border-neon flex items-center justify-center font-display font-black text-xs text-neon shrink-0`}
      >
        {initials}
      </div>
    );
  };

  return (
              <div
                key={friend.id}
                className="glass-card rounded-2xl p-5 border border-white/10 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    {renderAvatar(friend, 'w-14 h-14', 'rounded-2xl')}
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
                        {friend.ovr > 0 ? `OVR ${friend.ovr}` : 'Sem OVR'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{friend.sport}</p>
                    <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                      {friend.status || 'Amigo Conectado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

                  <button
                    onClick={() => handleRemoveFriend(friend.id)}
                    disabled={actionId === friend.id}
                    title="Remover amigo"
                    className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/10 transition-all"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sugestões Reais de Outros Usuários Cadastrados no Banco */}
      {suggestions.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neon" /> Outros Atletas Cadastrados na Plataforma
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((person) => (
              <div
                key={person.id}
                className="p-4 rounded-2xl bg-dark-900/90 border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {renderAvatar(person, 'w-12 h-12', 'rounded-full')}
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      {person.name}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neon">
                        {person.ovr > 0 ? `OVR ${person.ovr}` : 'Sem OVR'}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">{person.sport}</p>
                  </div>
                </div>
                <button
                  disabled={actionId === person.id}
                  onClick={() => handleAddFriend(person)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-neon hover:text-dark-950 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {actionId === person.id ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

