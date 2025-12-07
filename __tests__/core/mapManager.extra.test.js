/**
 * @jest-environment jsdom
 * @file mapManager.extra.test.js
 * Testes adicionais para mapManager.js (caminhos laterais e utilitários)
 */

import { jest } from "@jest/globals";
import { MapManager } from "../../src/core/mapManager.js";

beforeEach(() => {
    // DOM mínimo
    document.body.innerHTML = `<div id="map" style="height:400px;"></div>`;

    // Mock L mais completo para estes testes
    global.L = {
        map: jest.fn(() => ({
            setView: jest.fn().mockReturnThis(),
            on: jest.fn(),
            addLayer: jest.fn(),
            fitBounds: jest.fn(),
            hasLayer: jest.fn(() => true),
            removeLayer: jest.fn(),
            closePopup: jest.fn(),
            getBounds: jest.fn(() => ({ toString: () => 'bounds' }))
        })),

        tileLayer: jest.fn(() => ({
            addTo: jest.fn(),
        })),

        marker: jest.fn(() => ({
            addTo: jest.fn(),
            bindPopup: jest.fn().mockReturnThis()
        })),

        // CONTROLO ÚNICO E CORRECTO
        control: Object.assign(
            jest.fn((opts) => ({
                onAdd: null,
                addTo: jest.fn(),
                options: opts
            })),
            {
                layers: jest.fn(() => ({
                    addTo: jest.fn(),
                    addBaseLayer: jest.fn(),
                }))
            }
        ),

        DomUtil: {
            create: jest.fn((tag, cls) => {
                const el = document.createElement(tag);
                el.className = cls || "";
                return el;
            })
        }
    };

});

// TESTES
describe("MapManager — testes adicionais de funcionalidades", () => {
    test("addBaseLayer deve registar camada e usar layerControl quando existir", () => {
        const mm = new MapManager("map");
        // Simula layerControl já presente
        mm.layerControl = { addBaseLayer: jest.fn() };
        mm.baseLayers = {}; // start clean

        mm.addBaseLayer("Nome", "https://tile/{z}/{x}/{y}.png", "Attr");

        expect(mm.baseLayers.Nome).toBeDefined();
        expect(mm.baseLayers.Nome).toBeDefined();// L.tileLayer mock retorna objecto com addTo, mas verificamos existência
        expect(mm.layerControl.addBaseLayer).toHaveBeenCalled();
    });

    test("setView com e sem zoom chama map.setView apropriadamente", () => {
        const mm = new MapManager("map");
        mm.map = L.map("map");

        mm.setView(10, 20);
        expect(mm.map.setView).toHaveBeenCalledWith([10, 20]);

        mm.setView(11, 21, 8);
        expect(mm.map.setView).toHaveBeenCalledWith([11, 21], 8);
    });

    test("fitBounds chama map.fitBounds com opções por omissão", () => {
        const mm = new MapManager("map");
        mm.map = L.map("map");

        const fakeBounds = { _fake: true };
        mm.fitBounds(fakeBounds);
        expect(mm.map.fitBounds).toHaveBeenCalledWith(fakeBounds, { padding: [20, 20] });
    });

    test("removeMarker retorna true quando marker está no mapa", () => {
        // 1. mock completo ANTES de criar MapManager
        const mockMap = {
            setView: jest.fn().mockReturnThis(),
            on: jest.fn(),
            addLayer: jest.fn(),
            fitBounds: jest.fn(),
            hasLayer: jest.fn(() => true),
            removeLayer: jest.fn(),
            closePopup: jest.fn()
        };

        global.L.map = jest.fn(() => mockMap);

        // 2. DOM antes de criar MapManager
        document.body.innerHTML = `<div id="map"></div>`;

        // 3. Agora sim, criar MapManager
        const mm = new MapManager("map");

        const marker = {};

        expect(mm.removeMarker(marker)).toBe(true);
        expect(mockMap.removeLayer).toHaveBeenCalledWith(marker);
    });

    test("removeMarker retorna false quando marker não está no mapa", () => {
        const mockMap = {
            setView: jest.fn().mockReturnThis(),
            on: jest.fn(),
            addLayer: jest.fn(),
            fitBounds: jest.fn(),
            hasLayer: jest.fn(() => false),
            removeLayer: jest.fn(),
            closePopup: jest.fn()
        };

        global.L.map = jest.fn(() => mockMap);

        document.body.innerHTML = `<div id="map"></div>`;
        const mm = new MapManager("map");

        const marker = {};

        expect(mm.removeMarker(marker)).toBe(false);
        expect(mockMap.removeLayer).not.toHaveBeenCalled();
    });




    test("addClickHandler e handleMapClick invocam handlers e capturam excepções", () => {
        const mm = new MapManager("map");
        const called = [];
        mm.addClickHandler((e) => called.push(e.a));
        mm.addClickHandler(() => { throw new Error("boom"); });
        // espiar console.error para não poluir output
        const spyErr = jest.spyOn(console, "error").mockImplementation(() => {});

        // Simular evento
        mm.handleMapClick({ a: 1 });

        expect(called).toEqual([1]);
        expect(spyErr).toHaveBeenCalled();

        spyErr.mockRestore();
    });

    test("getMap e getBounds devolvem map e chamam getBounds", () => {
        const mm = new MapManager("map");
        mm.map = L.map("map");
        expect(mm.getMap()).toBe(mm.map);
        // getBounds usa this.map.getBounds
        mm.map.getBounds = jest.fn(() => "bounds");
        expect(mm.getBounds()).toBe("bounds");
    });

    test("addLegend cria controlo e chama addTo", () => {
        const mm = new MapManager("map");
        mm.map = L.map("map");

        // Preparar L.control mock que devolve objecto com onAdd
        const controlObj = {
            onAdd: jest.fn(() => {
                const d = document.createElement('div');
                d.innerHTML = 'leg';
                return d;
            }),
            addTo: jest.fn()
        };
        // Substituir L.control por função que retorna controlObj
        L.control = jest.fn(() => controlObj);

        const legend = mm.addLegend("<b>Legenda</b>", "topright");
        expect(L.control).toHaveBeenCalledWith({ position: "topright" });
        expect(controlObj.addTo).toHaveBeenCalledWith(mm.map);
        expect(legend).toBe(controlObj);
    });

    test("destroy limpa recursos e fecha mapa", () => {
        const mm = new MapManager("map");
        const fakeMap = {
            remove: jest.fn()
        };
        mm.map = fakeMap;
        mm.baseLayers = { a: 1 };
        mm.overlays = { b: 2 };
        mm.layerControl = { c: 3 };
        mm.clickHandlers = [() => {}];

        mm.destroy();

        expect(mm.map).toBeNull();
        expect(mm.clickHandlers).toEqual([]);
        expect(mm.baseLayers).toEqual({});
        expect(mm.overlays).toEqual({});
    });

    test("closePopup chama map.closePopup quando existe mapa", () => {
        const mm = new MapManager("map");
        mm.map = { closePopup: jest.fn() };
        mm.closePopup();
        expect(mm.map.closePopup).toHaveBeenCalled();
    });
});
