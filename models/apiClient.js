const axios = require('axios');

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

  // Pesquisar localização com Nominatim
  static async searchLocation(query, format = 'json', limit = 10) {
    const url = `${this.NOMINATIM_BASE_URL}/search`;
    
    const response = await axios.get(url, {
      params: {
        q: query,
        format: format,
        limit: limit,
        addressdetails: 1,
        'accept-language': 'pt'
      },
      headers: {
        'User-Agent': 'RoutePlanner/1.0'
      }
    });

    return response.data;
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

  // Geocodificação reversa
  static async reverseGeocode(lat, lon) {
    const url = `${this.NOMINATIM_BASE_URL}/reverse`;
    
    const response = await axios.get(url, {
      params: {
        lat: lat,
        lon: lon,
        format: 'json',
        'accept-language': 'pt'
      },
      headers: {
        'User-Agent': 'RoutePlanner/1.0'
      }
    });

    return response.data;
  }
}

module.exports = APIClient;