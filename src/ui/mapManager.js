/**
 * @file mapManager.js
 * @description Gere o mapa Leaflet (visualização e interações).
 */

export class MapManager {
    constructor() {
        this.map = null;
    }

    /**
     * Inicializa o mapa e adiciona os controlos padrão.
     */
    initMap() {
        console.log("Inicializar mapa Leaflet...");

        // Cria o mapa centrado em Lisboa
        this.map = L.map("map").setView([38.7169, -9.1399], 13);

        // Adiciona a camada base do OpenStreetMap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Eventos do mapa (pan, zoom, click)
        this.map.on("moveend", () => {
            const center = this.map.getCenter();
            console.log(`Mapa centrado em: ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`);
        });

        this.map.on("click", (e) => {
            const { lat, lng } = e.latlng;
            console.log(`Clique no mapa: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            this.addMarker(lat, lng);
        });
    }

    /**
     * Adiciona um marcador no ponto clicado.
     * @param {number} lat - Latitude.
     * @param {number} lng - Longitude.
     */
    addMarker(lat, lng) {
        L.marker([lat, lng]).addTo(this.map);
    }
}
