import { MONGO_CONFIG } from './mongoClient';
import { clientCache, CACHE_TTL } from '../utils/clientCache';

const STORAGE_TOKEN_KEY = 'sportmaker_token';

function getAuthHeaders() {
  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const ownerService = {
  /**
   * Leitores síncronos instantâneos do cache salvo na máquina do usuário
   * (Evitam tela em branco ou carregamento lento ao dar F5)
   */
  getCachedPublicArenas() {
    const list = clientCache.get('public_arenas', {
      userScoped: false,
      allowExpired: true,
    });
    return Array.isArray(list)
      ? list.map((a) => ({ ...a, id: a._id || a.id }))
      : [];
  },

  getCachedPublicLobbies() {
    const list = clientCache.get('public_lobbies', {
      userScoped: false,
      allowExpired: true,
    });
    return Array.isArray(list) ? list : [];
  },

  getCachedMyMatches() {
    const list = clientCache.get('my_matches', {
      userScoped: true,
      allowExpired: true,
    });
    return Array.isArray(list) ? list : [];
  },

  getCachedFriendsData() {
    return (
      clientCache.get('friends_data', {
        userScoped: true,
        allowExpired: true,
      }) || null
    );
  },

  getCachedOwnerDashboard() {
    return (
      clientCache.get('owner_dashboard', {
        userScoped: true,
        allowExpired: true,
      }) || null
    );
  },

  /**
   * Busca o painel completo do proprietário (usa cache do navegador por 2 min; forceRefresh=true busca direto do MongoDB)
   */
  async getDashboardData({ forceRefresh = false } = {}) {
    return clientCache.fetchWithCache(
      'owner_dashboard',
      async () => {
        const response = await fetch(`${MONGO_CONFIG.restApiUrl}/owner/dashboard`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || 'Erro ao carregar dados do proprietário no MongoDB.');
        }
        return data;
      },
      { ttlMs: CACHE_TTL.OWNER_DASHBOARD, userScoped: true, forceRefresh }
    );
  },

  /**
   * Busca os horários já ocupados de uma arena em tempo real (sem cache) para impedir duplicidade entre usuários
   */
  async getArenaBookedSlots(arenaId) {
    if (!arenaId) return [];
    const response = await fetch(
      `${MONGO_CONFIG.restApiUrl}/arenas/${arenaId}/booked-slots`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }
    );
    const data = await response.json().catch(() => ({ bookedSlots: [] }));
    if (!response.ok) return [];
    return Array.isArray(data.bookedSlots) ? data.bookedSlots : [];
  },

  /**
   * Busca todas as arenas cadastradas (usa cache local de 3 minutos na máquina do usuário)
   */
  async getPublicArenas({ forceRefresh = false } = {}) {
    return clientCache.fetchWithCache(
      'public_arenas',
      async () => {
        const response = await fetch(`${MONGO_CONFIG.restApiUrl}/arenas`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json().catch(() => ({ arenas: [] }));
        if (!response.ok) return [];
        return data.arenas || [];
      },
      { ttlMs: CACHE_TTL.PUBLIC_ARENAS, userScoped: false, forceRefresh }
    );
  },

  /**
   * Cria uma nova arena vinculada ao proprietário no MongoDB e atualiza o cache local
   */
  async createArena(arenaPayload) {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/owner/arenas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(arenaPayload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao cadastrar nova arena no MongoDB.');
    }

    clientCache.invalidate('public_arenas', { userScoped: false });
    clientCache.invalidate('owner_dashboard', { userScoped: true });
    return data.arena;
  },

  /**
   * Atualiza configurações da arena no MongoDB e sincroniza o cache local
   */
  async updateArena(arenaId, updates) {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/owner/arenas/${arenaId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao salvar configurações da arena no MongoDB.');
    }

    clientCache.invalidate('public_arenas', { userScoped: false });
    clientCache.invalidate('owner_dashboard', { userScoped: true });
    return data.arena;
  },

  /**
   * Cria um novo agendamento no MongoDB e invalida o cache de horários
   */
  async createBooking(bookingPayload) {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/owner/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingPayload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao registrar horário no MongoDB.');
    }

    clientCache.invalidate('public_arenas', { userScoped: false });
    clientCache.invalidate('owner_dashboard', { userScoped: true });
    return data;
  },

  /**
   * Atualiza o status de pagamento ou da reserva no MongoDB e limpa cache do painel
   */
  async updateBookingStatus(bookingId, statusUpdates) {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/owner/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(statusUpdates),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao atualizar agendamento no MongoDB.');
    }

    clientCache.invalidate('public_arenas', { userScoped: false });
    clientCache.invalidate('owner_dashboard', { userScoped: true });
    return data.booking;
  },

  /**
   * Busca a lista de amigos reais, solicitações pendentes e sugestões (com cache local de 2 min)
   */
  async getFriendsData({ forceRefresh = false } = {}) {
    return clientCache.fetchWithCache(
      'friends_data',
      async () => {
        const response = await fetch(`${MONGO_CONFIG.restApiUrl}/friends`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        const data = await response.json().catch(() => ({
          friends: [],
          receivedRequests: [],
          sentRequests: [],
          suggestions: [],
        }));
        if (!response.ok) {
          return {
            friends: [],
            receivedRequests: [],
            sentRequests: [],
            suggestions: [],
          };
        }
        return {
          friends: data.friends || [],
          receivedRequests: data.receivedRequests || [],
          sentRequests: data.sentRequests || [],
          suggestions: data.suggestions || [],
        };
      },
      { ttlMs: CACHE_TTL.FRIENDS_DATA, userScoped: true, forceRefresh }
    );
  },

  /**
   * Pesquisa outros usuários cadastrados no MongoDB pelo nome, apelido ou email
   */
  async searchUsers(query) {
    const q = String(query || '').trim();
    if (!q) return [];
    const response = await fetch(
      `${MONGO_CONFIG.restApiUrl}/users/search?q=${encodeURIComponent(q)}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );
    const data = await response.json().catch(() => ({ users: [] }));
    if (!response.ok) return [];
    return data.users || [];
  },

  /**
   * Envia uma solicitação de amizade para outro usuário no MongoDB
   */
  async addFriend(targetUserId) {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/friends/${targetUserId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao enviar solicitação de amizade.');
    }
    clientCache.invalidate('friends_data', { userScoped: true });
    return data;
  },

  /**
   * Aceita uma solicitação de amizade recebida no MongoDB
   */
  async acceptFriendRequest(targetUserId) {
    const response = await fetch(
      `${MONGO_CONFIG.restApiUrl}/friends/${targetUserId}/accept`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao aceitar solicitação de amizade.');
    }
    clientCache.invalidate('friends_data', { userScoped: true });
    return data.friend;
  },

  /**
   * Recusa uma solicitação de amizade recebida (ou cancela uma enviada) no MongoDB
   */
  async rejectFriendRequest(targetUserId) {
    const response = await fetch(
      `${MONGO_CONFIG.restApiUrl}/friends/${targetUserId}/reject`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );
    clientCache.invalidate('friends_data', { userScoped: true });
    return response.ok;
  },

  /**
   * Remove um usuário da lista de amigos no MongoDB
   */
  async removeFriend(targetUserId) {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/friends/${targetUserId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    clientCache.invalidate('friends_data', { userScoped: true });
    return response.ok;
  },

  /**
   * Lista lobbies públicos reais (com cache local de 2 minutos na máquina do usuário)
   */
  async getPublicLobbies({ forceRefresh = false } = {}) {
    return clientCache.fetchWithCache(
      'public_lobbies',
      async () => {
        const response = await fetch(`${MONGO_CONFIG.restApiUrl}/lobbies`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json().catch(() => ({ lobbies: [] }));
        if (!response.ok) return [];
        return data.lobbies || [];
      },
      { ttlMs: CACHE_TTL.PUBLIC_LOBBIES, userScoped: false, forceRefresh }
    );
  },

  /**
   * Lista as partidas/reservas do atleta autenticado (com cache local de 2 minutos)
   */
  async getMyMatches({ forceRefresh = false } = {}) {
    return clientCache.fetchWithCache(
      'my_matches',
      async () => {
        const response = await fetch(`${MONGO_CONFIG.restApiUrl}/matches/my`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        const data = await response.json().catch(() => ({ matches: [] }));
        if (!response.ok) return [];
        return data.matches || [];
      },
      { ttlMs: CACHE_TTL.MY_MATCHES, userScoped: true, forceRefresh }
    );
  },

  /**
   * Cria uma nova partida ou reserva para o atleta no MongoDB e atualiza o cache local
   */
  async createMatch(matchPayload) {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/matches`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(matchPayload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar partida no MongoDB.');
    }

    clientCache.invalidate('my_matches', { userScoped: true });
    clientCache.invalidate('public_lobbies', { userScoped: false });
    return data.match;
  },

  /**
   * Entra ou sai de um lobby público no MongoDB e atualiza o cache local
   */
  async toggleJoinLobby(matchId) {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/matches/${matchId}/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao atualizar participação no lobby.');
    }

    clientCache.invalidate('my_matches', { userScoped: true });
    clientCache.invalidate('public_lobbies', { userScoped: false });
    return data;
  },

  /**
   * Cancela ou sai de uma partida no MongoDB e atualiza o cache local
   */
  async cancelMatch(matchId) {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/matches/${matchId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    clientCache.invalidate('my_matches', { userScoped: true });
    clientCache.invalidate('public_lobbies', { userScoped: false });
    return response.ok;
  },

  /**
   * Busca os detalhes completos de uma partida no MongoDB (arena, jogadores confirmados e solicitações pendentes)
   */
  async getMatchById(matchId) {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/matches/${matchId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao carregar detalhes da partida.');
    }
    return data.match;
  },

  /**
   * Aceita ou recusa a solicitação de entrada de um atleta na partida (exclusivo para o Host)
   */
  async respondToMatchRequest(matchId, targetUserId, action) {
    const response = await fetch(
      `${MONGO_CONFIG.restApiUrl}/matches/${matchId}/participants/${targetUserId}/respond`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action }),
      }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao responder solicitação.');
    }

    clientCache.invalidate('my_matches', { userScoped: true });
    clientCache.invalidate('public_lobbies', { userScoped: false });
    return data;
  },

  /**
   * Envia um convite de partida para um amigo (gera notificação no MongoDB)
   */
  async inviteFriendToMatch(matchId, friendId) {
    const response = await fetch(
      `${MONGO_CONFIG.restApiUrl}/matches/${matchId}/invite/${friendId}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao enviar convite para o amigo.');
    }
    return data;
  },

  /**
   * Aceita ou recusa um convite recebido para entrar em uma partida
   */
  async respondToMatchInvite(matchId, action) {
    const response = await fetch(
      `${MONGO_CONFIG.restApiUrl}/matches/${matchId}/invite/respond`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action }),
      }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao responder convite da partida.');
    }
    clientCache.invalidate('my_matches', { userScoped: true });
    clientCache.invalidate('public_lobbies', { userScoped: false });
    return data;
  },

  /**
   * Busca as notificações do usuário autenticado no MongoDB
   */
  async getNotifications() {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/notifications`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({ notifications: [], unreadCount: 0 }));
    if (!response.ok) return { notifications: [], unreadCount: 0 };
    return {
      notifications: data.notifications || [],
      unreadCount: data.unreadCount || 0,
    };
  },

  async markNotificationRead(notificationId) {
    const response = await fetch(
      `${MONGO_CONFIG.restApiUrl}/notifications/${notificationId}/read`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
      }
    );
    return response.ok;
  },

  async markAllNotificationsRead() {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/notifications/read-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return response.ok;
  },
};

