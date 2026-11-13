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
   * Consulta a API de Geocodificação Reversa (Nominatim OpenStreetMap / BigDataCloud)
   * para converter latitude e longitude no nome do bairro e cidade.
   */
  async reverseGeocode(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=pt-BR`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        const neighborhood =
          addr.neighbourhood ||
          addr.quarter ||
          addr.suburb ||
          addr.city_district ||
          addr.town ||
          'Região Central';
        const city =
          addr.city || addr.municipality || addr.state_district || 'São Paulo';
        const stateCode = addr['ISO3166-2-lvl4']?.split('-')[1] || 'SP';
        return {
          neighborhood,
          city: `${city} - ${stateCode}`,
          label: `${neighborhood}, ${city} - ${stateCode}`,
        };
      }
    } catch {
      // Fallback caso o navegador esteja offline
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
          const neighborhood =
            addr.neighbourhood ||
            addr.quarter ||
            addr.suburb ||
            addr.city_district ||
            addr.road ||
            item.name ||
            query.trim();
          const city =
            addr.city || addr.town || addr.municipality || addr.state || 'SP';
          return {
            id: String(item.place_id),
            label: `${neighborhood}, ${city}`,
            neighborhood,
            city,
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

