/**
 * @jest-environment jsdom
 */

import UIController from "../../src/ui/uiController.js";
import {describe, beforeEach, test, expect, jest} from "@jest/globals";

/**
 * Testes de geolocalização e uso de POI
 * Referências originais: :contentReference[oaicite:45]{index=45} :contentReference[oaicite:46]{index=46}
 */

describe("UIController — Geolocalização e POI", () => {

    let ui;

    beforeEach(() => {
        document.body.innerHTML = `
        <div id="page-map"><aside></aside></div>
        <input id="start">
        <button id="calculate-route-btn"></button>
        <div class="notifications"></div>
    `;

        ui = new UIController();

        ui.mapManager = {
            getMap: jest.fn(() => ({ panTo: jest.fn() })),
            setView: jest.fn()
        };

        ui.poiManager = {
            addCurrentLocationMarker: jest.fn()
        };

        ui.stateManager = {
            setUserLocation: jest.fn(),
            setStartLocation: jest.fn(),
            getStartLocation: jest.fn(() => null)
        };

        navigator.geolocation = {
            getCurrentPosition: jest.fn((success) => {
                success({
                    coords: { latitude: 10, longitude: 20 }
                });
            })
        };

    });

    test("centra no utilizador quando geolocaliza", async () => {
        await ui.getUserLocation();

        expect(ui.mapManager.setView).toHaveBeenCalledWith(10, 20, 13);
        expect(ui.poiManager.addCurrentLocationMarker).toHaveBeenCalled();
    });

    test("usePOIAsLocation usa o POI como start ou end", () => {
        ui.stateManager = {
            getStartLocation: jest.fn(() => null)
        };

        ui.handleLocationSelect = jest.fn();

        ui.usePOIAsLocation(10, 20, "POI");

        expect(ui.handleLocationSelect).toHaveBeenCalledWith(10,20,"POI","start");
    });

    test("mostra notificação em caso de erro na geolocalização", async () => {
        let ui2 = new UIController();
        document.body.innerHTML = `
            <input id="start">
            <div id="page-map"><aside></aside></div>
        `;

        ui2 = new UIController();
        ui2.showNotification = jest.fn();

        navigator.geolocation = {
            getCurrentPosition: (success, error) => {
                error({ code: 1, message: "Denied" });
            }
        };

        await ui2.getUserLocation();

        expect(ui2.showNotification).toHaveBeenCalled();
    });

    test("getUserLocation preenche campo start automaticamente", async () => {
        document.body.innerHTML = `
        <input id="start">
        <div id="page-map"><aside></aside></div>
    `;

        const ui = new UIController();

        ui.mapManager = { setView: jest.fn() };
        ui.poiManager = { addCurrentLocationMarker: jest.fn() };
        ui.stateManager = { setUserLocation: jest.fn(), setStartLocation: jest.fn() };

        navigator.geolocation.getCurrentPosition = jest.fn((success) => {
            success({ coords: { latitude: 1, longitude: 2 } });
        });

        await ui.getUserLocation();

        expect(document.getElementById("start").value).toBe("Minha Localização");
        expect(ui.stateManager.setStartLocation).toHaveBeenCalled();
    });

    test("getUserLocation mostra notificação quando geolocalização falha", async () => {
        document.body.innerHTML = `
        <input id="start">
        <div id="page-map"><aside></aside></div>
    `;

        const ui = new UIController();
        ui.showNotification = jest.fn();

        navigator.geolocation.getCurrentPosition = (_, error) => {
            error({ code: 1 });
        };

        await ui.getUserLocation();

        expect(ui.showNotification).toHaveBeenCalled();
    });

});
