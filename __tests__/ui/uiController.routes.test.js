/**
 * @jest-environment jsdom
 */

import UIController from "../../src/ui/uiController.js";
import {describe, beforeEach, test, expect, jest} from "@jest/globals";

/**
 * Testes sobre rotas: calcular, limpar, display info, update profile
 * Referências originais: :contentReference[oaicite:42]{index=42}
 */

describe("UIController — Rotas (clear / calculate / update profile / display info)", () => {
    let ui;

    beforeEach(() => {
        document.body.innerHTML = `
    <div id="page-map"><aside></aside></div>
    <input id="start"><button id="start-btn"></button>
    <input id="end"><button id="end-btn"></button>
    <button id="calculate-route-btn"></button>
    <div id="route-info"></div>
    <select id="profile"></select>
    <div id="search-results"></div>
    <div id="stops-container"></div>
`;


        ui = new UIController();

        // substitui managers por mocks completos
        ui.stateManager = {
            getCurrentRoute: jest.fn(() => ({ distance: 100 })),
            getStartLocation: jest.fn(() => ({ lat: 1, lng: 2 })),
            getEndLocation: jest.fn(() => ({ lat: 5, lng: 6 })),
            getActiveProfile: jest.fn(() => "car"),
            isReadyForRoute: jest.fn(() => true),
            clearAll: jest.fn()
        };

        ui.routeManager = {
            clearRoute: jest.fn(),
            calculateRoute: jest.fn()
        };

        ui.poiManager = {
            clearRouteMarkers: jest.fn()
        };

        ui.searchManager = {
            clearSearchMarkers: jest.fn()
        };

        ui.mapManager = {
            getMap: jest.fn(() => ({ panTo: jest.fn() })),
            setView: jest.fn()
        };

        ui.stops = [];
    });

    test("clearCurrentRoute limpa rota", () => {
        ui.clearCurrentRoute();

        expect(ui.routeManager.clearRoute).toHaveBeenCalled();
        const routeInfoEl = document.getElementById("route-info");
        expect(routeInfoEl.classList.contains("hidden")).toBe(true);
    });

    test("handleCalculateRoute calcula e apresenta rota", () => {
        ui.handleCalculateRoute();

        expect(ui.routeManager.calculateRoute).toHaveBeenCalledWith(
            { lat: 1, lng: 2 },
            { lat: 5, lng: 6 },
            "car",        // perfil mockado no teste
            ui.stops
        );

    });

    test("displayRouteInfo preenche o HTML de informações da rota", () => {
        document.body.innerHTML = `<div id="route-info"></div>`;

        ui.stateManager = {
            getActiveProfile: jest.fn(() => "car")
        };

        ui.routeManager = {
            getRouteInfo: jest.fn(() => ({
                profileIcon: "🚗",
                distance: 10,
                duration: "15 min",
                avgSpeed: 40,
                profileName: "Carro",
                originalDuration: null
            }))
        };

        ui.displayRouteInfo({});

        const el = document.getElementById("route-info");
        expect(el.innerHTML).toContain("Informações da Rota");
        expect(el.classList.contains("hidden")).toBe(false);
    });

    test("updateRouteProfile recalcula rota com novo perfil", () => {
        // preparar routeManager.calculateRoute spy
        ui.routeManager.calculateRoute = jest.fn();
        ui.stateManager.getCurrentRoute = jest.fn(() => ({}));
        ui.stateManager.isReadyForRoute = jest.fn(() => true);

        ui.updateRouteProfile("bike");
        expect(ui.routeManager.calculateRoute).toHaveBeenCalled();
    });

    test("clearAllMarkers remove todos os tipos de marcadores", () => {
        document.body.innerHTML = `
        <div id="stops-container"><div>row</div></div>
    `;

        ui.poiManager = { clearRouteMarkers: jest.fn() };
        ui.searchManager = { clearSearchMarkers: jest.fn() };
        ui.mapManager = { removeMarker: jest.fn() };

        ui.stopMarkers = [1, 2, null];
        ui.stops = [ {}, {}, {} ];

        ui.clearAllMarkers();

        expect(ui.poiManager.clearRouteMarkers).toHaveBeenCalled();
        expect(ui.searchManager.clearSearchMarkers).toHaveBeenCalled();
        expect(ui.mapManager.removeMarker).toHaveBeenCalledTimes(2);
        expect(ui.stops.length).toBe(0);

        expect(document.getElementById("stops-container").innerHTML).toBe("");
    });

    test("handleCalculateRoute mostra aviso quando não está pronto", async () => {
        const ui = new UIController();

        ui.stateManager = { isReadyForRoute: () => false };
        ui.showNotification = jest.fn();

        await ui.handleCalculateRoute();

        expect(ui.showNotification)
            .toHaveBeenCalledWith("Por favor, selecione origem e destino", "warning");
    });


});
