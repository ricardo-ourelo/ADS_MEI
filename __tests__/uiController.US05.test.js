/**
 * @jest-environment jsdom
 * @file uiController.US05.test.js
 * @description Testes para US05 — Limpeza e reinício da rota (UIController).
 */

import { jest } from "@jest/globals";
import UIController from "../src/ui/uiController.js"; // import default

describe("US05 — Limpeza e reinício da rota", () => {
    let uiController;

    beforeEach(() => {
        document.body.innerHTML = `
      <input id="start" value="Lisboa">
      <input id="end" value="Porto">
      <div id="search-results">Resultados</div>
      <div id="route-info">Info</div>
      <button id="clear-route-btn">Limpar</button>
    `;

        uiController = new UIController();

        uiController.stateManager = { clearAll: jest.fn() };
        uiController.routeManager = { clearRoute: jest.fn() };
        uiController.searchManager = { clearSearchMarkers: jest.fn() };
        uiController.poiManager = {
            clearRouteMarkers: jest.fn(),
            clearAllPOIs: jest.fn(),
        };
        uiController.mapManager = { getMap: jest.fn(() => ({ closePopup: jest.fn() })) };
    });

    test("deve limpar inputs e resetar interface ao chamar handleClearRoute()", () => {
        uiController.handleClearRoute();

        expect(uiController.stateManager.clearAll).toHaveBeenCalled();
        expect(uiController.routeManager.clearRoute).toHaveBeenCalled();

        //TODO Enquanto nao temos a procura a funcionar
        expect(uiController.searchManager.clearSearchMarkers).not.toHaveBeenCalled();


        expect(document.getElementById("start").value).toBe("");
        expect(document.getElementById("end").value).toBe("");
        expect(document.getElementById("search-results").innerHTML).toBe("");
    });
});
