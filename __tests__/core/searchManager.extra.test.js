/**
 * @jest-environment jsdom
 */

import { SearchManager } from "../../src/core/searchManager.js";

// Mock do Leaflet
global.L = {
    marker: jest.fn(() => ({
        addTo: jest.fn().mockReturnThis(),
        bindPopup: jest.fn().mockReturnThis()
    }))
};

beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    document.body.innerHTML = `<div id="map"></div>`;
});

describe("SearchManager – testes adicionais", () => {

    // -------------------------------------------
    //  searchLocation – query vazia
    // -------------------------------------------
    test("searchLocation lança erro quando query é vazia", async () => {
        const sm = new SearchManager({});
        await expect(sm.searchLocation("")).rejects.toThrow(
            "Query de pesquisa não pode estar vazia"
        );
    });

    // -------------------------------------------
    //  searchLocation – cache
    // -------------------------------------------
    test("searchLocation usa cache e não chama fetch novamente", async () => {
        const sm = new SearchManager({});

        const mockResult = [{ name: "Lisboa" }];
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResult
        });

        // Primeira chamada → chama fetch
        const r1 = await sm.searchLocation("Lisboa");
        expect(r1).toEqual(mockResult);
        expect(fetch).toHaveBeenCalledTimes(1);

        // Segunda chamada com mesma query → usa cache
        const r2 = await sm.searchLocation("Lisboa");
        expect(r2).toEqual(mockResult);
        expect(fetch).toHaveBeenCalledTimes(1); // NÃO chamou outra vez
    });

    // -------------------------------------------
    // reverseGeocode – sucesso
    // -------------------------------------------
    test("reverseGeocode retorna primeiro resultado válido", async () => {
        const sm = new SearchManager({});

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [{ display_name: "Local", lat: 1, lon: 2 }]
        });

        const r = await sm.reverseGeocode(1, 2);
        expect(r.display_name).toBe("Local");
    });

    // -------------------------------------------
    // reverseGeocode – erro HTTP
    // -------------------------------------------
    test("reverseGeocode lança erro em resposta HTTP inválida", async () => {
        const sm = new SearchManager({});

        fetch.mockResolvedValueOnce({ ok: false, status: 500 });

        await expect(sm.reverseGeocode(1, 2)).rejects.toThrow("Erro HTTP: 500");
    });

    // -------------------------------------------
    // reverseGeocode – erro de rede
    // -------------------------------------------
    test("reverseGeocode relança erro de rede", async () => {
        const sm = new SearchManager({});

        fetch.mockRejectedValueOnce(new Error("network down"));

        await expect(sm.reverseGeocode(1, 2)).rejects.toThrow("network down");
    });

    // -------------------------------------------
    // addSearchMarkers
    // -------------------------------------------
    test("addSearchMarkers cria marcadores e os armazena", () => {
        const map = {
            removeLayer: jest.fn()
        };

        const sm = new SearchManager(map);

        const results = [{
            display_name: "Local A",
            lat: 10,
            lon: 20
        }];

        const markers = sm.addSearchMarkers(results);

        // Criou um marker
        expect(L.marker).toHaveBeenCalledWith([10, 20]);

        // Armazenou no array
        expect(sm.searchMarkers.length).toBe(1);

        // bindPopup foi chamado
        expect(markers[0].bindPopup).toHaveBeenCalled();
    });

});
