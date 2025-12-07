/**
 * @jest-environment jsdom
 */

import UIController from "../../src/ui/uiController.js";
import {beforeEach, describe, expect, jest, test} from "@jest/globals";

/**
 * Testes relacionados com stops (paragens): add, reindex, sortable, addFromMap, remoção
 * Referências originais: :contentReference[oaicite:31]{index=31} :contentReference[oaicite:32]{index=32} :contentReference[oaicite:33]{index=33}
 */

global.Sortable = undefined; // alguns testes alteram global.Sortable; sobrepor por defeito

describe("UIController — Stops / Paragens", () => {
    let ui;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="stops-container"></div>
            <button id="add-stop-btn"></button>
        `;

        ui = new UIController();

        ui.poiManager = {
            clearStopMarkers: jest.fn(),
            addRouteMarker: jest.fn(),
            removeStopMarker: jest.fn()
        };

        ui.mapManager = {
            getMap: () => ({ closePopup: jest.fn() }),
            removeMarker: jest.fn()
        };

        ui.stateManager = {
            isReadyForRoute: () => false,
            getStartLocation: () => null,
            getEndLocation: () => null
        };

        ui.routeManager = {
            clearRoute: jest.fn(),
            hasActiveRoute: jest.fn(() => false)
        };

        ui.searchManager = {
            clearSearchMarkers: jest.fn()
        };

        ui.updateStopMarker = jest.fn();
        ui.handleLocationSelect = jest.fn();

    });

    test("addStopFromMap usa o primeiro índice livre", () => {
        ui.stops = [{}, null, {}];

        ui.addStopFromMap(10, 20, "Teste");

        expect(ui.handleLocationSelect).toHaveBeenCalledWith(
            10,
            20,
            "Teste",
            "stop-1"
        );
    });

    test("addStopRow adiciona linha ao container", () => {
        const container = document.getElementById("stops-container");
        ui.initStopsSortable = jest.fn();

        ui.stops = [];

        ui.addStopRow(container);

        expect(container.querySelector(".stop-row")).not.toBeNull();
        expect(ui.initStopsSortable).toHaveBeenCalled();
    });

    test("reindexStops reorganiza dados e limpa marcadores", () => {
        document.body.innerHTML = `
            <div id="stops-container">
                <div class="stop-row">
                    <input data-stop-index="5" id="stop-5" data-lat="1" data-lng="2"/>
                </div>
            </div>
        `;

        ui.poiManager = {
            clearStopMarkers: jest.fn(),
            addRouteMarker: jest.fn()
        };

        ui.reindexStops();

        expect(ui.stops.length).toBe(1);
        expect(ui.poiManager.clearStopMarkers).toHaveBeenCalled();
    });

    test("initStopsSortable não falha quando Sortable não existe", () => {
        document.body.innerHTML = `<div id="stops-container"></div>`;
        const ui2 = new UIController();

        global.Sortable = undefined;

        expect(() => ui2.initStopsSortable()).not.toThrow();
    });

    test("se já existir sortable, destrói antes", () => {
        // mock Sortable com create que retorna objeto com destroy
        global.Sortable = {
            create: jest.fn(() => ({ destroy: jest.fn() }))
        };

        const ui3 = new UIController();
        document.body.innerHTML = `<div id="stops-container"></div>`;

        ui3.initStopsSortable();

        const firstInstance = ui3._stopsSortable;
        const destroySpy = jest.spyOn(firstInstance, "destroy");

        ui3.initStopsSortable();

        expect(destroySpy).toHaveBeenCalled();
    });

    test("reindexStops preserva valores válidos e mantém null quando faltam dados", () => {
        document.body.innerHTML = `
        <div id="stops-container">
            <div class="stop-row"><input id="stop-5" data-stop-index="5" data-lat="10" data-lng="20" value="A"></div>
            <div class="stop-row"><input id="stop-9" data-stop-index="9"></div>
        </div>
    `;

        const ui = new UIController();
        ui.poiManager = {
            clearStopMarkers: jest.fn(),
            addRouteMarker: jest.fn()
        };

        ui.reindexStops();

        expect(ui.stops).toEqual([
            { lat: 10, lng: 20, address: "A" },
            null
        ]);
    });

    test("handleLocationSelect cria stop-row automaticamente quando input não existe", () => {
        document.body.innerHTML = `
        <div id="stops-container"></div>
    `;

        const ui = new UIController();

        ui.mapManager = {
            getMap: () => ({ closePopup: jest.fn() }),
            removeMarker: jest.fn()
        };

        ui.poiManager = {
            removeStopMarker: jest.fn(),
            addRouteMarker: jest.fn()
        };

        ui.stateManager = {
            isReadyForRoute: () => false
        };

        ui.routeManager = {
            clearRoute: jest.fn()
        };

        ui.searchManager = {
            clearSearchMarkers: jest.fn()
        };

        ui.handleLocationSelect(10, 20, "Local Y", "stop-0");

        expect(document.querySelector(".stop-row")).not.toBeNull();
        expect(ui.stops[0]).toEqual({ lat: 10, lng: 20, address: "Local Y" });
    });






});
