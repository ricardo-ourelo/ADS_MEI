/**
 * @jest-environment jsdom
 */

import UIController from "../../src/ui/uiController.js";
import {beforeEach, describe, expect, jest, test} from "@jest/globals";

/**
 * Reune testes relacionados com loading / notificações / estado visual.
 * Referências originais: :contentReference[oaicite:26]{index=26} :contentReference[oaicite:27]{index=27}
 */

describe("UIController — UI Visual (loading, notifications)", () => {

    let ui;
    let btn;

    beforeEach(() => {
        document.body.innerHTML = `
        <div id="page-map"><aside></aside></div>

        <input id="calculate-route-btn">
        <button id="calculate-route-btn">Calcular</button>

        <input id="start"><button></button>
        <input id="end"><button></button>

        <div id="stops-container"></div>
        <div class="notifications"></div>
    `;


        ui = new UIController();

        // garantir managers sem side effects
        ui.stateManager = {
            getCurrentRoute: jest.fn(() => null),
            isReadyForRoute: jest.fn(() => false),
            clearAll: jest.fn()
        };

        ui.routeManager = { clearRoute: jest.fn() };
        ui.poiManager = { clearRouteMarkers: jest.fn() };
        ui.searchManager = { clearSearchMarkers: jest.fn() };

        btn = document.querySelector("#calculate-route-btn");
    });

    test("showLoading adiciona spinner e classe loading", () => {
        ui.showLoading("calculate-route-btn");

        const targetBtn = document.querySelector("#calculate-route-btn").nextElementSibling;

        expect(targetBtn.classList.contains("loading")).toBe(true);
    });


    test("hideLoading restaura conteúdo original e remove loading", () => {
        ui.showLoading("calculate-route-btn");
        ui.hideLoading("calculate-route-btn", "Calcular");

        expect(btn.classList.contains("loading")).toBe(false);
    });

    test("showRouteLoading atua sobre botão calcular rota", () => {
        ui.showRouteLoading();
        expect(btn.classList.contains("loading")).toBe(true);
    });

    test("showNotification cria uma notificação temporária", () => {
        ui.showNotification("Teste OK");

        const notif = document.querySelector(".ui-notification");
        expect(notif).not.toBeNull();
        expect(notif.innerHTML).toContain("Teste OK");
    });

    test("notificações desaparecem após timeout", () => {
        jest.useFakeTimers();

        document.body.innerHTML = `
        <div id="page-map"><aside></aside></div>
    `;

        ui.showNotification("Hello");

        expect(document.querySelectorAll(".ui-notification").length).toBe(1);

        jest.runAllTimers();

        expect(document.querySelectorAll(".ui-notification").length).toBe(0);
    });

    // casos de erro / ausencia de elementos
    test("showLoading lança erro quando o input não existe", () => {
        document.body.innerHTML = `<div></div>`;
        const ui2 = new UIController();

        expect(() => ui2.showLoading("missing")).toThrow();
    });

    test("hideLoading lança erro quando o input não existe", () => {
        document.body.innerHTML = `<div></div>`;
        const ui2 = new UIController();

        expect(() => ui2.hideLoading("missing")).toThrow();
    });

});
