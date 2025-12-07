/**
 /**
 * @module core/poiManager
 */

import { OverpassManager } from "../core/overpassManager.js";

/**
 * @class
 * @description Gere marcadores, POIs e elementos visuais no mapa Leaflet.
 */
export class POIManager {

    constructor(map) {
        /** @type {L.Map} */
        this.map = map;

        /** @type {L.Marker|null} */
        this.currentLocationMarker = null;

        /**
         * POIs arbitrários (não relacionados com a rota)
         * @type {Map<string, L.Marker>}
         */
        this.poiMarkers = new Map();

        /**
         * Marcadores principais da rota: origem e destino
         * @type {{start: L.Marker|null, end: L.Marker|null}}
         */
        this.routeMarkers = {
            start: null,
            end: null
        };

        /**
         * Lista de marcadores de paragens intermédias (podem conter null quando removidos)
         * @type {Array<L.Marker|null>}
         */
        this.stopMarkers = [];

        this.overpassManager = new OverpassManager();
        this.currentPOIs = new Map();
    }

    /**
     * Adiciona um marcador para a localização atual do utilizador.
     * Remove o marcador anterior, caso exista.
     *
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} [popupText='📍 Sua localização atual'] - Texto do popup
     * @returns {L.Marker} - Marcador criado
     */
    addCurrentLocationMarker(lat, lng, popupText = '📍 Sua localização atual') {
        if (this.currentLocationMarker)
            this.map.removeLayer(this.currentLocationMarker);

        this.currentLocationMarker = L.marker([lat, lng])
            .addTo(this.map)
            .bindPopup(popupText)
            .openPopup();

        return this.currentLocationMarker;
    }

    /**
     * Adiciona um marcador associado à rota:
     * - 'start'  → Origem
     * - 'stop'   → Paragem intermédia
     * - 'end'    → Destino
     *
     * Se o tipo for origem ou destino, substitui automaticamente o marcador anterior.
     *
     * @param {'start'|'stop'|'end'} type - Tipo de marcador a criar
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} [address=''] - Texto exibido no popup
     * @returns {L.Marker} - Marcador criado
     */
    addRouteMarker(type, lat, lng, address = '') {
        const icons = {
            start: '🟢',
            stop: '🔵',
            end: '🔴'
        };

        const popupLabel = {
            start: `📍 Origem`,
            stop: `🔵 Paragem intermédia`,
            end: `🎯 Destino`
        };

        const popupContent = address
            ? `<strong>${popupLabel[type]}</strong><br>${address}`
            : popupLabel[type];

        // Origem e Destino substituem marcador anterior
        if ((type === 'start' || type === 'end') && this.routeMarkers[type]) {
            this.map.removeLayer(this.routeMarkers[type]);
        }

        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: `route-marker ${type}-marker`,
                html: `<div style="font-size: 26px;">${icons[type]}</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            })
        }).addTo(this.map).bindPopup(popupContent);

        if (type === 'start' || type === 'end') {
            this.routeMarkers[type] = marker;
        } else { // Tipo 'stop'
            this.stopMarkers.push(marker);
        }

        return marker;
    }

    /**
     * Remove uma paragem intermédia pelo índice, caso exista.
     * @param {number} index - Índice da paragem a remover.
     */
    removeStopMarker(index) {
        if (this.stopMarkers[index]) {
            this.map.removeLayer(this.stopMarkers[index]);
            this.stopMarkers[index] = null;
        }
    }

    /**
     * Remove todos os marcadores de paragens intermédias.
     * Utilizado após edição/remoção múltipla ou reordenação.
     */
    clearStopMarkers() {
        this.stopMarkers.forEach(marker => {
            if (marker) this.map.removeLayer(marker);
        });
        this.stopMarkers = [];
    }

    /**
     * Remove marcador de origem ou destino, caso exista.
     * @param {'start'|'end'} type - Tipo de marcador a remover
     * @returns {boolean} - true se removido, false caso inexistente
     */
    removeRouteMarker(type) {
        if (this.routeMarkers[type]) {
            this.map.removeLayer(this.routeMarkers[type]);
            this.routeMarkers[type] = null;
            return true;
        }
        return false;
    }

    /**
     * Remove ambos os marcadores principais da rota (origem e destino).
     * Mantém as paragens.
     */
    clearRouteMarkers() {
        this.removeRouteMarker('start');
        this.removeRouteMarker('end');
    }

    // over pass

 /**
     * Carrega POIs para a área visível do mapa
     * @param {Array} categories - Categorias de POIs para carregar
     * @returns {Promise<Object>} Estatísticas do carregamento
     */
    // categories = ['restaurant', 'cafe', 'hotel']
    async loadPOIsForVisibleArea(categories = ['restaurant']) {
        try {
            const bounds = this.map.getBounds();
            const southWest = bounds.getSouthWest();
            const northEast = bounds.getNorthEast();

            console.log('Carregando POIs para área:', {
                south: southWest.lat,
                west: southWest.lng,
                north: northEast.lat,
                east: northEast.lng,
                categories: categories
            });

            const pois = await this.overpassManager.getPOIsByBoundingBox(
                southWest.lat,
                southWest.lng,
                northEast.lat,
                northEast.lng,
                categories
            );
            uiController.showNotification(`Recebidos ${pois.length} POIs da API`);
            return this.displayPOIs(pois);

        } catch (error) {
            console.error('Erro ao carregar POIs:', error);
            throw new Error(`Falha ao carregar pontos de interesse: ${error.message}`);
        }
    }

    /**
     * Exibe POIs no mapa
     * @param {Array} pois - Array de POIs
     * @returns {Object} Estatísticas do carregamento
     */
    displayPOIs(pois) {
        let totalAdded = 0;
        const categoriesAdded = new Set();

        pois.forEach(poi => {
            try {
                const marker = this.createPOIMarker(poi);
                if (marker) {
                    this.addPOIToCategory(poi.category, poi.id, marker);
                    totalAdded++;
                    categoriesAdded.add(poi.category);
                }
            } catch (error) {
                console.error('Erro ao criar marcador para POI:', poi, error);
            }
        });

        return {
            total: totalAdded,
            categories: Array.from(categoriesAdded),
            message: `Carregados ${totalAdded} POIs de ${categoriesAdded.size} categorias`
        };
    }


    /**
     * Cria marcador para um POI
     * @param {Object} poi - Dados do POI
     * @returns {L.Marker} Marcador criado
     */
    createPOIMarker(poi) {
        const icon = this.overpassManager.getIconForCategory(poi.category);
        const color = this.overpassManager.getColorForCategory(poi.category);

        const marker = L.marker([poi.lat, poi.lon], {
            icon: L.divIcon({
                className: `poi-marker ${poi.category}-poi`,
                html: `
                    <div style="
                        background: ${color};
                        border: 2px solid white;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 12px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    ">
                        ${icon}
                    </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(this.map);

        // Criar conteúdo do popup
        const popupContent = this.createPopupContent(poi);
        marker.bindPopup(popupContent);

        return marker;
    }

    /**
     * Cria conteúdo do popup para POI
     * @param {Object} poi - Dados do POI
     * @returns {string} Conteúdo HTML do popup
     */

    createPopupContent(poi) {
        let content = `
            <div style="min-width: 200px;">
                <strong>${this.overpassManager.getIconForCategory(poi.category)} ${poi.name}</strong>
                <br><small style="color: #666;">${this.getCategoryName(poi.category)}</small>
        `;

        // Adicionar informações adicionais se disponíveis
        if (poi.tags) {
            if (poi.tags['addr:street']) {
                content += `<br>📍 ${poi.tags['addr:street']}`;
                if (poi.tags['addr:housenumber']) {
                    content += `, ${poi.tags['addr:housenumber']}`;
                }
            }

            if (poi.tags.phone) {
                content += `<br>📞 ${poi.tags.phone}`;
            }

            if (poi.tags.website) {
                content += `<br>🌐 <a href="${poi.tags.website}" target="_blank">Website</a>`;
            }

            if (poi.tags.opening_hours) {
                content += `<br>🕒 ${poi.tags.opening_hours}`;
            }
        }

        if (poi.distance) {
            content += `<br><small>📏 ${(poi.distance).toFixed(0)} metros</small>`;
        }

        content += `
            <br><br>
            <button onclick="window.uiController.handleLocationSelect(${poi.lat}, ${poi.lon}, '${poi.name.replace(/'/g, "\\'")}', 'start')">
                🟢 Usar como Origem
            </button>
            <button onclick="window.uiController.handleLocationSelect(${poi.lat}, ${poi.lon}, '${poi.name.replace(/'/g, "\\'")}', 'end')">
                🔴 Usar como Destino
            </button>
            <button onclick="window.uiController.addStopFromMap(${poi.lat}, ${poi.lon}, '${poi.name.replace(/'/g, "\\'")}')">
                🔵 Usar como Paragem
            </button>
            </div>
        `;

        return content;
    }

    /**
     * Adiciona POI à categoria
     * @param {string} category - Categoria do POI
     * @param {string} poiId - ID do POI
     * @param {L.Marker} marker - Marcador do POI
     */
    addPOIToCategory(category, poiId, marker) {
        if (!this.currentPOIs.has(category)) {
            this.currentPOIs.set(category, new Map());
        }
        this.currentPOIs.get(category).set(poiId, marker);
    }

    /**
     * Obtém nome amigável da categoria
     * @param {string} category - Categoria técnica
     * @returns {string} Nome amigável
     */
    getCategoryName(category) {
        const names = {
            'restaurant': 'Restaurante',
            'cafe': 'Café',
            'hotel': 'Hotel',
            'bank': 'Banco',
            'pharmacy': 'Farmácia',
            'hospital': 'Hospital',
            'school': 'Escola',
            'university': 'Universidade',
            'fuel': 'Posto de Combustível',
            'parking': 'Estacionamento',
            'bus_station': 'Estação de Ônibus',
            'train_station': 'Estação de Trem',
            'supermarket': 'Supermercado',
            'mall': 'Shopping Center',
            'cinema': 'Cinema',
            'theatre': 'Teatro',
            'museum': 'Museu',
            'park': 'Parque',
            'gym': 'Academia',
            'police': 'Polícia',
            'fire_station': 'Bombeiros',
            'other': 'Outro'
        };

        return names[category] || category;
    }

    /**
     * Remove todos os POIs de uma categoria específica
     * @param {string} category - Categoria a remover
     * @returns {number} Número de POIs removidos
     */
    clearPOIsByCategory(category) {
        if (this.currentPOIs.has(category)) {
            const markers = this.currentPOIs.get(category);
            let count = 0;
            
            markers.forEach(marker => {
                this.map.removeLayer(marker);
                count++;
            });
            
            this.currentPOIs.delete(category);
            return count;
        }
        return 0;
    }

    /**
     * Remove todos os POIs do mapa
     * @returns {number} Total de POIs removidos
     */
    clearAllPOIs() {
        let totalRemoved = 0;
        
        this.currentPOIs.forEach((markers, category) => {
            totalRemoved += this.clearPOIsByCategory(category);
        });
        
        return totalRemoved;
    }


    // over pass


    
}
