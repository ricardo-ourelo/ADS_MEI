/**
 * @file poiManager.js
 * @description
 * Classe responsável por gerir marcadores no mapa Leaflet, incluindo:
 * - Localização atual do utilizador
 * - Marcadores da rota (origem, destino, paragens intermédias)
 * - Remoção e controle de marcadores
 *
 * NOTA: Esta classe não calcula rotas; apenas gere a visualização de pins.
 */

export class POIManager {
    /**
     * Cria instância do gestor de POIs.
     * @param {L.Map} map - Instância do Leaflet Map.
     */
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

    /**
     * Verifica se a rota está completa visualmente (origem + destino colocados).
     * @returns {boolean} - true se ambos os marcadores existem
     */
    hasBothRouteMarkers() {
        return !!(this.routeMarkers.start && this.routeMarkers.end);
    }
}
