/**
 * @file poiManager.js
 * @description Gere a pesquisa de pontos de interesse (POIs) usando a Overpass API.
 */

import { APIClient } from "../api/apiClient.js";
import { DataParser } from "../utils/dataParser.js";

export class POIManager {
    /**
     * Obtém POIs próximos de uma rota.
     * @param {object} route - Objeto de rota.
     * @returns {Promise<object[]>} Lista de POIs.
     */
    async fetchPOIs(route) {
        console.log("A obter POIs para a rota");
        const bbox = DataParser.routeToBBox(route);
        const json = await APIClient.getOverpassData(bbox);
        return DataParser.parseOverpassResponse(json);
    }
}
