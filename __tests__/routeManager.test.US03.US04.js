/**
 * @jest-environment jsdom
 * @file routeManager.test.US03.US04.js
 * @description Testes automatizados para US03 — Cálculo e exibição de rotas (OSRM).
 */
import { jest } from "@jest/globals";
import { RouteManager } from "../src/core/routeManager.js";
import { ProfileManager } from "../src/core/profileManager.js";

// Mock do Leaflet
global.L = {
    polyline: jest.fn(() => ({
        addTo: jest.fn().mockReturnThis(),
        bindPopup: jest.fn().mockReturnThis(),
        getBounds: jest.fn(),
    })),
    map: jest.fn(() => ({
        removeLayer: jest.fn(),
        fitBounds: jest.fn(),
    })),
};

// Mock do fetch (simula resposta da API /api/route)
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () =>
            Promise.resolve({
                code: "Ok",
                routes: [
                    {
                        distance: 12000, // metros
                        duration: 900, // segundos
                        geometry: { coordinates: [[-9.13, 38.71], [-9.14, 38.72]] },
                    },
                ],
            }),
    })
);

describe("US03 — Cálculo e Exibição de Rotas", () => {
    let routeManager;
    let mapMock;
    let profileManager;

    beforeEach(() => {
        mapMock = global.L.map();
        profileManager = new ProfileManager();
        routeManager = new RouteManager(mapMock, profileManager);
        jest.clearAllMocks();
    });

    test("deve calcular rota com sucesso via API", async () => {
        const start = { lat: 38.7169, lng: -9.1399 };
        const end = { lat: 38.722, lng: -9.14 };
        const profile = "car";

        const routeData = await routeManager.calculateRoute(start, end, profile);

        expect(fetch.mock.calls[0][0]).toContain(`profile=${profile}`);
        expect(routeData.code).toBe("Ok");
        expect(routeData.routes[0].distance).toBe(12000);
    });

    test("deve exibir a rota no mapa e criar polyline", () => {
        const fakeRouteData = {
            routes: [
                {
                    geometry: { coordinates: [[-9.13, 38.71], [-9.14, 38.72]] },
                    distance: 12000,
                    duration: 900,
                },
            ],
        };

        routeManager.displayRoute(fakeRouteData, "car");

        expect(L.polyline).toHaveBeenCalledTimes(1);
        expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
    });

    //US04
    test("deve retornar distância, duração e velocidade média formatadas", () => {
        const routeData = {
            routes: [
                {
                    distance: 15000,
                    duration: 1800, // 30 minutos
                },
            ],
        };

        const info = routeManager.getRouteInfo(routeData, "car");

        expect(info.distance).toBe("15.00");
        expect(info.duration).toContain("min");
        expect(parseFloat(info.avgSpeed)).toBeGreaterThan(0);
        expect(info.profileName).toContain("Carro");
    });

});
