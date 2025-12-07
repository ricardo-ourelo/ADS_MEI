/**
 * @jest-environment jsdom
 */

import UIController from "../../src/ui/uiController.js";
import {describe, test, expect, beforeEach, jest} from "@jest/globals";

/**
 * Testes relacionados com temas e repintura de marcadores
 * Referências originais: :contentReference[oaicite:28]{index=28} :contentReference[oaicite:29]{index=29} :contentReference[oaicite:30]{index=30}
 */

describe("UIController — Tema (applyTheme / updateAllMarkersTheme)", () => {

    let ui;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="page-map"><aside></aside></div>
            <button id="calculate-route-btn"></button>
            <input id="start">
            <input id="end">
            <div id="stops-container"></div>
        `;

        ui = new UIController();

        ui.stateManager = {
            getCurrentRoute: jest.fn(() => null),
            isReadyForRoute: jest.fn(() => false),
            getStartLocation: jest.fn(() => null),
            getEndLocation: jest.fn(() => null),
            getActiveProfile: jest.fn(() => "car")
        };

        ui.routeManager = {
            displayRoute: jest.fn()
        };

        ui.poiManager = {
            addRouteMarker: jest.fn()
        };

        ui.updateStopMarker = jest.fn();
        ui.updateLocationMarker = jest.fn();

        window.getComputedStyle = () => ({
            getPropertyValue: () => "#FF0000"
        });
    });

    test("applyTheme deve aplicar classe theme-x ao body", () => {
        ui.applyTheme("dark");
        expect(document.body.classList.contains("theme-dark")).toBe(true);
    });

    test("remove temas antigos antes de aplicar novo", () => {
        document.body.classList.add("theme-old1");
        document.body.classList.add("theme-old2");

        ui.applyTheme("dark");

        expect(document.body.classList.contains("theme-dark")).toBe(true);
        expect(document.body.classList.contains("theme-old1")).toBe(false);
    });

    test("quando há rota ativa, displayRoute é chamado", () => {
        ui.stateManager = {
            getCurrentRoute: jest.fn(() => ({})),
            isReadyForRoute: jest.fn(() => true),
            getActiveProfile: jest.fn(() => "car"),
            getStartLocation: jest.fn(() => null),
            getEndLocation: jest.fn(() => null)
        };

        ui.routeManager = { displayRoute: jest.fn() };

        ui.applyTheme("ocean");

        expect(ui.routeManager.displayRoute).toHaveBeenCalled();
    });

    test("updateAllMarkersTheme deve atualizar todos os marcadores existentes", () => {
        ui.stateManager.getStartLocation = () => ({ lat: 1, lng: 2, address: "A" });
        ui.stateManager.getEndLocation = () => ({ lat: 3, lng: 4, address: "B" });
        ui.stateManager.isReadyForRoute = () => false;

        ui.stops = [
            { lat: 10, lng: 11 },
            { lat: 20, lng: 21 }
        ];

        ui.updateAllMarkersTheme();

        expect(ui.updateLocationMarker).toHaveBeenCalledTimes(2);
    });

    test("não chama updateLocationMarker quando start/end são null", () => {
        ui = new UIController();

        ui.stateManager = {
            getStartLocation: () => null,
            getEndLocation: () => null
        };

        ui.updateLocationMarker = jest.fn();
        ui.updateStopMarker = jest.fn();
        ui.stops = [];

        ui.updateAllMarkersTheme();
        expect(ui.updateLocationMarker).not.toHaveBeenCalled();
    });

    test("updateAllMarkersTheme reaplica marcadores existentes", () => {
        ui.stateManager = {
            getStartLocation: () => ({ lat: 1, lng: 2, address: "A" }),
            getEndLocation: () => ({ lat: 3, lng: 4, address: "B" }),
            isReadyForRoute: () => false
        };

        ui.stops = [
            { lat: 5, lng: 6, address: "Stop A" },
            null,
            { lat: 7, lng: 8, address: "Stop B" }
        ];

        ui.poiManager = {
            addRouteMarker: jest.fn()
        };

        ui.updateAllMarkersTheme();

        expect(ui.updateLocationMarker).toHaveBeenCalledTimes(2); // start + end
        expect(ui.updateStopMarker).toHaveBeenCalledTimes(2); // 2 stops
    });

    test("applyTheme redesenha rota com cor do tema", () => {
        ui.stateManager = {
            getCurrentRoute: jest.fn(() => ({ id: 1 })),
            isReadyForRoute: jest.fn(() => true),
            getActiveProfile: jest.fn(() => "car"),
            getStartLocation: jest.fn(() => null),
            getEndLocation: jest.fn(() => null)
        };

        ui.routeManager = {
            displayRoute: jest.fn()
        };

        window.getComputedStyle = () => ({
            getPropertyValue: () => "#ABCDEF"
        });

        ui.applyTheme("ocean");

        expect(ui.routeManager.displayRoute)
            .toHaveBeenCalledWith({ id: 1 }, "car", "#ABCDEF");
    });


});
