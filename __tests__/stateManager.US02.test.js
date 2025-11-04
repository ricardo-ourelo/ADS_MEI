/**
 * @jest-environment jsdom
 * @file stateManager.US02.test.js
 * @description Testes para US02 — Seleção de origem e destino (StateManager).
 */

import { jest } from "@jest/globals";
import { StateManager } from "../src/core/stateManager.js";

describe("US02 — Seleção de origem e destino", () => {
    let stateManager;

    beforeEach(() => {
        stateManager = new StateManager();
    });

    test("deve definir a origem e destino corretamente", () => {
        const origem = { lat: 38.7169, lng: -9.1399 };
        const destino = { lat: 38.722, lng: -9.14 };

        stateManager.setStartLocation(origem);
        stateManager.setEndLocation(destino);

        expect(stateManager.getStartLocation()).toEqual(origem);
        expect(stateManager.getEndLocation()).toEqual(destino);
    });

    test("deve indicar que está pronto para calcular rota quando origem e destino existirem", () => {
        stateManager.setStartLocation({ lat: 1, lng: 1 });
        stateManager.setEndLocation({ lat: 2, lng: 2 });

        expect(stateManager.isReadyForRoute()).toBe(true);
    });

    test("deve limpar todas as localizações ao chamar clearAll()", () => {
        stateManager.setStartLocation({ lat: 1, lng: 1 });
        stateManager.setEndLocation({ lat: 2, lng: 2 });
        stateManager.clearAll();

        expect(stateManager.getStartLocation()).toBeNull();
        expect(stateManager.getEndLocation()).toBeNull();
    });
});
