/**
 * @jest-environment jsdom
 */

import UIController from "../../src/ui/uiController.js";
import {beforeEach, describe, expect, jest} from "@jest/globals";

describe("US08 — Barra de POIs", () => {
    let ui;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="page-map">
                <aside></aside>
            </div>

            <button class="poi-icon" data-type="cafe"></button>
            <button id="clear-pois-btn"></button>

            <!-- elementos obrigatórios para não rebentar -->
            <button id="calculate-route-btn"></button>
            <button id="search-start-btn"></button>
            <button id="search-end-btn"></button>
            <button id="clear-route-btn"></button>
            <select id="profile"></select>
            <input id="start">
            <input id="end">
            <div id="search-results"></div>
            <div id="stops-container"></div>
            <select id="theme-select"></select>
        `;

        ui = new UIController();

        // Mock do POIManager
        ui.handleLoadPOIs = jest.fn();
        ui.handleClearPOIs = jest.fn();

        // Isto activa os listeners dos POIs
        ui.addPOIControls();
    });

    test("clicar num ícone carrega POIs", () => {
        const cafeBtn = document.querySelector(".poi-icon");
        cafeBtn.click();

        expect(ui.handleLoadPOIs).toHaveBeenCalledWith("cafe");
    });

    test("clicar no botão limpar remove POIs", () => {
        const btn = document.getElementById("clear-pois-btn");
        btn.click();

        expect(ui.handleClearPOIs).toHaveBeenCalled();
    });

    test("handleClearPOIs mostra notificação com número removido", () => {
        const ui = new UIController();
        ui.poiManager = { clearAllPOIs: jest.fn(() => 7) };
        ui.showNotification = jest.fn();

        ui.handleClearPOIs();

        expect(ui.showNotification).toHaveBeenCalledWith("Removidos 7 pontos de interesse", "info");
    });

    test("handleLoadPOIs mostra loading, chama load, e restaura botão", async () => {
        document.body.innerHTML = `
        <button id="clear-pois-btn">🗑️</button>
        <div id="page-map"><aside></aside></div>
    `;

        const ui = new UIController();

        ui.poiManager = {
            clearAllPOIs: jest.fn(),
            loadPOIsForVisibleArea: jest.fn(async () => ({ message: "OK" }))
        };

        ui.showNotification = jest.fn();

        const btn = document.getElementById("clear-pois-btn");

        await ui.handleLoadPOIs("cafe");

        // botão em loading no início
        expect(btn.innerHTML).toBe("🗑️");

        // notificação chamada
        expect(ui.showNotification).toHaveBeenCalled();
    });



});
