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
};

