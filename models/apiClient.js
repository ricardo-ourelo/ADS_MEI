const axios = require('axios');

const cache = new Map();
let lastRequestTime = 0;
const REQUEST_INTERVAL = 1000; // 1 segundo (Nominatim limita a 1 req/s)
const NOMINATIM_TIMEOUT = 4000; // 4 segundos

class APIClient {
  static OSRM_BASE_URL = 'http://router.project-osrm.org';
  static NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
  static OVERPASS_BASE_URL = 'https://overpass-api.de/api/interpreter';

  // Mapeamento de perfis e seus fatores de ajuste
  static profileConfig = {
    'car': {
      osrmProfile: 'car',
      speedFactor: 1.0,
      color: '#e74c3c',
      icon: '🚗'
    },
    'mota': {
      osrmProfile: 'car', // OSRM não tem perfil específico para mota
      speedFactor: 1.2,   // +20% de velocidade vs carro
      color: '#9b59b6',
      icon: '🏍️'
    },
    'bicicleta': {
      osrmProfile: 'bike',
      speedFactor: 0.3,   // 30% da velocidade do carro
      color: '#27ae60',
      icon: '🚴'
    },
    'walking': {
      osrmProfile: 'foot',
      speedFactor: 0.15,  // 15% da velocidade do carro
      color: '#3498db',
      icon: '🚶'
    }
  };

  /**
   * Pesquisa de localizações (Nominatim)
   * Inclui cache, throttling (1 req/s) e timeout seguro.
   */
  static async searchLocation(query, format = "json", limit = 10) {
    const key = query.trim().toLowerCase();
    if (!key) return [];

    // Detetar se é coordenada (ex: "38.7169,-9.1399")
    const coordMatch = key.match(/^[-]?\d+(\.\d+)?[, ]+[-]?\d+(\.\d+)?$/);
    if (coordMatch) {
      // Coordenadas → usa reverseGeocode
      const [lat, lon] = key.split(/[, ]+/).map(Number);
      const result = await this.reverseGeocode(lat, lon);
      if (result && result.display_name) {
        return [
          {
            display_name: result.display_name,
            lat,
            lon,
            type: result.type || "place",
          },
        ];
      }
      return [];
    }

    // Pesquisa textual normal
    if (cache.has(key)) return cache.get(key);

    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < REQUEST_INTERVAL) {
      await new Promise(r => setTimeout(r, REQUEST_INTERVAL - elapsed));
    }

    lastRequestTime = Date.now();

    const NOMINATIM_URL = `${this.NOMINATIM_BASE_URL}/search`;
    const PHOTON_URL = "https://photon.komoot.io/api";

    try {
      // Primeiro tenta Nominatim
      const response = await axios.get(NOMINATIM_URL, {
        params: {
          q: query,
          format,
          limit,
          addressdetails: 1,
          "accept-language": "pt",
        },
        headers: { "User-Agent": "RoutePlanner/1.0 (contact: dev@local.test)" },
        timeout: NOMINATIM_TIMEOUT,
      });

      cache.set(key, response.data);
      return response.data;
    } catch (error) {
      console.warn("⚠️ Nominatim indisponível, a usar Photon API como alternativa.");

      try {
        const photonRes = await axios.get(PHOTON_URL, {
          params: { q: query, limit },
          timeout: 6000,
        });

        if (!photonRes.data?.features?.length) {
          console.warn("⚠️ Photon não devolveu resultados válidos.");
          return [];
        }

        const converted = photonRes.data.features.map(f => {
          const props = f.properties || {};
          const coords = f.geometry?.coordinates || [0, 0];
          return {
            display_name:
                props.name ||
                props.street ||
                props.city ||
                props.country ||
                "Local desconhecido",
            lat: coords[1],
            lon: coords[0],
            type: props.osm_value || props.type || "place",
            address: {
              road: props.street || "",
              city: props.city || "",
              country: props.country || "",
            },
          };
        });

        cache.set(key, converted);
        return converted;
      } catch (photonError) {
        console.error("❌ Fallback Photon falhou:", photonError.message);
        return [];
      }
    }
  }




  /**
   * Geocodificação reversa (lat,lng → endereço)
   * Usa Nominatim com fallback para Photon se o primeiro falhar.
   */
  static async reverseGeocode(lat, lon) {
    const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;

    // Cache local — evita pedidos repetidos
    if (cache.has(key)) return cache.get(key);

    // Controlar intervalo entre pedidos (1 por segundo)
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < REQUEST_INTERVAL) {
      await new Promise(r => setTimeout(r, REQUEST_INTERVAL - elapsed));
    }
    lastRequestTime = Date.now();

    const NOMINATIM_URL = `${this.NOMINATIM_BASE_URL}/reverse`;
    const PHOTON_URL = "https://photon.komoot.io/reverse";

    try {
      // Tenta primeiro com Nominatim (4s timeout)
      const response = await axios.get(NOMINATIM_URL, {
        params: {
          lat,
          lon,
          format: "json",
          "accept-language": "pt",
        },
        headers: {
          "User-Agent": "RoutePlanner/1.0 (contact: dev@local.test)",
        },
        timeout: NOMINATIM_TIMEOUT,
      });

      cache.set(key, response.data);
      return response.data;
    } catch (error) {
      console.warn("⚠️ Nominatim indisponível na geocodificação, a usar Photon...");

      try {
        // 2️⃣ Fallback: Photon (usa endpoint reverse)
        const photonRes = await axios.get(PHOTON_URL, {
          params: { lat, lon },
          timeout: 6000,
        });

        if (!photonRes.data || !photonRes.data.features?.length) {
          console.warn("⚠️ Photon não devolveu resultado válido para geocodificação.");
          return {};
        }

        // Converter resposta do Photon → formato compatível com Nominatim
        const feature = photonRes.data.features[0];
        const props = feature.properties || {};
        const coords = feature.geometry?.coordinates || [lon, lat];

        const converted = {
          display_name:
              props.name ||
              [props.street, props.city, props.country].filter(Boolean).join(", ") ||
              "Local desconhecido",
          lat: coords[1],
          lon: coords[0],
          type: props.osm_value || props.type || "place",
          address: {
            road: props.street || "",
            city: props.city || "",
            country: props.country || "",
          },
        };

        cache.set(key, converted);
        return converted;
      } catch (photonError) {
        console.error("❌ Fallback Photon falhou na geocodificação:", photonError.message);
        return {};
      }
    }
  }


  // Calcular rota com OSRM e ajustar tempos baseado no perfil
  static async calculateRoute(start, end, profile = 'car') {
    const config = this.profileConfig[profile] || this.profileConfig.car;
    const osrmProfile = config.osrmProfile;
    
    const url = `${this.OSRM_BASE_URL}/route/v1/${osrmProfile}/${start};${end}`;
    
    console.log(`Calculando rota: ${profile} (OSRM: ${osrmProfile})`);
    
    const response = await axios.get(url, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        steps: true,
        annotations: true
      }
    });

    // Ajustar os tempos baseado no perfil
    const adjustedData = this.adjustRouteForProfile(response.data, profile);
    return adjustedData;
  }

  // Ajustar duração e distância baseado no perfil
  static adjustRouteForProfile(routeData, profile) {
    if (routeData.code !== 'Ok' || !routeData.routes || routeData.routes.length === 0) {
      return routeData;
    }

    const config = this.profileConfig[profile] || this.profileConfig.car;
    const speedFactor = config.speedFactor;

    // Ajustar cada rota
    routeData.routes.forEach(route => {
      // Ajustar duração total
      if (route.duration) {
        route.originalDuration = route.duration; // Guardar original
        route.duration = route.duration / speedFactor;
      }

      // Ajustar duração por leg
      if (route.legs) {
        route.legs.forEach(leg => {
          if (leg.duration) {
            leg.originalDuration = leg.duration;
            leg.duration = leg.duration / speedFactor;
          }
        });
      }

      // Ajustar annotations (se existirem)
      if (route.annotation && route.annotation.duration) {
        route.annotation.originalDuration = route.annotation.duration;
        route.annotation.duration = route.annotation.duration.map(d => d / speedFactor);
      }

      // Adicionar metadados do perfil
      route.profile = profile;
      route.speedFactor = speedFactor;
      route.profileIcon = config.icon;
    });

    return routeData;
  }

  // Calcular velocidade média por perfil (km/h)
  // static getAverageSpeed(profile) {
  //   const speeds = {
  //     'car': 50,      // 50 km/h média cidade
  //     'mota': 60,     // 60 km/h média cidade (mais ágil)
  //     'bicicleta': 15, // 15 km/h média
  //     'walking': 5    // 5 km/h caminhada
  //   };
  //   return speeds[profile] || 50;
  // }

  // Obter pontos de interesse com Overpass API
  static async getPointsOfInterest(bbox, types = 'amenity') {
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node[${types}](${bbox});
        way[${types}](${bbox});
        relation[${types}](${bbox});
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await axios.post(this.OVERPASS_BASE_URL, overpassQuery, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  }

}

module.exports = APIClient;