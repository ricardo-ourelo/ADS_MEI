/**
 * @jest-environment jsdom
 * @file mapManager.test.js
 * @description Testes automatizados para US01 — Visualização do mapa interativo.
 */

// Importa o objeto jest explicitamente (necessário em ESM)
import { jest } from "@jest/globals";
import { MapManager } from "../src/ui/mapManager.js";

// Mock do Leaflet (para evitar carregar mapa real)
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
};

describe("US01 — Visualização do mapa interativo", () => {
    let mapManager;

    beforeEach(() => {
        document.body.innerHTML = `<div id="map"></div>`;
        mapManager = new MapManager();
    });

    test("deve inicializar o mapa Leaflet ao chamar initMap()", () => {
        mapManager.initMap();

        expect(L.map).toHaveBeenCalledTimes(1);
        expect(L.tileLayer).toHaveBeenCalledTimes(1);
    });

    test("deve adicionar um marcador quando chamado addMarker()", () => {
        mapManager.map = { on: jest.fn(), addLayer: jest.fn() };
        mapManager.addMarker(38.7169, -9.1399);

        expect(L.marker).toHaveBeenCalledWith([38.7169, -9.1399]);
    });
    test("deve chamar addMarker() quando o evento 'click' ocorre no mapa", () => {
        // Espia o método addMarker da instância
        const spy = jest.spyOn(mapManager, "addMarker");

        // Cria um mock para o mapa com suporte a eventos
        const fakeMap = {
            setView: jest.fn().mockReturnThis(),
            on: jest.fn((event, handler) => {
                if (event === "click") {
                    // Simula um clique no mapa
                    handler({ latlng: { lat: 38.7169, lng: -9.1399 } });
                }
            }),
        };

        // Substitui o mapa real pelo mock
        global.L.map = jest.fn(() => fakeMap);
        global.L.tileLayer = jest.fn(() => ({ addTo: jest.fn() }));
        global.L.marker = jest.fn(() => ({ addTo: jest.fn() }));

        // Inicializa o mapa e simula o clique
        mapManager.initMap();

        // Verifica se o método addMarker() foi chamado automaticamente
        expect(spy).toHaveBeenCalledWith(38.7169, -9.1399);

        spy.mockRestore(); // Limpa o spy
    });

});
