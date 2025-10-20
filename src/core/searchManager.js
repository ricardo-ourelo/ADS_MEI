/**
 * @file searchManager.js
 * @description Executa pesquisas de locais através da API Nominatim.
 */

import { APIClient } from "../api/apiClient.js";
import { DataParser } from "../utils/dataParser.js";

export class SearchManager {
    /**
     * Procura um local com base numa query textual.
     * @param {string} query - Nome ou descrição do local.
     * @returns {Promise<object>} Coordenadas e nome do local.
     */
    async searchLocation(query) {
        console.log("Pesquisa:", query);
        const json = await APIClient.getNominatimResults(query);
        return DataParser.parseNominatimResponse(json);
    }
}
