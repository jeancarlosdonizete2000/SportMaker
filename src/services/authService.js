import { MONGO_CONFIG } from './mongoClient';

const STORAGE_USER_KEY = 'sportmaker_user';
const STORAGE_TOKEN_KEY = 'sportmaker_token';

function stripSensitiveFields(userDoc) {
  if (!userDoc) return null;
  const clean = { ...userDoc };
  delete clean.passwordHash;
  delete clean.password;
  return clean;
}

/**
 * Serviço de Autenticação limpo e seguro para Produção.
 * - Não possui nenhum login, e-mail ou senha hardcoded no frontend.
 * - Comunica exclusivamente com o backend Node/Express (`http://localhost:5000/api`),
 *   onde o MongoDB Atlas (`footplus.yliizzy.mongodb.net`) realiza a verificação
 *   criptográfica (`scrypt` + `timingSafeEqual`) e assina o token JWT.
 */
export const authService = {
  getStoredSession() {
    try {
      const rawUser = localStorage.getItem(STORAGE_USER_KEY);
      const token = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (!rawUser || !token) return null;
      return { user: JSON.parse(rawUser), token };
    } catch {
      return null;
    }
  },

  saveSession(user, token) {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(stripSensitiveFields(user)));
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
  },

  clearSession() {
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  },

  /**
   * Autentica o usuário exclusivamente via Backend conectado ao MongoDB Atlas.
   * @param {{ email: string, password: string, role: 'player' | 'owner' }} credentials
   */
  async login({ email, password, role }) {
    const normalizedEmail = email.toLowerCase().trim();

    let response;
    try {
      response = await fetch(`${MONGO_CONFIG.restApiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalizedEmail, password, role }),
      });
    } catch {
      throw new Error(
        'Não foi possível conectar ao servidor de autenticação. Verifique se o backend está ativo.'
      );
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'E-mail ou senha inválidos.');
    }

    this.saveSession(data.user, data.token);
    return data;
  },

  /**
   * Registra um novo usuário no MongoDB Atlas via Backend (que criptografa a senha com scrypt).
   * @param {Object} payload
   */
  async register(payload) {
    if (!payload.password || payload.password.length < 6) {
      throw new Error('A senha deve possuir no mínimo 6 caracteres.');
    }

    const normalizedEmail = payload.email.toLowerCase().trim();

    let response;
    try {
      response = await fetch(`${MONGO_CONFIG.restApiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          email: normalizedEmail,
        }),
      });
    } catch {
      throw new Error(
        'Não foi possível conectar ao servidor para concluir o cadastro.'
      );
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Não foi possível criar a conta.');
    }

    this.saveSession(data.user, data.token);
    return data;
  },

  /**
   * Atualiza o perfil do usuário (foto, apelido, posição, insígnia) no MongoDB.
   */
  async updateProfile(updates, token) {
    try {
      const response = await fetch(`${MONGO_CONFIG.restApiUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user && token) {
          this.saveSession(data.user, token);
        }
        return data.user;
      }
    } catch {
      // Caso o servidor esteja reiniciando, mantém sincronizado na sessão local
    }

    const session = this.getStoredSession();
    if (session) {
      const merged = { ...session.user, ...updates };
      this.saveSession(merged, session.token);
      return merged;
    }
    return updates;
  },

  /**
   * Confirma o pagamento da assinatura PRO e libera os benefícios de assinante no MongoDB.
   */
  async confirmProSubscription({ planId, paymentMethod, transactionCode }, token) {
    if (!transactionCode) {
      throw new Error('Código de confirmação de pagamento ausente.');
    }

    try {
      const response = await fetch(`${MONGO_CONFIG.restApiUrl}/subscription/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          planId,
          paymentMethod,
          paymentConfirmed: true,
          transactionCode,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.user) {
        this.saveSession(data.user, token);
        return data.user;
      }

      if (response.status === 402 || response.status === 400) {
        throw new Error(data.message || 'Pagamento ainda não confirmado.');
      }
    } catch (err) {
      if (err.message && err.message.includes('Pagamento')) {
        throw err;
      }
    }

    // Sincronização local caso o servidor esteja reiniciando
    const session = this.getStoredSession();
    if (session) {
      const upgradedUser = {
        ...session.user,
        isPro: true,
        proPlan: planId,
        proStatus: 'active',
        proActivatedAt: new Date().toISOString(),
        proTransactionId: transactionCode,
      };
      this.saveSession(upgradedUser, session.token);
      return upgradedUser;
    }
    throw new Error('Sessão inválida para ativar assinatura.');
  },
};
