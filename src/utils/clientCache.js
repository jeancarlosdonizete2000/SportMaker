const CACHE_PREFIX = 'sportmaker_cache_v1_';

// Memória em tempo de execução para evitar parse repetido de JSON e deduplicar requisições simultâneas
const memoryCache = new Map();
const inFlightRequests = new Map();

export const CACHE_TTL = {
  PUBLIC_ARENAS: 3 * 60 * 1000, // 3 minutos
  PUBLIC_LOBBIES: 2 * 60 * 1000, // 2 minutos
  MY_MATCHES: 2 * 60 * 1000, // 2 minutos
  FRIENDS_DATA: 2 * 60 * 1000, // 2 minutos
  OWNER_DASHBOARD: 2 * 60 * 1000, // 2 minutos
};

function getCurrentUserScope() {
  try {
    const rawUser = localStorage.getItem('sportmaker_user');
    if (!rawUser) return 'guest';
    const parsed = JSON.parse(rawUser);
    return parsed?._id || parsed?.email || 'guest';
  } catch {
    return 'guest';
  }
}

function buildStorageKey(key, userScoped = false) {
  const scope = userScoped ? `${getCurrentUserScope()}_` : 'public_';
  return `${CACHE_PREFIX}${scope}${key}`;
}

export const clientCache = {
  /**
   * Lê um valor do cache (memória ou localStorage da máquina do usuário).
   * Se `allowExpired` for true, retorna o último dado salvo mesmo que o TTL tenha vencido
   * (ótimo para inicializar o useState instantaneamente sem tela vazia).
   */
  get(key, { userScoped = false, allowExpired = false } = {}) {
    const fullKey = buildStorageKey(key, userScoped);
    const now = Date.now();

    const memEntry = memoryCache.get(fullKey);
    if (memEntry) {
      if (allowExpired || now < memEntry.expiresAt) {
        return memEntry.data;
      }
    }

    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (!entry || typeof entry.expiresAt !== 'number') return null;

      memoryCache.set(fullKey, entry);
      if (allowExpired || now < entry.expiresAt) {
        return entry.data;
      }
    } catch {
      return null;
    }

    return null;
  },

  /**
   * Verifica se existe um cache válido (dentro do TTL) na máquina do usuário
   */
  isFresh(key, { userScoped = false } = {}) {
    const fullKey = buildStorageKey(key, userScoped);
    const now = Date.now();

    const memEntry = memoryCache.get(fullKey);
    if (memEntry && now < memEntry.expiresAt) {
      return true;
    }

    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return false;
      const entry = JSON.parse(raw);
      if (entry && now < entry.expiresAt) {
        memoryCache.set(fullKey, entry);
        return true;
      }
    } catch {
      return false;
    }

    return false;
  },

  /**
   * Salva os dados na memória e no localStorage do navegador do usuário
   */
  set(key, data, ttlMs = 120000, { userScoped = false } = {}) {
    const fullKey = buildStorageKey(key, userScoped);
    const entry = {
      data,
      updatedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };

    memoryCache.set(fullKey, entry);
    try {
      localStorage.setItem(fullKey, JSON.stringify(entry));
    } catch {
      // Caso a cota do localStorage esteja cheia (ex: imagens base64 grandes), mantém apenas em memória
    }
    return data;
  },

  /**
   * Invalida uma chave específica do cache (chamado sempre que o usuário cria/edita/deleta algo)
   */
  invalidate(key, { userScoped = false } = {}) {
    const fullKey = buildStorageKey(key, userScoped);
    memoryCache.delete(fullKey);
    try {
      localStorage.removeItem(fullKey);
    } catch {
      // ignorado
    }
  },

  /**
   * Limpa todos os caches ao fazer logout ou trocar de conta
   */
  clearAll() {
    memoryCache.clear();
    inFlightRequests.clear();
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignorado
    }
  },

  /**
   * Executa a busca apenas se o cache do navegador não estiver fresco (ou se forceRefresh=true).
   * Também evita requisições duplicadas simultâneas para a mesma chave.
   */
  async fetchWithCache(
    key,
    fetcherFn,
    { ttlMs = 120000, userScoped = false, forceRefresh = false } = {}
  ) {
    const fullKey = buildStorageKey(key, userScoped);

    if (!forceRefresh && this.isFresh(key, { userScoped })) {
      const cached = this.get(key, { userScoped });
      if (cached !== null) {
        return cached;
      }
    }

    if (inFlightRequests.has(fullKey)) {
      return inFlightRequests.get(fullKey);
    }

    const promise = (async () => {
      try {
        const freshData = await fetcherFn();
        this.set(key, freshData, ttlMs, { userScoped });
        return freshData;
      } catch (err) {
        // Se houver falha de rede, retorna o último cache salvo na máquina do usuário
        const fallback = this.get(key, { userScoped, allowExpired: true });
        if (fallback !== null) return fallback;
        throw err;
      } finally {
        inFlightRequests.delete(fullKey);
      }
    })();

    inFlightRequests.set(fullKey, promise);
    return promise;
  },
};
