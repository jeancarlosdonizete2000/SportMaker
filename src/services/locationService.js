const STORAGE_LOCATION_KEY = 'sportmaker_user_location';
const STORAGE_CONSENT_KEY = 'sportmaker_location_consent';

// Regiões e bairros pré-configurados com coordenadas reais para seleção manual rápida
export const MANUAL_LOCATION_PRESETS = [
  {
    id: 'vila_olimpia',
    label: 'Vila Olímpia, São Paulo - SP',
    neighborhood: 'Vila Olímpia',
    city: 'São Paulo - SP',
    lat: -23.5955,
    lng: -46.6865,
  },
  {
    id: 'moema',
    label: 'Moema, São Paulo - SP',
    neighborhood: 'Moema',
    city: 'São Paulo - SP',
    lat: -23.6052,
    lng: -46.6634,
  },
  {
    id: 'pinheiros',
    label: 'Pinheiros, São Paulo - SP',
    neighborhood: 'Pinheiros',
    city: 'São Paulo - SP',
    lat: -23.5672,
    lng: -46.6894,
  },
  {
    id: 'itaim_bibi',
    label: 'Itaim Bibi, São Paulo - SP',
    neighborhood: 'Itaim Bibi',
    city: 'São Paulo - SP',
    lat: -23.5844,
    lng: -46.6742,
  },
  {
    id: 'morumbi',
    label: 'Morumbi, São Paulo - SP',
    neighborhood: 'Morumbi',
    city: 'São Paulo - SP',
    lat: -23.5998,
    lng: -46.7201,
  },
  {
    id: 'paulista',
    label: 'Av. Paulista / Jardins, SP',
    neighborhood: 'Jardins',
    city: 'São Paulo - SP',
    lat: -23.5614,
    lng: -46.6559,
  },
  {
    id: 'tatuape',
    label: 'Tatuapé / Anália Franco, SP',
    neighborhood: 'Tatuapé',
    city: 'São Paulo - SP',
    lat: -23.5401,
    lng: -46.5766,
  },
  {
    id: 'barra_rj',
    label: 'Barra da Tijuca, Rio de Janeiro - RJ',
    neighborhood: 'Barra da Tijuca',
    city: 'Rio de Janeiro - RJ',
    lat: -23.0004,
    lng: -43.3659,
  },
];

/**
 * Calcula a distância em quilômetros entre dois pontos geográficos (Fórmula de Haversine)
 */
export function calculateHaversineDistanceKm(lat1, lng1, lat2, lng2) {
  if (
    typeof lat1 !== 'number' ||
    typeof lng1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lng2 !== 'number'
  ) {
    return null;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Raio médio da Terra em km

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(1));
}

const STATE_NAME_TO_UF = {
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  'distrito federal': 'DF',
  'espirito santo': 'ES',
  goias: 'GO',
  maranhao: 'MA',
  'mato grosso': 'MT',
  'mato grosso do sul': 'MS',
  'minas gerais': 'MG',
  para: 'PA',
  paraiba: 'PB',
  parana: 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN',
  'rio grande do sul': 'RS',
  rondonia: 'RO',
  roraima: 'RR',
  'santa catarina': 'SC',
  'sao paulo': 'SP',
  sergipe: 'SE',
  tocantins: 'TO',
};

function resolveStateCode(addr = {}) {
  const iso = addr['ISO3166-2-lvl4'] || addr.state_code;
  if (iso && typeof iso === 'string') {
    const parts = iso.split('-');
    const code = (parts[parts.length - 1] || '').trim().toUpperCase();
    if (code.length === 2) return code;
  }

  if (addr.state && typeof addr.state === 'string') {
    const clean = addr.state
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    if (STATE_NAME_TO_UF[clean]) return STATE_NAME_TO_UF[clean];
    if (addr.state.trim().length === 2) return addr.state.trim().toUpperCase();
    return addr.state.trim();
  }

  return '';
}

function resolveCityName(addr = {}) {
  return (
    addr.city ||
    addr.town ||
    addr.municipality ||
    addr.village ||
    addr.county ||
    addr.city_district ||
    addr.state_district ||
    ''
  );
}

function resolveNeighborhoodName(addr = {}, city = '') {
  const candidate =
    addr.suburb ||
    addr.neighbourhood ||
    addr.quarter ||
    addr.residential ||
    addr.city_district ||
    addr.district ||
    addr.hamlet ||
    addr.road ||
    '';
  if (candidate && candidate.toLowerCase() !== city.toLowerCase()) {
    return candidate;
  }
  return candidate || city || 'Região Central';
}

export const locationService = {
  getStoredConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_CONSENT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveConsent(accepted = true) {
    const payload = {
      accepted: Boolean(accepted),
      acceptedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_CONSENT_KEY, JSON.stringify(payload));
    return payload;
  },

  getStoredLocation() {
    try {
      const raw = localStorage.getItem(STORAGE_LOCATION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveLocation(locationObj) {
    localStorage.setItem(STORAGE_LOCATION_KEY, JSON.stringify(locationObj));
    return locationObj;
  },

  /**
   * Consulta a API de Geocodificação Reversa (Nominatim OpenStreetMap + fallback BigDataCloud)
   * para converter latitude e longitude no nome exato do bairro, cidade e estado (UF),
   * sem forçar "São Paulo" ou "SP" quando o usuário estiver em outra cidade/estado.
   */
  async reverseGeocode(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=pt-BR`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        const city = resolveCityName(addr);
        const stateCode = resolveStateCode(addr);
        const neighborhood = resolveNeighborhoodName(addr, city);

        if (city || neighborhood) {
          const cityWithState =
            city && stateCode
              ? `${city} - ${stateCode}`
              : city || stateCode || 'Brasil';
          const label =
            neighborhood && city && neighborhood.toLowerCase() !== city.toLowerCase()
              ? `${neighborhood}, ${cityWithState}`
              : cityWithState;

          return {
            neighborhood: neighborhood || city || 'Localização GPS',
            city: cityWithState,
            label,
          };
        }
      }
    } catch {
      // Tenta segundo provedor gratuito abaixo
    }

    // Fallback secundário via BigDataCloud (gratuito, sem chave e com CORS aberto)
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`;
      const bdcRes = await fetch(bdcUrl);
      if (bdcRes.ok) {
        const bdc = await bdcRes.json();
        const city = bdc.city || bdc.locality || '';
        const stateCode = resolveStateCode({
          'ISO3166-2-lvl4': bdc.principalSubdivisionCode,
          state: bdc.principalSubdivision,
        });
        const neighborhood =
          bdc.locality && bdc.locality !== city ? bdc.locality : city || 'Região Central';
        const cityWithState =
          city && stateCode ? `${city} - ${stateCode}` : city || stateCode || 'Brasil';
        const label =
          neighborhood && city && neighborhood.toLowerCase() !== city.toLowerCase()
            ? `${neighborhood}, ${cityWithState}`
            : cityWithState;

        return {
          neighborhood,
          city: cityWithState,
          label,
        };
      }
    } catch {
      // Fallback caso o navegador esteja totalmente offline
    }

    return {
      neighborhood: 'Localização GPS',
      city: 'Brasil',
      label: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    };
  },

  /**
   * Consulta a API de Busca de Endereço / CEP / Bairro (Nominatim OpenStreetMap)
   * para permitir ao usuário digitar manualmente sua rua, CEP ou cidade.
   */
  async searchAddressQuery(query) {
    if (!query || query.trim().length < 2) return [];
    try {
      const encoded = encodeURIComponent(`${query.trim()}, Brasil`);
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encoded}&limit=5&addressdetails=1&accept-language=pt-BR`;
      const response = await fetch(url);
      if (response.ok) {
        const results = await response.json();
        return results.map((item) => {
          const addr = item.address || {};
          const city = resolveCityName(addr);
          const stateCode = resolveStateCode(addr);
          const neighborhood =
            addr.suburb ||
            addr.neighbourhood ||
            addr.quarter ||
            addr.city_district ||
            addr.road ||
            item.name ||
            city ||
            query.trim();
          const cityWithState =
            city && stateCode
              ? `${city} - ${stateCode}`
              : city || stateCode || 'Brasil';
          const label =
            neighborhood && city && neighborhood.toLowerCase() !== city.toLowerCase()
              ? `${neighborhood}, ${cityWithState}`
              : cityWithState;

          return {
            id: String(item.place_id),
            label,
            neighborhood,
            city: cityWithState,
            lat: Number(item.lat),
            lng: Number(item.lon),
          };
        });
      }
    } catch {
      // Fallback para busca nos presets locais caso sem rede
    }

    const q = query.toLowerCase();
    return MANUAL_LOCATION_PRESETS.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q)
    );
  },

  /**
   * Solicita a localização em tempo real via Web Geolocation API do navegador
   * (Somente deve ser chamado após o usuário aceitar o Termo de Consentimento)
   */
  async requestBrowserGpsLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      throw new Error('Seu navegador não suporta a API de Geolocalização.');
    }

    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    });

    const lat = Number(pos.coords.latitude);
    const lng = Number(pos.coords.longitude);
    const geoInfo = await this.reverseGeocode(lat, lng);

    const locationData = {
      mode: 'gps',
      lat,
      lng,
      neighborhood: geoInfo.neighborhood,
      city: geoInfo.city,
      label: geoInfo.label,
      updatedAt: new Date().toISOString(),
    };

    this.saveLocation(locationData);
    return locationData;
  },
};

