/**
 * @jest-environment jsdom
 */

import { POIManager } from "../src/core/poiManager.js";
import {beforeEach, describe, expect, jest} from "@jest/globals";

// MOCK DO LEAFLET — obrigatório
global.L = {
    marker: jest.fn(() => ({
        addTo: jest.fn().mockReturnThis(),
        bindPopup: jest.fn().mockReturnThis()
    })),
    divIcon: jest.fn(() => ({}))
};

// MOCK da API Overpass
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            elements: [
                {
                    id: 1,
                    lat: 10,
                    lon: 20,
                    tags: { amenity: "cafe" },
                    name: "Sem nome",
                    category: "cafe",
                    type: "node"
                }
            ]
        })
    })
);

// MOCK global uiController (evita erro real no POIManager)
global.uiController = { showNotification: jest.fn() };

describe("US08 — POIManager", () => {
    let pm;

    beforeEach(() => {
        pm = new POIManager({
            addLayer: jest.fn(),
            removeLayer: jest.fn(),
            getBounds: () => ({
                getSouthWest: () => ({ lat: 0, lng: 0 }),
                getNorthEast: () => ({ lat: 10, lng: 10 })
            })
        });
    });

    test("deve carregar e formatar POIs", async () => {
        const result = await pm.loadPOIsForVisibleArea(["cafe"]);
        expect(result.total).toBe(1);
    });

    test("deve remover todos os POIs", () => {
        pm.currentPOIs.set("cafe", new Map([[1, { mock: true }]]));
        const removed = pm.clearAllPOIs();
        expect(removed).toBe(1);
    });
});
