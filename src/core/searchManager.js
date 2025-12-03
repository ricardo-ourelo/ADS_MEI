/**
 * Gerencia pesquisas de localização e geocodificação
 */
export class SearchManager {
    constructor(map) {
        this.map = map;
        this.searchMarkers = [];
        this.searchCache = new Map();
    }

    /**
     * Pesquisa localização por endereço
     * @param {string} query - Endereço a pesquisar
     * @param {number} limit - Número máximo de resultados
     * @returns {Promise<Array>} Array de resultados
     */
    async searchLocation(query, limit = 5) {
        if (!query || query.trim() === '') {
            throw new Error('Query de pesquisa não pode estar vazia');
        }

        // Verificar cache
        const cacheKey = `search_${query}_${limit}`;
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const results = await response.json();
            
            // Armazenar no cache (expira após 5 minutos)
            this.searchCache.set(cacheKey, results);
            setTimeout(() => {
                this.searchCache.delete(cacheKey);
            }, 300000);

            return results;

        } catch (error) {
            console.error('Erro na pesquisa:', error);
            throw error;
        }
    }

    /**
     * Geocodificação reversa (coordenadas para endereço)
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {Promise<Object>} Dados do local
     */
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`/api/search?q=${lat},${lng}&format=json`);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const results = await response.json();
            return results.length > 0 ? results[0] : null;

        } catch (error) {
            console.error('Erro na geocodificação reversa:', error);
            throw error;
        }
    }

    /**
     * Adiciona marcadores de pesquisa no mapa
     * @param {Array} results - Resultados da pesquisa
     * @returns {Array} Array de marcadores criados
     */
    addSearchMarkers(results) {
        // Limpar marcadores anteriores
        this.clearSearchMarkers();

        const markers = results.map(result => {
            const marker = L.marker([result.lat, result.lon])
                .addTo(this.map)
                .bindPopup(`
                    <strong>${result.display_name}</strong><br>
                    <button onclick="window.selectSearchLocation(${result.lat}, ${result.lon}, '${result.display_name.replace(/'/g, "\\'")}')">
                        Selecionar Localização
                    </button>
                `);

            this.searchMarkers.push(marker);
            return marker;
        });

        return markers;
    }

    /**
     * Limpa todos os marcadores de pesquisa
     */
    clearSearchMarkers() {
        this.searchMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.searchMarkers = [];
    }

}