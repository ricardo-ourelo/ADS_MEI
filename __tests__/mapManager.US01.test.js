/**
 * @jest-environment jsdom
 * @file mapManager.US01.test.js
 * @description Testes para US01 — Visualização do mapa interativo (MapManager).
 */

import { jest } from "@jest/globals";
import { MapManager } from "../src/core/mapManager.js";

global.L = {
    map: jest.fn(() => ({
        setView: jest.fn().mockReturnThis(),
        on: jest.fn(),
        addLayer: jest.fn(),
    })),
    tileLayer: jest.fn(() => ({
        addTo: jest.fn(),
    })),
    marker: jest.fn(() => ({
        addTo: jest.fn(),
    })),
      control: {
        layers: jest.fn(() => ({
              addTo: jest.fn(),
            })),
      },
};

describe("US01 — Visualização do mapa interativo", () => {
    let mapManager;

    beforeEach(() => {
        document.body.innerHTML = `<div id="map" style="height: 400px;"></div>`;
        mapManager = new MapManager("map");
    });

    test("deve inicializar o mapa ao chamar initialize()", () => {
        mapManager.initialize();

        expect(L.map).toHaveBeenCalledWith("map");
        expect(L.tileLayer).toHaveBeenCalledTimes(3);
    });

    test("deve permitir adicionar um marcador no mapa", () => {
        mapManager.initialize();
        mapManager.addMarker(38.7169, -9.1399, "Teste");


        expect(L.marker).toHaveBeenCalledWith([38.7169, -9.1399], expect.any(Object));


    });
});
