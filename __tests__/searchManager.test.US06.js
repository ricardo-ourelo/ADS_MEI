/**
 * @jest-environment jsdom
 */

import { jest } from "@jest/globals";
import { SearchManager } from "../src/core/searchManager.js";

global.fetch = jest.fn();

describe("US06 — Pesquisa de locais (SearchManager)", () => {
    let searchManager;

    beforeEach(() => {
        document.body.innerHTML = `<div id="map"></div><div id="search-results"></div>`;
        searchManager = new SearchManager({});
        jest.clearAllMocks();
    });

    test("deve chamar o endpoint /api/search com o texto pesquisado", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [{ display_name: "Lisboa", lat: 38.7169, lon: -9.1399 }]
        });

        const results = await searchManager.searchLocation("Lisboa");
        expect(fetch).toHaveBeenCalledWith("/api/search?q=Lisboa&limit=5");
        expect(results[0].display_name).toBe("Lisboa");
    });

    test("deve lançar erro se o servidor responder com erro", async () => {
        fetch.mockResolvedValueOnce({ ok: false, status: 500 });
        await expect(searchManager.searchLocation("Lisboa"))
            .rejects
            .toThrow("Erro HTTP");
    });

    test("deve limpar marcadores de pesquisa corretamente", () => {
        const fakeMap = { removeLayer: jest.fn() };
        const fakeMarker = {};
        searchManager = new SearchManager(fakeMap);
        searchManager.searchMarkers = [fakeMarker];

        searchManager.clearSearchMarkers();

        expect(fakeMap.removeLayer).toHaveBeenCalledWith(fakeMarker);
        expect(searchManager.searchMarkers.length).toBe(0);
    });
});
