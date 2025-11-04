/**
 * @file mapManager.js
 * @description Classe responsável por inicializar, renderizar e gerir o mapa Leaflet,
 * incluindo camadas, marcadores e eventos de clique.
 * @module core/mapManager
 */

/**
 * Gerencia o mapa e suas interações.
 * @class
 */
export class MapManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.baseLayers = {};
        this.overlays = {};
        this.layerControl = null;
        this.clickHandlers = [];
    }

    /**
     * Inicializa o mapa
     * @param {Array} center - Centro do mapa [lat, lng]
     * @param {number} zoom - Zoom inicial
     * @returns {L.Map} Instância do mapa
     */
    initialize(center = [-14.2350, -51.9253], zoom = 4) {
        this.map = L.map(this.containerId).setView(center, zoom);

        // Adicionar camada base do OpenStreetMap
        this.baseLayers.OpenStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(this.map);

        // Adicionar camadas base alternativas
        this.addBaseLayer('OpenStreetMap_HOT', 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', 'OpenStreetMap HOT');
        this.addBaseLayer('OpenTopoMap', 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', 'OpenTopoMap');

        // Configurar controle de layers
        this.layerControl = L.control.layers(this.baseLayers, this.overlays).addTo(this.map);

        // Adicionar handler de clique
        this.map.on('click', (e) => {
            this.handleMapClick(e);
        });

        return this.map;
    }

    /**
     * Adiciona camada base
     * @param {string} name - Nome da camada
     * @param {string} url - URL do tile
     * @param {string} attribution - Atribuição
     */
    addBaseLayer(name, url, attribution = '') {
        this.baseLayers[name] = L.tileLayer(url, {
            attribution: attribution,
            maxZoom: 18
        });
        
        if (this.layerControl) {
            this.layerControl.addBaseLayer(this.baseLayers[name], name);
        }
    }

    /**
     * Adiciona overlay
     * @param {string} name - Nome do overlay
     * @param {L.Layer} layer - Camada do overlay
     */
    addOverlay(name, layer) {
        this.overlays[name] = layer;
        if (this.layerControl) {
            this.layerControl.addOverlay(layer, name);
        }
    }

    /**
     * Centraliza mapa nas coordenadas
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} zoom - Zoom (opcional)
     */
    setView(lat, lng, zoom = null) {
        if (zoom) {
            this.map.setView([lat, lng], zoom);
        } else {
            this.map.setView([lat, lng]);
        }
    }

    /**
     * Ajusta visualização para conter bounds
     * @param {L.LatLngBounds} bounds - Bounds a conter
     * @param {Object} options - Opções do fitBounds
     */
    fitBounds(bounds, options = { padding: [20, 20] }) {
        this.map.fitBounds(bounds, options);
    }

    /**
     * Adiciona marcador no mapa
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object|string} options - Opções do marcador ou título do marcador
     * @param {string} popupContent - Conteúdo do popup
     * @returns {L.Marker} Marcador criado
     */
    addMarker(lat, lng, options = {}, popupContent = '') {
        // Se o segundo parâmetro for uma string, converte-a em { title: string }
        if (typeof options === 'string') {
            options = { title: options };
        }

        const marker = L.marker([lat, lng], options).addTo(this.map);

        if (popupContent) {
            marker.bindPopup(popupContent);
        }

        return marker;
    }



    /**
     * Remove marcador do mapa
     * @param {L.Marker} marker - Marcador a remover
     * @returns {boolean} True se removido com sucesso
     */
    removeMarker(marker) {
        if (marker && this.map.hasLayer(marker)) {
            this.map.removeLayer(marker);
            return true;
        }
        return false;
    }

    /**
     * Adiciona handler de clique no mapa
     * @param {Function} handler - Função handler
     */
    addClickHandler(handler) {
        this.clickHandlers.push(handler);
    }

    /**
     * Remove handler de clique
     * @param {Function} handler - Função handler a remover
     */
    removeClickHandler(handler) {
        const index = this.clickHandlers.indexOf(handler);
        if (index > -1) {
            this.clickHandlers.splice(index, 1);
        }
    }

    /**
     * Processa clique no mapa
     * @param {L.LeafletMouseEvent} event - Evento de clique
     */
    handleMapClick(event) {
        this.clickHandlers.forEach(handler => {
            try {
                handler(event);
            } catch (error) {
                console.error('Erro no handler de clique:', error);
            }
        });
    }

    /**
     * Obtém instância do mapa
     * @returns {L.Map} Instância do mapa
     */
    getMap() {
        return this.map;
    }

    /**
     * Obtém bounds atuais do mapa
     * @returns {L.LatLngBounds} Bounds atuais
     */
    getBounds() {
        return this.map.getBounds();
    }

    /**
     * Obtém centro atual do mapa
     * @returns {L.LatLng} Centro atual
     */
    getCenter() {
        return this.map.getCenter();
    }

    /**
     * Obtém zoom atual
     * @returns {number} Zoom atual
     */
    getZoom() {
        return this.map.getZoom();
    }

    /**
     * Calcula distância entre dois pontos
     * @param {Object} point1 - Primeiro ponto {lat, lng}
     * @param {Object} point2 - Segundo ponto {lat, lng}
     * @returns {number} Distância em metros
     */
    calculateDistance(point1, point2) {
        return this.map.distance([point1.lat, point1.lng], [point2.lat, point2.lng]);
    }

    /**
     * Adiciona controle de legenda
     * @param {string} content - Conteúdo HTML da legenda
     * @param {string} position - Posição ('topleft', 'topright', 'bottomleft', 'bottomright')
     * @returns {L.Control} Controle de legenda
     */
    addLegend(content, position = 'bottomleft') {
        const legend = L.control({ position: position });
        
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = content;
            return div;
        };
        
        legend.addTo(this.map);
        return legend;
    }

    /**
     * Destroi o mapa e limpa recursos
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.clickHandlers = [];
        this.baseLayers = {};
        this.overlays = {};
    }

     /**
     * Fecha popup aberto no mapa
     */
    closePopup() {
        if (this.map) {
            this.map.closePopup();
        }
    }   
}