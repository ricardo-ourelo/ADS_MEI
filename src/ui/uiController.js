/**
 * @file uiController.js
 * @description Controla as interações do utilizador e a comunicação com os gestores de lógica.
 */

import { MapManager } from "./mapManager.js";
import { RouteManager } from "../core/routeManager.js";
import { SearchManager } from "../core/searchManager.js";
import { POIManager } from "../core/poiManager.js";
import { StateManager } from "../core/stateManager.js";
import { Utils } from "../utils/helpers.js";

export class UIController {
    constructor() {
        this.mapManager = new MapManager();
        this.routeManager = new RouteManager();
        this.searchManager = new SearchManager();
        this.poiManager = new POIManager();
        this.state = new StateManager();
    }

    /**
     * Inicializa a interface e eventos.
     */
    init() {
        console.log("UIController inicializado");
        this.mapManager.initMap();
        this.bindButtons();
    }

    /**
     * Atualiza o painel de informações da rota.
     * @param {number} distance - Distância total em metros.
     * @param {number} duration - Duração total em segundos.
     */
    updateInfo(distance, duration) {
        console.log(`Distância: ${Utils.formatDistance(distance)} | Tempo: ${Utils.formatDuration(duration)}`);
    }

    /**
     * Mostra uma mensagem de erro ao utilizador.
     * @param {string} message - Mensagem de erro.
     */
    showError(message) {
        console.error("Erro:", message);
    }

    /**
     * Liga eventos de clique e botões na interface.
     */
    bindButtons() {
        console.log("Botões ligados");
    }
}
