import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  UserMinus,
  Check,
  X,
  Clock,
  MessageSquare,
  Search,
  Sparkles,
  Loader2,
  Bell,
} from 'lucide-react';
import { ownerService } from '../../services/ownerService';
import { ListCardsSkeleton } from '../ui/SkeletonLoaders';

export default function FriendsTab() {
  const navigate = useNavigate();
  const cachedFriends = ownerService.getCachedFriendsData();
  const [friends, setFriends] = useState(() => cachedFriends?.friends || []);

  const openPlayerProfile = (person) => {
    if (!person?.id) return;
    navigate(`/jogador/${person.id}`, { state: { player: person } });
  };
  const [receivedRequests, setReceivedRequests] = useState(
    () => cachedFriends?.receivedRequests || []
  );
  const [sentRequests, setSentRequests] = useState(
    () => cachedFriends?.sentRequests || []
  );
  const [suggestions, setSuggestions] = useState(
    () => cachedFriends?.suggestions || []
  );
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(!cachedFriends);
  const [searching, setSearching] = useState(false);
  const [invitedIds, setInvitedIds] = useState({});
  const [actionId, setActionId] = useState(null);
  const [feedbackBanner, setFeedbackBanner] = useState('');

  const showFeedback = (msg) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(''), 4000);
  };

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ownerService.getFriendsData();
      setFriends(data.friends || []);
      setReceivedRequests(data.receivedRequests || []);
      setSentRequests(data.sentRequests || []);
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

  // Envia solicitação de amizade (ou aceita se a pessoa já havia enviado)
  const handleSendFriendRequest = async (person) => {
    setActionId(person.id);
    try {
      const res = await ownerService.addFriend(person.id);
      if (res.status === 'accepted' && res.friend) {
        setFriends((prev) =>
          prev.some((f) => f.id === res.friend.id) ? prev : [res.friend, ...prev]
        );
        setReceivedRequests((prev) => prev.filter((r) => r.id !== person.id));
        showFeedback(`Agora você e ${person.name} são amigos!`);
      } else {
        setSentRequests((prev) =>
          prev.some((s) => s.id === person.id) ? prev : [person, ...prev]
        );
        showFeedback(`Solicitação de amizade enviada para ${person.name}!`);
      }

      setSuggestions((prev) => prev.filter((item) => item.id !== person.id));
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === person.id
            ? {
                ...u,
                isFriend: res.status === 'accepted',
                hasSentRequest: res.status !== 'accepted',
              }
            : u
        )
      );
    } catch {
      // erro ignorado
    } finally {
      setActionId(null);
    }
  };

  // Aceita uma solicitação de amizade recebida
  const handleAcceptRequest = async (person) => {
    setActionId(person.id);
    try {
      const acceptedFriend = await ownerService.acceptFriendRequest(person.id);
      const newFriend = acceptedFriend || {
        ...person,
        status: 'Amigo Conectado',
        isOnline: true,
      };
      setReceivedRequests((prev) => prev.filter((r) => r.id !== person.id));
      setFriends((prev) =>
        prev.some((f) => f.id === newFriend.id) ? prev : [newFriend, ...prev]
      );
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === person.id
            ? { ...u, isFriend: true, hasReceivedRequest: false }
            : u
        )
      );
      showFeedback(`Você aceitou a solicitação de amizade de ${person.name}!`);
    } catch {
      // erro ignorado
    } finally {
      setActionId(null);
    }
  };

  // Recusa uma solicitação recebida ou cancela uma enviada
  const handleRejectOrCancelRequest = async (personId, isReceived = true) => {
    setActionId(personId);
    try {
      await ownerService.rejectFriendRequest(personId);
      setReceivedRequests((prev) => prev.filter((r) => r.id !== personId));
      setSentRequests((prev) => prev.filter((s) => s.id !== personId));
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === personId
            ? { ...u, hasReceivedRequest: false, hasSentRequest: false }
            : u
        )
      );
      showFeedback(
        isReceived
          ? 'Solicitação de amizade recusada.'
          : 'Solicitação de amizade cancelada.'
      );
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
            Procure atletas pelo nome para enviar solicitações de amizade, aceite convites recebidos e convoque amigos para jogar.
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

      {feedbackBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* SEÇÃO 1: Solicitações de Amizade Recebidas (Para Aceitar ou Recusar) */}
      {receivedRequests.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border-2 border-amber-400/40 bg-amber-400/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-lg sm:text-xl text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
              <span>Solicitações de Amizade Recebidas ({receivedRequests.length})</span>
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-dark-950 text-[10px] font-black uppercase">
              Aguardando sua resposta
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receivedRequests.map((person) => (
              <div
                key={person.id}
                className="p-4 rounded-2xl bg-dark-950/90 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  {renderAvatar(person, 'w-12 h-12', 'rounded-full')}
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openPlayerProfile(person)}
                        className="hover:text-neon transition text-left"
                      >
                        {person.name}
                      </button>
                      {person.nickname && (
                        <span className="text-xs text-neon">"{person.nickname}"</span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neon">
                        {person.ovr > 0 ? `OVR ${person.ovr}` : 'Sem OVR'}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {person.sport} • Quer adicionar você como amigo
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={actionId === person.id}
                    onClick={() => handleAcceptRequest(person)}
                    className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-dark-950 text-xs font-display font-extrabold transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.35)]"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Aceitar</span>
                  </button>

                  <button
                    disabled={actionId === person.id}
                    onClick={() => handleRejectOrCancelRequest(person.id, true)}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Recusar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                {nonFriendSearchResults.map((person) => {
                  const isSent =
                    person.hasSentRequest || sentRequests.some((s) => s.id === person.id);
                  const isReceived =
                    person.hasReceivedRequest ||
                    receivedRequests.some((r) => r.id === person.id);

                  return (
                    <div
                      key={person.id}
                      className="p-4 rounded-2xl bg-dark-900/90 border border-neon/30 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {renderAvatar(person, 'w-12 h-12', 'rounded-full')}
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            <button
                        type="button"
                        onClick={() => openPlayerProfile(person)}
                        className="hover:text-neon transition text-left"
                      >
                        {person.name}
                      </button>
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

                      {isReceived ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            disabled={actionId === person.id}
                            onClick={() => handleAcceptRequest(person)}
                            className="px-3 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-dark-950 text-xs font-extrabold flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Aceitar
                          </button>
                          <button
                            disabled={actionId === person.id}
                            onClick={() => handleRejectOrCancelRequest(person.id, true)}
                            className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 text-xs font-bold"
                          >
                            Recusar
                          </button>
                        </div>
                      ) : isSent ? (
                        <button
                          disabled={actionId === person.id}
                          onClick={() => handleRejectOrCancelRequest(person.id, false)}
                          className="px-3.5 py-2 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 shrink-0"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Solicitação Enviada (Cancelar)</span>
                        </button>
                      ) : (
                        <button
                          disabled={actionId === person.id}
                          onClick={() => handleSendFriendRequest(person)}
                          className="px-3.5 py-2 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          {actionId === person.id ? 'Enviando...' : 'Enviar Solicitação'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* SEÇÃO 2: Solicitações Enviadas Pendentes */}
      {sentRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Solicitações Enviadas Aguardando Aceite ({sentRequests.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sentRequests.map((person) => (
              <div
                key={person.id}
                className="p-3.5 rounded-2xl bg-dark-950/70 border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  {renderAvatar(person, 'w-10 h-10', 'rounded-full')}
                  <div>
                    <p className="text-xs font-bold text-white">{person.name}</p>
                    <p className="text-[11px] text-amber-300">
                      Aguardando o usuário aceitar sua solicitação
                    </p>
                  </div>
                </div>
                <button
                  disabled={actionId === person.id}
                  onClick={() => handleRejectOrCancelRequest(person.id, false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO 3: Meus Amigos Conectados */}
      {loading ? (
        <ListCardsSkeleton count={4} />
      ) : filteredFriends.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 border border-white/10 text-center space-y-2">
          <p className="font-display font-bold text-base text-white">
            {friends.length === 0
              ? 'Você ainda não possui amigos conectados.'
              : 'Nenhum amigo corresponde ao filtro digitado.'}
          </p>
          <p className="text-xs text-slate-400">
            Use o campo de busca acima para procurar outros atletas pelo nome e enviar uma solicitação de amizade!
          </p>
        </div>
      ) : (
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
                        <button
                          type="button"
                          onClick={() => openPlayerProfile(friend)}
                          className="hover:text-neon transition text-left"
                        >
                          {friend.name}
                        </button>
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

      {/* SEÇÃO 4: Sugestões Reais de Outros Usuários Cadastrados no Banco */}
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
                      <button
                        type="button"
                        onClick={() => openPlayerProfile(person)}
                        className="hover:text-neon transition text-left"
                      >
                        {person.name}
                      </button>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neon">
                        {person.ovr > 0 ? `OVR ${person.ovr}` : 'Sem OVR'}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">{person.sport}</p>
                  </div>
                </div>
                <button
                  disabled={actionId === person.id}
                  onClick={() => handleSendFriendRequest(person)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-neon hover:text-dark-950 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {actionId === person.id ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

