/**
 * @file app.js
 * @description Configuração principal do servidor Express.
 * Define middlewares, rotas e inicializa o servidor.
 */

const axios = require('axios');

const cache = new Map();
let lastRequestTime = 0;
const REQUEST_INTERVAL = 1000; // 1 segundo (Nominatim limita a 1 req/s)
const NOMINATIM_TIMEOUT = 4000; // 4 segundos

/**
 * Classe responsável por interagir com APIs externas:
 * - OSRM (cálculo de rotas)
 * - Nominatim (geocodificação direta e reversa)
 * - Photon (fallback)
 * - Overpass (pontos de interesse)
 *
 * Inclui mecanismos de cache, controlo de taxa e fallback automático.
 */
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
   * Pesquisa localizações (texto → coordenadas) usando Nominatim ou Photon.
   * @async
   * @param {string} query - Texto de pesquisa (ex: "Lisboa" ou "38.71,-9.13").
   * @param {string} [format="json"] - Formato de resposta esperado.
   * @param {number} [limit=10] - Número máximo de resultados a devolver.
   * @returns {Promise<Object[]>} Lista de resultados de pesquisa.
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
   * Obtém o endereço correspondente a coordenadas (lat,lng → texto).
   * Utiliza Nominatim e faz fallback para Photon em caso de falha.
   * @async
   * @param {number} lat - Latitude do ponto.
   * @param {number} lon - Longitude do ponto.
   * @returns {Promise<Object>} Objeto com o nome do local e detalhes de endereço.
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



  /**
   * Calcula uma rota entre dois pontos via API OSRM (com paragens intermédias opcionais).
   * @async
   * @param {string} start - Ponto inicial no formato "lon,lat".
   * @param {string} end - Ponto final no formato "lon,lat".
   * @param {string} profile - Perfil de transporte ("car", "mota", "bicicleta", "walking", etc.).
   * @param {string|null} [waypoints=null] - String "lon,lat;lon,lat;..." com paragens intermédias.
   * @returns {Promise<Object>} Dados completos da rota (geoJSON, distância, tempo) com tempos ajustados ao perfil.
   */
  static async calculateRoute(start, end, profile = 'car', waypoints = null) {
    const config = this.profileConfig[profile] || this.profileConfig.car;
    const osrmProfile = config.osrmProfile;

    // Construir lista de coordenadas: start ; (waypoints...) ; end
    const coords = [start];

    if (waypoints) {
      const wpList = waypoints
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);

      coords.push(...wpList);
    }

    coords.push(end);
    const coordsStr = coords.join(';');

    const url = `${this.OSRM_BASE_URL}/route/v1/${osrmProfile}/${coordsStr}`;

    console.log(`Calculando rota: ${profile} (OSRM: ${osrmProfile})`);
    console.log(` → Coordenadas: ${coordsStr}`);

    const response = await axios.get(url, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        steps: true,
        annotations: true
      }
    });

    const adjustedData = this.adjustRouteForProfile(response.data, profile);
    return adjustedData;
  }



  /**
   * Ajusta a duração e as anotações de uma rota de acordo com o perfil de transporte.
   * Aplica um fator de velocidade (`speedFactor`) para simular diferenças entre modos de locomoção.
   *
   * @param {Object} routeData - Objeto da rota devolvido pela API OSRM.
   * @param {string} profile - Tipo de transporte ("car", "mota", "bicicleta", "walking", etc.).
   * @returns {Object} O mesmo objeto de rota com as durações ajustadas e metadados do perfil adicionados.
   *
   * @example
   * const adjusted = APIClient.adjustRouteForProfile(routeData, "bicicleta");
   * console.log(adjusted.routes[0].duration); // duração ajustada pela velocidade da bicicleta
   */
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


  /**
   * Obtém pontos de interesse (POIs) dentro de uma área geográfica definida,
   * utilizando a Overpass API. A query busca nós, vias e relações com o atributo especificado.
   *
   * @async
   * @param {string} bbox - Caixa delimitadora no formato "sul, oeste, norte, leste"
   *   (por exemplo: "38.70,-9.20,38.80,-9.10").
   * @param {string} [types="amenity"] - Tipo ou grupo de tags OSM a procurar (ex: "amenity", "tourism", "shop").
   * @returns {Promise<Object>} Objeto JSON devolvido pela API Overpass, contendo os elementos encontrados.
   *
   * @example
   * const bbox = "38.70,-9.20,38.80,-9.10";
   * const pois = await APIClient.getPointsOfInterest(bbox, "amenity=restaurant");
   * console.log(pois.elements); // lista de POIs encontrados
   */

  static async getPointsOfInterest(bbox, types = 'amenity', limit = 100) {
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node[${types}](${bbox});
        way[${types}](${bbox});
        relation[${types}](${bbox});
      );
      out body;
      >;
      out skel qt ${limit};
    `;

    const response = await axios.post(this.OVERPASS_BASE_URL, overpassQuery, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

  // Limitar retorno de elemento
  const data = response.data;
  data.elements = data.elements.slice(0, limit);

    return data;
  }

}

module.exports = APIClient;