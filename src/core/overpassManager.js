/**
 * Gerencia consultas à API interna para obter Pontos de Interesse
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
            // console.log(data[0].elements);
            window.dados_ = data;
            return data.elements;

        } catch (error) {
            console.error('Erro na consulta da API interna:', error);
            throw error;
        }
    }

    /**
     * Obtém POIs por categoria em uma área específica
     * @param {number} lat - Latitude do centro
     * @param {number} lng - Longitude do centro
     * @param {number} radius - Raio em metros
     * @param {Array} categories - Categorias de POIs
     * @returns {Promise<Array>} Array de POIs
     */
    // ['restaurant', 'cafe', 'hotel']
    async getPOIsByCategory(lat, lng, radius = 1000, categories = ['restaurant']) {
        try {
            // Calcular bounding box baseado no raio
            const bbox = this.calculateBoundingBox(lat, lng, radius);
            const types = categories.join(',');
            
            const data = await this.executeQuery(bbox, types);
            return this.formatPOIsData(data, lat, lng);

        } catch (error) {
            console.error('Erro ao obter POIs:', error);
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
     * Calcula bounding box baseada em centro e raio
     * @param {number} lat - Latitude do centro
     * @param {number} lng - Longitude do centro
     * @param {number} radius - Raio em metros
     * @returns {string} Bounding box no formato "south,west,north,east"
     */
    calculateBoundingBox(lat, lng, radius) {
        // Conversão aproximada: 1 grau ≈ 111km
        const latDelta = radius / 111000;
        const lngDelta = radius / (111000 * Math.cos(lat * Math.PI / 180));
        
        const south = lat - latDelta;
        const west = lng - lngDelta;
        const north = lat + latDelta;
        const east = lng + lngDelta;
        
        return `${south},${west},${north},${east}`;
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
            .map(poi => {
                const formattedPoi = {
                    id: poi.id || `${poi.lat}-${poi.lon}-${Date.now()}`,
                    lat: parseFloat(poi.lat),
                    lon: parseFloat(poi.lon),
                    type: poi.type || 'node',
                    tags: poi.tags || {},
                    name: poi.name || poi.tags?.name || 'Sem nome',
                    category: this.determineCategory(poi.tags || {})
                };

                // Calcular distância se centro for fornecido
                if (centerLat && centerLng) {
                    formattedPoi.distance = this.calculateDistance(
                        centerLat, centerLng, 
                        formattedPoi.lat, formattedPoi.lon
                    );
                }

                // Preservar dados adicionais da API
                if (poi.address) formattedPoi.address = poi.address;
                if (poi.phone) formattedPoi.phone = poi.phone;
                if (poi.website) formattedPoi.website = poi.website;
                if (poi.opening_hours) formattedPoi.opening_hours = poi.opening_hours;

                return formattedPoi;
            })
            .sort((a, b) => (a.distance || 0) - (b.distance || 0)); // Ordenar por distância
    }

    /**
     * Determina categoria do POI baseado nas tags
     * @param {Object} tags - Tags do elemento
     * @returns {string} Categoria do POI
     */
    determineCategory(tags) {
        if (!tags) return 'other';

        if (tags.amenity === 'restaurant') return 'restaurant';
        if (tags.amenity === 'cafe') return 'cafe';
        if (tags.tourism === 'hotel') return 'hotel';
        if (tags.amenity === 'bank') return 'bank';
        if (tags.amenity === 'pharmacy') return 'pharmacy';
        if (tags.amenity === 'hospital') return 'hospital';
        if (tags.amenity === 'school') return 'school';
        if (tags.amenity === 'university') return 'university';
        if (tags.amenity === 'fuel') return 'fuel';
        if (tags.amenity === 'parking') return 'parking';
        if (tags.amenity === 'bus_station') return 'bus_station';
        if (tags.railway === 'station') return 'train_station';
        if (tags.shop === 'supermarket') return 'supermarket';
        if (tags.shop === 'mall') return 'mall';
        if (tags.amenity === 'cinema') return 'cinema';
        if (tags.amenity === 'theatre') return 'theatre';
        if (tags.tourism === 'museum') return 'museum';
        if (tags.leisure === 'park') return 'park';
        if (tags.leisure === 'fitness_centre') return 'gym';
        if (tags.amenity === 'police') return 'police';
        if (tags.amenity === 'fire_station') return 'fire_station';

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

    /**
     * Constrói query para categorias específicas (mantido para compatibilidade)
     * @param {Array} categories - Categorias de POIs
     * @returns {string} Query das categorias
     */
    buildCategoriesQuery(categories) {
        // Esta função é mantida para compatibilidade com código existente
        // Mas não é mais usada com a API interna
        console.warn('buildCategoriesQuery não é mais necessária com a API interna');
        return categories.join(',');
    }
}