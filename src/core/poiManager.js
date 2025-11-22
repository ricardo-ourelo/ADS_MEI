/**
 * @file poiManager.js
 * @description Classe responsável por gerir Pontos de Interesse (POIs), marcadores de rota
 * e localização atual no mapa Leaflet.
 * @module core/poiManager
 */

/**
 * Gere Pontos de Interesse (POIs) e marcadores no mapa.
 * @class
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
     * Adiciona ou atualiza marcador de rota (origem/destino/paragem intermédia)
     * @param {string} type - 'start' | 'end' | 'stop'
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} address - Endereço para popup
     * @returns {L.Marker} Marcador criado/atualizado
     */
    addRouteMarker(type, lat, lng, address = '') {

        const markerColor = getComputedStyle(document.body).getPropertyValue('--route-marker').trim();

        const icons = {
            start: '🟢',
            end: '🔴',
            stop: '🔵'
        };

        const popupText = {
            start: '📍 Origem',
            end: '🎯 Destino',
            stop: '🔵 Paragem intermédia'
        };

        // Para popups
        const popupContent = address
            ? `<strong>${popupText[type]}</strong><br>${address}`
            : popupText[type];

        // Remover marcador anterior se existir (start/end)
        if ((type === 'start' || type === 'end') && this.routeMarkers[type]) {
            this.map.removeLayer(this.routeMarkers[type]);
        }

        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: `route-marker ${type}-marker`,
                html: `<div style="color:${markerColor}; font-size: 26px;">${icons[type]}</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            })
        })
            .addTo(this.map)
            .bindPopup(popupContent);

        if (type === 'start' || type === 'end') {
            this.routeMarkers[type] = marker;
        }

        return marker;
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
     * Remove todos os marcadores de rota (apenas origem/destino)
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
