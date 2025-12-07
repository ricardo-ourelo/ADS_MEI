/**
 * @jest-environment jsdom
 */

import { OverpassManager } from "../../src/core/overpassManager.js";

global.fetch = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
});


describe("OverpassManager — executeQuery", () => {

    test("executa query com sucesso e devolve elements", async () => {
        const mgr = new OverpassManager();

        const fakeData = { elements: [{ id: 1 }] };
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(fakeData)
        });

        const result = await mgr.executeQuery("0,0,1,1", "cafe");
        expect(fetch).toHaveBeenCalledWith(
            "/api/poi?bbox=0,0,1,1&types=cafe",
            expect.any(Object)
        );
        expect(result).toEqual(fakeData.elements);
    });

    test("erro HTTP lança exceção", async () => {
        const mgr = new OverpassManager();

        fetch.mockResolvedValue({
            ok: false,
            status: 500
        });

        await expect(mgr.executeQuery("0,0,1,1"))
            .rejects.toThrow("Erro HTTP: 500");
    });

    test("erro de rede é lançado", async () => {
        const mgr = new OverpassManager();

        fetch.mockRejectedValue(new Error("Network fail"));

        await expect(mgr.executeQuery("0,0,1,1"))
            .rejects.toThrow("Network fail");
    });
});


describe("OverpassManager — getPOIsByBoundingBox", () => {

    test("chama executeQuery com bounding box e categorias", async () => {
        const mgr = new OverpassManager();

        const spy = jest.spyOn(mgr, "executeQuery")
            .mockResolvedValue([{ id: 1, lat: 10, lon: 20, tags: {} }]);

        const res = await mgr.getPOIsByBoundingBox(0, 1, 2, 3, ["cafe"]);

        expect(spy).toHaveBeenCalledWith("0,1,2,3", "cafe");
        expect(res.length).toBe(1);
    });
});


describe("OverpassManager — formatPOIsData", () => {

    test("ignora pois sem lat/lon", () => {
        const mgr = new OverpassManager();

        const res = mgr.formatPOIsData([
            { id: 1, lat: null, lon: 20 },
            { id: 2, lat: 10, lon: undefined },
        ]);

        expect(res).toEqual([]);
    });

    test("formata POIs corretamente", () => {
        const mgr = new OverpassManager();

        const res = mgr.formatPOIsData([
            { id: 1, lat: "10", lon: "20", tags: { amenity: "cafe" } }
        ]);

        expect(res[0]).toMatchObject({
            id: 1,
            lat: 10,
            lon: 20,
            category: "cafe",
            type: "node"
        });
    });

    test("calcula distância se centro fornecido", () => {
        const mgr = new OverpassManager();

        const res = mgr.formatPOIsData(
            [{ id: 1, lat: 10, lon: 20, tags: {} }],
            1, 1
        );
        expect(res[0].distance).toBeGreaterThan(0);

    });

    test("ordena por distância", () => {
        const mgr = new OverpassManager();

        const res = mgr.formatPOIsData(
            [
                { id: 1, lat: 1, lon: 1, tags: {} },     // mais perto
                { id: 2, lat: 1.1, lon: 1.1, tags: {} }// mais longe
            ],
            1, 1
        );
        expect(res[0].id).toBe(1);


    });
});


describe("OverpassManager — determineCategory", () => {
    const mgr = new OverpassManager();

    test("categorias principais", () => {
        expect(mgr.determineCategory({ amenity: "restaurant" })).toBe("restaurant");
        expect(mgr.determineCategory({ amenity: "cafe" })).toBe("cafe");
        expect(mgr.determineCategory({ tourism: "hotel" })).toBe("hotel");
        expect(mgr.determineCategory({ railway: "station" })).toBe("train_station");
        expect(mgr.determineCategory({ shop: "mall" })).toBe("mall");
    });

    test("fallback other", () => {
        expect(mgr.determineCategory({})).toBe("other");
        expect(mgr.determineCategory(null)).toBe("other");
    });
});


describe("OverpassManager — calculateDistance & toRad", () => {

    test("toRad converte corretamente", () => {
        const mgr = new OverpassManager();
        expect(mgr.toRad(180)).toBe(Math.PI);
    });

    test("calculateDistance retorna valor positivo", () => {
        const mgr = new OverpassManager();
        const d = mgr.calculateDistance(0, 0, 10, 10);
        expect(d).toBeGreaterThan(0);
    });
});


describe("OverpassManager — getIconForCategory", () => {
    const mgr = new OverpassManager();

    test("retorna ícone conhecido", () => {
        expect(mgr.getIconForCategory("cafe")).toBe("☕");
    });

    test("retorna ícone default para desconhecidos", () => {
        expect(mgr.getIconForCategory("blah")).toBe("📍");
    });
});


describe("OverpassManager — getColorForCategory", () => {
    const mgr = new OverpassManager();

    test("cor conhecida", () => {
        expect(mgr.getColorForCategory("restaurant")).toBe("#e74c3c");
    });

    test("cor default", () => {
        expect(mgr.getColorForCategory("???")).toBe("#95a5a6");
    });
});
