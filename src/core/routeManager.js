/**
 * @file routeManager.js
 * @description Gere o cálculo e processamento de rotas usando a API OSRM.
 */

import { APIClient } from "../api/apiClient.js";
import { DataParser } from "../utils/dataParser.js";

export class RouteManager {
    /**
     * Calcula uma rota entre dois pontos.
     * @param {Array<number>} origin - Coordenadas de origem [lat, lng].
     * @param {Array<number>} destination - Coordenadas de destino [lat, lng].
     * @returns {Promise<object>} Dados da rota.
     */
    async calculateRoute(origin, destination) {
        console.log("Calculando rota de", origin, "para", destination);
        const json = await APIClient.getOSRMRoute(origin, destination);
        return DataParser.parseOSRMResponse(json);
    }
}
