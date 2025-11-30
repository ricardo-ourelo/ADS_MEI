/**
 * @jest-environment jsdom
 * @file uiController.US07.test.js
 */

import {describe, jest} from "@jest/globals";
import UIController from "../src/ui/uiController.js";

// mock global Sortable (evita erro ao reordenar)
global.Sortable = { create: jest.fn() };

describe("US07 — Múltiplos destinos (paragens intermédias)", () => {
    let ui;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="page-map"><aside></aside></div>

            <div id="stops-container"></div>
            <button id="add-stop-btn"></button>

            <input id="start">
            <input id="end">

            <button id="calculate-route-btn"></button>
            <select id="profile"></select>
            <div id="search-results"></div>
            <select id="theme-select"></select>
        `;

        ui = new UIController();

        ui.mapManager = {
            getMap: () => ({ closePopup: jest.fn() })
        };

        ui.stateManager = {
            isReadyForRoute: jest.fn(() => true),
            getStartLocation: jest.fn(() => ({ lat: 1, lng: 1 })),
            getEndLocation: jest.fn(() => ({ lat: 2, lng: 2 })),
            getActiveProfile: jest.fn(() => "car"),
            setStartLocation: jest.fn(),
            setEndLocation: jest.fn(),
            setCurrentRoute: jest.fn(),
        };

        ui.searchManager = { clearSearchMarkers: jest.fn() };

        ui.routeManager = {
            calculateRoute: jest.fn(),
            displayRoute: jest.fn(),
            hasActiveRoute: jest.fn(() => false)
        };

        ui.poiManager = {
            addRouteMarker: jest.fn(),
            removeStopMarker: jest.fn(),
            clearStopMarkers: jest.fn()
        };

        ui.initializeUI = () => {};
        ui.setupEventListeners = () => {};
    });

    test("deve adicionar uma paragem ao clicar em + Adicionar paragem", () => {
        const container = document.getElementById("stops-container");
        ui.addStopRow(container);

        const rows = container.querySelectorAll(".stop-row");
        expect(rows.length).toBe(1);
    });

    test("deve registar localização numa paragem via handleLocationSelect", () => {
        const container = document.getElementById("stops-container");
        ui.addStopRow(container);

        ui.handleLocationSelect(10, 20, "Paragem X", "stop-0");

        expect(ui.stops[0]).toEqual({
            lat: 10,
            lng: 20,
            address: "Paragem X"
        });
        expect(ui.poiManager.addRouteMarker).toHaveBeenCalled();
    });

    test("deve remover paragem e reindexar", () => {
        const container = document.getElementById("stops-container");

        ui.addStopRow(container);
        ui.addStopRow(container);

        const firstRow = container.querySelector(".stop-row");
        firstRow.querySelector(".stop-remove-btn").click();

        expect(ui.stops.length).toBe(1);
        expect(ui.poiManager.clearStopMarkers).toHaveBeenCalled();
    });

    test("reindexStops deve limpar e redesenhar marcadores", () => {
        const container = document.getElementById("stops-container");

        ui.poiManager.clearStopMarkers = jest.fn();
        ui.poiManager.addRouteMarker = jest.fn();

        // cria duas linhas de paragem (cada uma com um input)
        ui.addStopRow(container);
        ui.addStopRow(container);

        // agora preenche lat/lng nos inputs
        const inputs = container.querySelectorAll("input");

        inputs[0].dataset.lat = "1";
        inputs[0].dataset.lng = "1";
        inputs[0].dataset.address = "A";
        inputs[0].value = "A";

        inputs[1].dataset.lat = "2";
        inputs[1].dataset.lng = "2";
        inputs[1].dataset.address = "B";
        inputs[1].value = "B";

        ui.reindexStops();

        expect(ui.poiManager.clearStopMarkers).toHaveBeenCalled();
        expect(ui.poiManager.addRouteMarker).toHaveBeenCalledTimes(2);

        expect(ui.stops).toEqual([
            { lat: 1, lng: 1, address: "A" },
            { lat: 2, lng: 2, address: "B" }
        ]);
    });


});
