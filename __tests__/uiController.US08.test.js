/**
 * @jest-environment jsdom
 */

import UIController from "../src/ui/uiController.js";
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
});
