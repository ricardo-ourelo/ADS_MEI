/**
 * @jest-environment jsdom
 */

import { StateManager } from "../../src/core/stateManager.js";

describe("StateManager – Testes adicionais", () => {

    let sm;

    beforeEach(() => {
        sm = new StateManager();
        jest.clearAllMocks();
    });

    // --------------------------------------------------------
    // Testar setCurrentRoute + getCurrentRoute + notify
    // --------------------------------------------------------
    test("setCurrentRoute deve atualizar rota e notificar listeners", () => {
        const callback = jest.fn();
        sm.addListener("routeChanged", callback);

        const route = { distance: 100, duration: 200 };
        sm.setCurrentRoute(route);

        expect(sm.getCurrentRoute()).toEqual(route);
        expect(callback).toHaveBeenCalledWith(route);
    });

    // --------------------------------------------------------
    // Testar setActiveProfile + getActiveProfile
    // --------------------------------------------------------
    test("setActiveProfile deve atualizar perfil e notificar listeners", () => {
        const callback = jest.fn();
        sm.addListener("profileChanged", callback);

        sm.setActiveProfile("mota");

        expect(sm.getActiveProfile()).toBe("mota");
        expect(callback).toHaveBeenCalledWith("mota");
    });

    // --------------------------------------------------------
    // Testar setUserLocation
    // --------------------------------------------------------
    test("setUserLocation deve atualizar localização do utilizador", () => {
        const callback = jest.fn();
        sm.addListener("userLocationChanged", callback);

        const loc = { lat: 10, lng: 20 };

        sm.setUserLocation(loc);

        expect(callback).toHaveBeenCalledWith(loc);
    });

    // --------------------------------------------------------
    // Testar addListener com múltiplos callbacks
    // --------------------------------------------------------
    test("addListener deve permitir múltiplos listeners por evento", () => {
        const cb1 = jest.fn();
        const cb2 = jest.fn();

        sm.addListener("startLocationChanged", cb1);
        sm.addListener("startLocationChanged", cb2);

        const loc = { lat: 1, lng: 2 };
        sm.setStartLocation(loc);

        expect(cb1).toHaveBeenCalledWith(loc);
        expect(cb2).toHaveBeenCalledWith(loc);
    });

    // --------------------------------------------------------
    // Testar notify com listener que lança erro (logs mas continua)
    // --------------------------------------------------------
    test("notify deve capturar erros dos listeners sem quebrar execução", () => {
        const badListener = jest.fn(() => {
            throw new Error("crash");
        });
        const goodListener = jest.fn();

        sm.addListener("eventX", badListener);
        sm.addListener("eventX", goodListener);

        // silenciar o console.error no teste
        jest.spyOn(console, "error").mockImplementation(() => {});

        sm.notify("eventX", 123);

        expect(badListener).toHaveBeenCalled();
        expect(goodListener).toHaveBeenCalledWith(123);
    });

    // --------------------------------------------------------
    // Testar clearAll + notify(allCleared)
    // --------------------------------------------------------
    test("clearAll deve limpar tudo e notificar evento allCleared", () => {
        const callback = jest.fn();
        sm.addListener("allCleared", callback);

        // configurar estado prévio
        sm.setStartLocation({ lat: 1, lng: 1 });
        sm.setEndLocation({ lat: 2, lng: 2 });
        sm.setCurrentRoute({ distance: 10 });

        sm.clearAll();

        expect(sm.getStartLocation()).toBeNull();
        expect(sm.getEndLocation()).toBeNull();
        expect(sm.getCurrentRoute()).toBeNull();
        expect(callback).toHaveBeenCalled();
    });

});
