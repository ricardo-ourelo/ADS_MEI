/**
 * @file main.js
 * @description Ponto de entrada da aplicação. Inicializa o mapa e a interface.
 */

import { UIController } from "./ui/uiController.js";
import { MapManager } from "./ui/mapManager.js";
/**
 * Inicializa a aplicação ao carregar a página.
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("Aplicação iniciada");
    const mapManager = new MapManager();
    mapManager.initMap();
});

