/**
 * @jest-environment jsdom
 */

import UIController from "../../src/ui/uiController.js";
import {describe, beforeEach, test, expect, jest} from "@jest/globals";

/**
 * Testes misc/egecases: initializeUI edgecases, initThemeSelector, addPOIControls edgecases,
 * updateLocationMarker null marker, updateAllMarkersTheme (start/end null), handleLocationSelect auto start/end.
 * Referências originais: :contentReference[oaicite:47]{index=47}   :contentReference[oaicite:50]{index=50}
 */

describe("UIController — Misc / Edgecases", () => {

    test("initStopsUI não falha quando container não existe", () => {
        const ui = new UIController();
        document.body.innerHTML = `<button id="add-stop-btn"></button>`;
        expect(() => ui.initStopsUI()).not.toThrow();
    });

    test("initThemeSelector não falha se #theme-select não existir", () => {
        const ui = new UIController();
        document.body.innerHTML = `<div></div>`;
        expect(() => ui.initThemeSelector()).not.toThrow();
    });

    test("addPOIControls não falha quando não existem .poi-icon", () => {
        const ui = new UIController();
        document.body.innerHTML = `
            <div id="page-map"><aside></aside></div>
            <button id="clear-pois-btn"></button>
        `;

        ui.handleLoadPOIs = jest.fn();
        ui.handleClearPOIs = jest.fn();

        expect(() => ui.addPOIControls()).not.toThrow();
    });

    test("não tenta adicionar handler quando marker é null (updateLocationMarker)", () => {
        document.body.innerHTML = `
            <button id="calculate-route-btn"></button>
        `;

        const ui2 = new UIController();
        ui2.poiManager = { addRouteMarker: () => null };
        ui2.currentPopup = {};
        ui2.stateManager = { isReadyForRoute: () => false };

        expect(() =>
            ui2.updateLocationMarker("start", {lat:10,lng:20,address:"A"})
        ).not.toThrow();
    });

    test("quando start está vazio → handleLocationSelect usa start", () => {
        const ui3 = new UIController();
        document.body.innerHTML = `
            <input id="start">
            <input id="end">
            <div id="search-results"></div>
        `;

        ui3.stateManager = {
            getStartLocation: jest.fn(() => null),
            setStartLocation: jest.fn(),
            setEndLocation: jest.fn(),
        };

        ui3.searchManager = { clearSearchMarkers: jest.fn() };
        ui3.closeCurrentPopup = jest.fn();
        ui3.clearCurrentRoute = jest.fn();

        ui3.handleLocationSelect(10,20,"Local", null);

        expect(ui3.stateManager.setStartLocation).toHaveBeenCalledWith({
            lat: 10, lng: 20, address: "Local"
        });
    });

    test("quando start já existe → handleLocationSelect usa end", () => {
        const ui4 = new UIController();
        document.body.innerHTML = `
            <input id="start">
            <input id="end">
            <div id="search-results"></div>
        `;

        ui4.stateManager = {
            getStartLocation: jest.fn(() => ({lat:1,lng:1})),
            setStartLocation: jest.fn(),
            setEndLocation: jest.fn(),
        };

        ui4.searchManager = { clearSearchMarkers: jest.fn() };
        ui4.closeCurrentPopup = jest.fn();
        ui4.clearCurrentRoute = jest.fn();

        ui4.handleLocationSelect(10,20,"Local", null);

        expect(ui4.stateManager.setEndLocation).toHaveBeenCalled();
    });

    test("updateLocationMarker ativa botão calcular rota quando pronto", () => {
        document.body.innerHTML = `
        <button id="calculate-route-btn"></button>
    `;

        const ui = new UIController();
        ui.poiManager = { addRouteMarker: jest.fn(() => ({ on: jest.fn() })) };
        ui.currentPopup = {};
        ui.stateManager = { isReadyForRoute: () => true };

        ui.updateLocationMarker("start", { lat: 1, lng: 2, address: "X" });

        const btn = document.getElementById("calculate-route-btn");
        expect(btn.disabled).toBe(false);
        expect(btn.style.background).toBe("rgb(39, 174, 96)");
    });


});
