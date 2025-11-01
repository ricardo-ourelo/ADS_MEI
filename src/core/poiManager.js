/**
 * Gerencia Pontos de Interesse (POIs) e marcadores no mapa
 */

export class POIManager {
    constructor(map) {
        this.map = map;
        this.currentLocationMarker = null;
        this.poiMarkers = new Map();
        this.routeMarkers = {
            start: null,
            end: null
        };

    }

       /**
     * Adiciona marcador da localização atual
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} popupText - Texto do popup
     * @returns {L.Marker} Marcador criado
     */
    addCurrentLocationMarker(lat, lng, popupText = 'Sua localização atual') {
        if (this.currentLocationMarker) {
            this.map.removeLayer(this.currentLocationMarker);
        }

        this.currentLocationMarker = L.marker([lat, lng])
            .addTo(this.map)
            .bindPopup(popupText)
            .openPopup();

        return this.currentLocationMarker;
    }

    /**
     * Adiciona ou atualiza marcador de rota (origem/destino)
     * @param {string} type - Tipo: 'start' ou 'end'
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} address - Endereço para popup
     * @returns {L.Marker} Marcador criado/atualizado
     */
    addRouteMarker(type, lat, lng, address = '') {
        // Remove marcador anterior se existir
        if (this.routeMarkers[type]) {
            this.map.removeLayer(this.routeMarkers[type]);
        }

        const icon = type === 'start' ? '🟢' : '🔴';
        const popupText = type === 'start' ? '📍 Origem' : '🎯 Destino';
        const popupContent = address ? `<strong>${popupText}</strong><br>${address}` : popupText;

        this.routeMarkers[type] = L.marker([lat, lng], {
            icon: L.divIcon({
                className: `route-marker ${type}-marker`,
                html: icon,
                iconSize: [25, 25],
                iconAnchor: [12, 12]
            })
        }).addTo(this.map).bindPopup(popupContent);

            // Centralizar mapa na localização
        this.map.setView([lat, lng], 13);

        return this.routeMarkers[type];
    }

    /**
     * Remove marcador de rota
     * @param {string} type - Tipo: 'start' ou 'end'
     * @returns {boolean} True se removido com sucesso
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
     * Remove todos os marcadores de rota
     */
    clearRouteMarkers() {
        this.removeRouteMarker('start');
        this.removeRouteMarker('end');
    }

    /**
     * Obtém marcador de rota
     * @param {string} type - Tipo: 'start' ou 'end'
     * @returns {L.Marker|null} Marcador
     */
    getRouteMarker(type) {
        return this.routeMarkers[type];
    }

    /**
     * Verifica se ambos marcadores de rota existem
     * @returns {boolean} True se ambos existem
     */
    hasBothRouteMarkers() {
        return this.routeMarkers.start !== null && this.routeMarkers.end !== null;
    }

}
