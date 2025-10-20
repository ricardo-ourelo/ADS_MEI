/**
 * @file apiClient.js
 * @description Responsável por efetuar pedidos às APIs OSRM, Nominatim e Overpass.
 */

export class APIClient {
    /**
     * Obtém uma rota da API OSRM.
     * @param {Array<number>} origin - [lat, lng].
     * @param {Array<number>} destination - [lat, lng].
     */
    static async getOSRMRoute(origin, destination) {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
        console.log("GET", url);
        const res = await fetch(url);
        return res.json();
    }

    /**
     * Pesquisa de locais via Nominatim.
     * @param {string} query - Texto da pesquisa.
     */
    static async getNominatimResults(query) {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json`;
        console.log("GET", url);
        const res = await fetch(url);
        return res.json();
    }

    /**
     * Obtém POIs via Overpass API.
     * @param {string} bbox - Bounding box em formato “sul, oeste, norte, este”.
     */
    static async getOverpassData(bbox) {
        const query = `[out:json];node[amenity](bbox);out;`.replace("bbox", bbox);
        console.log("POST Overpass", query);
        const res = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query
        });
        return res.json();
    }
}
