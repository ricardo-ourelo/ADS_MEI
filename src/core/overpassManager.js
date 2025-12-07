/**
 * @module core/overpassManager
 */

/**
 * @class
 * @description Gerencia consultas à API interna para obter Pontos de Interesse.
 */
export class OverpassManager {

    constructor() {
        this.baseUrl = '/api/poi'; // URL da sua API interna
        this.timeout = 30000; // 30 segundos
    }

    /**
     * Executa query na API interna
     * @param {string} bbox - Bounding box no formato "south,west,north,east"
     * @param {string} types - Tipos de POIs (opcional)
     * @returns {Promise<Object>} Dados dos POIs
     */
    async executeQuery(bbox, types = null) {
        try {
            let url = `${this.baseUrl}?bbox=${bbox}`;
            
            if (types) {
                url += `&types=${types}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: this.timeout
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log(data.elements);
            window.dados_ = data;
            return data.elements;

        } catch (error) {
            console.error('Erro na consulta da API interna:', error);
            throw error;
        }
    }


    /**
     * Obtém POIs dentro de uma bounding box
     * @param {number} south - Latitude sul
     * @param {number} west - Longitude oeste
     * @param {number} north - Latitude norte
     * @param {number} east - Longitude este
     * @param {Array} categories - Categorias de POIs
     * @returns {Promise<Array>} Array de POIs
     */
    //  ['restaurant', 'cafe', 'hotel']
    async getPOIsByBoundingBox(south, west, north, east, categories = ['restaurant']) {
        try {
            const bbox = `${south},${west},${north},${east}`;
            const types = categories.join(',');
            
            const data = await this.executeQuery(bbox, types);
            return this.formatPOIsData(data);

        } catch (error) {
            console.error('Erro ao obter POIs por bounding box:', error);
            throw error;
        }
    }


    /**
     * Formata dados dos POIs para estrutura padronizada
     * @param {Array} pois - Dados da API interna
     * @param {number} centerLat - Latitude do centro (opcional)
     * @param {number} centerLng - Longitude do centro (opcional)
     * @returns {Array} POIs formatados
     */
    formatPOIsData(pois, centerLat = null, centerLng = null) {
        if (!pois || !Array.isArray(pois)) {
            return [];
        }

        return pois
            .filter(poi => poi.lat && poi.lon)
            .map(poi => this._createFormattedPoi(poi, centerLat, centerLng))
            .sort((a, b) => (a.distance || 0) - (b.distance || 0)); // Ordenar por distância
    }

    /**
     * Constrói um objeto POI formatado combinando base, distância e atributos opcionais.
     * @param {Object} poi - POI bruto vindo da API interna.
     * @param {number|null} centerLat - Latitude do centro para cálculo de distância.
     * @param {number|null} centerLng - Longitude do centro para cálculo de distância.
     * @returns {Object} POI formatado.
     */
    _createFormattedPoi(poi, centerLat, centerLng) {
        const base = this._extractBasePoi(poi);
        const withDistance = this._applyDistance(base, centerLat, centerLng);
        return this._copyOptionalAttributes(withDistance, poi);
    }

    /**
     * Extrai os campos base necessários para representar um POI.
     * @param {Object} poi - Objeto original do POI.
     * @returns {Object} POI básico com id, coordenadas, tags e categoria.
     */
    _extractBasePoi(poi) {
        return {
            id: poi.id || `${poi.lat}-${poi.lon}-${Date.now()}`,
            lat: parseFloat(poi.lat),
            lon: parseFloat(poi.lon),
            type: poi.type || 'node',
            tags: poi.tags || {},
            name: poi.name || poi.tags?.name || 'Sem nome',
            category: this.determineCategory(poi.tags || {})
        };
    }

    /**
     * Aplica a distância ao POI caso coordenadas de centro sejam fornecidas.
     * @param {Object} poi - POI a ser atualizado.
     * @param {number|null} centerLat - Latitude do centro.
     * @param {number|null} centerLng - Longitude do centro.
     * @returns {Object} POI com distância adicionada (ou original).
     */
    _applyDistance(poi, centerLat, centerLng) {
        if (centerLat && centerLng) {
            return {
                ...poi,
                distance: this.calculateDistance(centerLat, centerLng, poi.lat, poi.lon)
            };
        }
        return poi;
    }

    /**
     * Copia atributos opcionais como endereço, telefone e website para o POI final.
     * @param {Object} poi - POI base já parcialmente formatado.
     * @param {Object} src - Objeto original contendo atributos opcionais.
     * @returns {Object} POI enriquecido com atributos opcionais.
     */
    _copyOptionalAttributes(poi, src) {
        const out = { ...poi };

        if (src.address) out.address = src.address;
        if (src.phone) out.phone = src.phone;
        if (src.website) out.website = src.website;
        if (src.opening_hours) out.opening_hours = src.opening_hours;

        return out;
    }


    /**
     * Determina categoria do POI baseado nas tags
     * @param {Object} tags - Tags do elemento
     * @returns {string} Categoria do POI
     */
    determineCategory(tags) {
        if (!tags) return 'other';

        const mappings = [
            ['amenity', {
                restaurant: 'restaurant',
                cafe: 'cafe',
                bank: 'bank',
                pharmacy: 'pharmacy',
                hospital: 'hospital',
                school: 'school',
                university: 'university',
                fuel: 'fuel',
                parking: 'parking',
                bus_station: 'bus_station',
                cinema: 'cinema',
                theatre: 'theatre',
                fire_station: 'fire_station',
                police: 'police'
            }],
            ['tourism', {
                hotel: 'hotel',
                museum: 'museum'
            }],
            ['shop', {
                supermarket: 'supermarket',
                mall: 'mall'
            }],
            ['leisure', {
                park: 'park',
                fitness_centre: 'gym'
            }],
            ['railway', {
                station: 'train_station'
            }]
        ];

        for (const [key, map] of mappings) {
            const value = tags[key];
            if (value && map[value]) {
                return map[value];
            }
        }

        return 'other';
    }




    /**
     * Calcula distância entre dois pontos em metros
     * @param {number} lat1 - Latitude ponto 1
     * @param {number} lon1 - Longitude ponto 1
     * @param {number} lat2 - Latitude ponto 2
     * @param {number} lon2 - Longitude ponto 2
     * @returns {number} Distância em metros
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Raio da Terra em metros
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                 Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                 Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Converte graus para radianos
     * @param {number} value - Valor em graus
     * @returns {number} Valor em radianos
     */
    toRad(value) {
        return value * Math.PI / 180;
    }

    /**
     * Obtém ícone para categoria de POI
     * @param {string} category - Categoria do POI
     * @returns {string} Ícone HTML
     */
    getIconForCategory(category) {
        // console.log("categoria:" + category);
        const icons = {
            'restaurant': '🍽️',
            'cafe': '☕',
            'hotel': '🏨',
            'bank': '🏦',
            'pharmacy': '💊',
            'hospital': '🏥',
            'school': '🏫',
            'university': '🎓',
            'fuel': '⛽',
            'parking': '🅿️',
            'bus_station': '🚌',
            'train_station': '🚉',
            'supermarket': '🛒',
            'mall': '🏬',
            'cinema': '🎬',
            'theatre': '🎭',
            'museum': '🏛️',
            'park': '🌳',
            'gym': '💪',
            'police': '👮',
            'fire_station': '🚒',
            'other': '📍'
        };

        return icons[category] || icons['other'];
    }

    /**
     * Obtém cor para categoria de POI
     * @param {string} category - Categoria do POI
     * @returns {string} Cor hexadecimal
     */
    getColorForCategory(category) {
        const colors = {
            'restaurant': '#e74c3c',
            'cafe': '#d35400',
            'hotel': '#8e44ad',
            'bank': '#27ae60',
            'pharmacy': '#3498db',
            'hospital': '#c0392b',
            'school': '#2980b9',
            'university': '#16a085',
            'fuel': '#f39c12',
            'parking': '#7f8c8d',
            'bus_station': '#34495e',
            'train_station': '#2c3e50',
            'supermarket': '#e67e22',
            'mall': '#d35400',
            'cinema': '#9b59b6',
            'theatre': '#8e44ad',
            'museum': '#f1c40f',
            'park': '#2ecc71',
            'gym': '#e74c3c',
            'police': '#2980b9',
            'fire_station': '#c0392b',
            'other': '#95a5a6'
        };

        return colors[category] || colors['other'];
    }

}