/**
 * @jest-environment jsdom
 */

import { POIManager } from "../../src/core/poiManager.js";
import { OverpassManager } from "../../src/core/overpassManager.js";

beforeEach(() => {
    // mock leaflet
    global.L = {
        marker: jest.fn(() => ({
            addTo: jest.fn().mockReturnThis(),
            bindPopup: jest.fn().mockReturnThis(),
            openPopup: jest.fn().mockReturnThis()
        })),
        divIcon: jest.fn(() => ({}))
    };

    // mock uiController
    global.uiController = {
        showNotification: jest.fn(),
        handleLocationSelect: jest.fn(),
        addStopFromMap: jest.fn()
    };

    // mock fetch inside OverpassManager
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ elements: [] })
        })
    );
});

describe("POIManager – testes adicionais", () => {
    let mapMock;
    let pm;

    beforeEach(() => {
        mapMock = {
            removeLayer: jest.fn(),
            addLayer: jest.fn(),
            getBounds: () => ({
                getSouthWest: () => ({ lat: 0, lng: 0 }),
                getNorthEast: () => ({ lat: 10, lng: 10 })
            })
        };

        pm = new POIManager(mapMock);
    });

    // ---------------------------
    // addCurrentLocationMarker
    // ---------------------------
    test("addCurrentLocationMarker cria e substitui marcador", () => {
        const marker1 = pm.addCurrentLocationMarker(10, 20);
        expect(L.marker).toHaveBeenCalledWith([10, 20]);

        const marker2 = pm.addCurrentLocationMarker(30, 40);
        expect(mapMock.removeLayer).toHaveBeenCalledWith(marker1);
        expect(L.marker).toHaveBeenCalledWith([30, 40]);
    });

    // ---------------------------
    // addRouteMarker
    // ---------------------------
    test("addRouteMarker substitui start e end", () => {
        const m1 = pm.addRouteMarker("start", 1, 1);
        const m2 = pm.addRouteMarker("start", 2, 2);

        expect(mapMock.removeLayer).toHaveBeenCalledWith(m1);
        expect(pm.routeMarkers.start).toBe(m2);
    });

    test("addRouteMarker adiciona stops ao array", () => {
        const m1 = pm.addRouteMarker("stop", 1, 1);
        const m2 = pm.addRouteMarker("stop", 2, 2);

        expect(pm.stopMarkers.length).toBe(2);
        expect(pm.stopMarkers[0]).toBe(m1);
        expect(pm.stopMarkers[1]).toBe(m2);
    });

    // ---------------------------
    // removeStopMarker / clearStopMarkers
    // ---------------------------
    test("removeStopMarker remove índice específico", () => {
        pm.stopMarkers = ["A", "B", "C"];
        pm.map.removeLayer = jest.fn();

        pm.removeStopMarker(1);
        expect(pm.map.removeLayer).toHaveBeenCalledWith("B");
        expect(pm.stopMarkers[1]).toBeNull();
    });

    test("clearStopMarkers remove todos os stops", () => {
        const m1 = { id: 1 };
        const m2 = { id: 2 };

        pm.stopMarkers = [m1, null, m2];
        pm.map.removeLayer = jest.fn();

        pm.clearStopMarkers();

        expect(pm.map.removeLayer).toHaveBeenCalledWith(m1);
        expect(pm.map.removeLayer).toHaveBeenCalledWith(m2);
        expect(pm.stopMarkers.length).toBe(0);
    });

    // ---------------------------
    // removeRouteMarker / clearRouteMarkers
    // ---------------------------
    test("removeRouteMarker remove start", () => {
        pm.routeMarkers.start = "markerX";
        pm.map.removeLayer = jest.fn();

        const result = pm.removeRouteMarker("start");
        expect(result).toBe(true);
        expect(pm.map.removeLayer).toHaveBeenCalledWith("markerX");
        expect(pm.routeMarkers.start).toBeNull();
    });

    test("clearRouteMarkers remove start e end", () => {
        pm.routeMarkers = { start: "A", end: "B" };
        pm.map.removeLayer = jest.fn();

        pm.clearRouteMarkers();

        expect(pm.map.removeLayer).toHaveBeenCalledWith("A");
        expect(pm.map.removeLayer).toHaveBeenCalledWith("B");
    });

    // ---------------------------
    // displayPOIs
    // ---------------------------
    test("displayPOIs adiciona POIs e devolve estatísticas", () => {
        const poi = { id: 1, lat: 10, lon: 20, category: "cafe" };

        jest.spyOn(pm, "createPOIMarker").mockReturnValue("markerObj");
        const res = pm.displayPOIs([poi]);

        expect(res.total).toBe(1);
        expect(res.categories).toEqual(["cafe"]);
        expect(pm.currentPOIs.get("cafe").get(1)).toBe("markerObj");
    });

    // ---------------------------
    // createPOIMarker
    // ---------------------------
    test("createPOIMarker usa ícone e cor corretos", () => {
        jest.spyOn(pm.overpassManager, "getIconForCategory").mockReturnValue("X");
        jest.spyOn(pm.overpassManager, "getColorForCategory").mockReturnValue("#fff");

        const poi = { id: 1, lat: 10, lon: 20, category: "testcat", name: "Teste" };

        pm.createPOIMarker(poi);

        expect(pm.overpassManager.getIconForCategory).toHaveBeenCalledWith("testcat");
        expect(pm.overpassManager.getColorForCategory).toHaveBeenCalledWith("testcat");
        expect(L.marker).toHaveBeenCalled();
    });

    // ---------------------------
    // addPOIToCategory
    // ---------------------------
    test("addPOIToCategory cria categoria e adiciona", () => {
        pm.addPOIToCategory("cafe", 123, "markerX");

        expect(pm.currentPOIs.get("cafe").get(123)).toBe("markerX");
    });

    // ---------------------------
    // getCategoryName
    // ---------------------------
    test("getCategoryName devolve nome amigável", () => {
        expect(pm.getCategoryName("cafe")).toBe("Café");
        expect(pm.getCategoryName("other")).toBe("Outro");
    });

    // ---------------------------
    // clearPOIsByCategory
    // ---------------------------
    test("clearPOIsByCategory remove só a categoria certa", () => {
        pm.currentPOIs.set("cafe", new Map([[1, "M1"], [2, "M2"]]));
        pm.currentPOIs.set("hotel", new Map([[3, "M3"]]));
        pm.map.removeLayer = jest.fn();

        const removed = pm.clearPOIsByCategory("cafe");

        expect(removed).toBe(2);
        expect(pm.currentPOIs.has("cafe")).toBe(false);
        expect(pm.currentPOIs.has("hotel")).toBe(true);
    });
});
