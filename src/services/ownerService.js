import { MONGO_CONFIG } from './mongoClient';

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
   * Busca o painel completo do proprietário no MongoDB:
   * - arenas cadastradas pelo proprietário
   * - quadro de horários marcados (bookings)
   * - métricas financeiras (faturamento total, quadras, bar/produtos, pendentes, ticket médio)
   */
  async getDashboardData() {
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

  /**
   * Busca todas as arenas cadastradas no MongoDB (visão pública / atleta)
   */
  async getPublicArenas() {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/arenas`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json().catch(() => ({ arenas: [] }));
    if (!response.ok) return [];
    return data.arenas || [];
  },

  /**
   * Cria uma nova arena vinculada ao proprietário no MongoDB
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
    return data.arena;
  },

  /**
   * Atualiza configurações, detalhes, quadras, produtos, serviços e horários de uma arena no MongoDB
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
    return data.arena;
  },

  /**
   * Cria um novo agendamento no MongoDB (seja pelo proprietário no balcão ou pelo atleta no app)
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
    return data;
  },

  /**
   * Atualiza o status de pagamento ('paid' | 'pending') ou da reserva ('confirmed' | 'completed' | 'cancelled')
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
    return data.booking;
  },

  /**
   * Busca a lista de amigos reais, solicitações pendentes (recebidas/enviadas) e sugestões de outros usuários do banco
   */
  async getFriendsData() {
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
    return response.ok;
  },

  /**
   * Lista lobbies públicos reais do MongoDB
   */
  async getPublicLobbies() {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/lobbies`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json().catch(() => ({ lobbies: [] }));
    if (!response.ok) return [];
    return data.lobbies || [];
  },

  /**
   * Lista as partidas/reservas do atleta autenticado no MongoDB
   */
  async getMyMatches() {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/matches/my`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({ matches: [] }));
    if (!response.ok) return [];
    return data.matches || [];
  },

  /**
   * Cria uma nova partida ou reserva para o atleta no MongoDB
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
    return data.match;
  },

  /**
   * Entra ou sai de um lobby público no MongoDB
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
    return data;
  },

  /**
   * Cancela ou sai de uma partida no MongoDB
   */
  async cancelMatch(matchId) {
    const response = await fetch(`${MONGO_CONFIG.restApiUrl}/matches/${matchId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.ok;
  },
};

