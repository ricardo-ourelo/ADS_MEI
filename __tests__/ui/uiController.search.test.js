/**
 * @jest-environment jsdom
 */

import UIController from "../../src/ui/uiController.js";
import {describe, beforeEach, test, expect, jest} from "@jest/globals";

/**
 * Testes de pesquisa / displaySearchResults / handleSearch (inclui erros)
 * Referências originais: :contentReference[oaicite:35]{index=35} :contentReference[oaicite:36]{index=36} :contentReference[oaicite:37]{index=37} :contentReference[oaicite:38]{index=38}
 */

describe("UIController — Pesquisa e Resultados", () => {

    let ui;

    beforeEach(() => {
        document.body.innerHTML = `
            <input id="start">
            <div id="search-results"></div>
        `;

        ui = new UIController();
        ui.handleLocationSelect = jest.fn();
        ui.closeCurrentPopup = jest.fn();
    });

    test("handleSearch não faz nada se campo não existir", async () => {
        ui.showNotification = jest.fn();
        await ui.handleSearch("inexistente");
        expect(ui.showNotification).not.toHaveBeenCalled();
    });

    test("handleSearch alerta quando query está vazia", async () => {
        ui.showNotification = jest.fn();
        document.getElementById("start").value = "";
        await ui.handleSearch("start");

        expect(ui.showNotification).toHaveBeenCalledWith(
            "Por favor, digite um endereço para pesquisar",
            "warning"
        );
    });

    test("mostra erro quando searchManager.search falha", async () => {
        document.body.innerHTML = `
            <input id="start">
            <button id="start-btn"></button>
        `;

        ui = new UIController();
        ui.searchManager = {
            searchLocation: jest.fn(() => { throw new Error("Falhou"); }),
            clearSearchMarkers: jest.fn()
        };
        ui.showNotification = jest.fn();
        ui.showLoading = jest.fn();
        ui.hideLoading = jest.fn();

        document.getElementById("start").value = "Lisboa";

        await ui.handleSearch("start");

        expect(ui.showNotification)
            .toHaveBeenCalledWith(expect.stringContaining("Erro ao pesquisar"), "error");
    });

    test("displaySearchResults mostra mensagem quando vazio", () => {
        ui.displaySearchResults = UIController.prototype.displaySearchResults;

        ui.displaySearchResults([], "start");

        expect(document.getElementById("search-results").innerHTML)
            .toContain("Nenhum resultado encontrado");
    });

    test("clique num item preenche input e chama handleLocationSelect", () => {
        ui = new UIController();
        ui.handleLocationSelect = jest.fn();
        ui.searchManager = {
            addSearchMarkers: jest.fn(),
            clearSearchMarkers: jest.fn()
        };
        ui.closeCurrentPopup = jest.fn();

        document.body.innerHTML = `
            <input id="start">
            <div id="search-results"></div>
        `;

        const results = [{
            display_name: "Local X",
            lat: "10",
            lon: "20"
        }];

        ui.displaySearchResults(results, "start");

        const item = document.querySelector(".search-result-item");
        item.click();

        expect(ui.handleLocationSelect)
            .toHaveBeenCalledWith("10", "20", "Local X", "start");

        expect(document.getElementById("start").value)
            .toBe("Local X");
    });

    test("handleSearch mostra aviso e limpa resultados quando não há resultados", async () => {
        document.body.innerHTML = `
        <input id="start" value="Lisboa">
        <div id="search-results"></div>
    `;

        const ui = new UIController();
        ui.searchManager = {
            searchLocation: jest.fn(() => []),
            clearSearchMarkers: jest.fn()
        };

        ui.showNotification = jest.fn();
        ui.showLoading = jest.fn();
        ui.hideLoading = jest.fn();

        await ui.handleSearch("start");

        expect(ui.showNotification)
            .toHaveBeenCalledWith("Nenhum resultado encontrado para essa pesquisa", "warning");
        expect(document.getElementById("search-results").innerHTML).toBe("");
    });

    test("displaySearchResults cria múltiplos itens e chama callback correto", () => {
        document.body.innerHTML = `
        <input id="start">
        <div id="search-results"></div>
    `;

        const ui = new UIController();

        ui.mapManager = {
            getMap: () => ({ closePopup: jest.fn() })
        };

        ui.searchManager = {
            addSearchMarkers: jest.fn(),
            clearSearchMarkers: jest.fn()
        };

        ui.handleLocationSelect = jest.fn();

        const results = [
            { display_name: "A", lat: 1, lon: 2 },
            { display_name: "B", lat: 3, lon: 4 }
        ];

        ui.displaySearchResults(results, "start");

        const items = document.querySelectorAll(".search-result-item");
        items[1].click(); // clicar no segundo item

        expect(ui.handleLocationSelect)
            .toHaveBeenCalledWith(3, 4, "B", "start");
    });

    test("clique fora fecha caixa de resultados", () => {
        document.body.innerHTML = `
    <button id="calculate-route-btn"></button>
    <input id="start">
    <button id="search-start-btn"></button>
    <input id="end">
    <button id="search-end-btn"></button>
    <button id="clear-route-btn"></button>
    <select id="profile"></select>

    <select id="theme-select"></select>

    <div id="search-results" style="display:block"></div>

    <div id="route-info"></div>

    <div id="stops-container"></div>
    <button id="add-stop-btn"></button>

    <div class="poi-bar">
        <button class="poi-icon" data-type="cafe"></button>
    </div>
    <button id="clear-pois-btn"></button>

    <div id="page-map"><aside></aside></div>
`;


        const ui = new UIController();
        ui.mapManager = { addClickHandler: jest.fn(), getMap: () => ({ closePopup: jest.fn() }) };
        ui.setupEventListeners(); // IMPORTANTE

        // clicar fora
        document.body.click();

        expect(document.getElementById("search-results").style.display)
            .toBe("none");
    });


    test("pressionar Enter no campo start chama handleSearch", () => {
        document.body.innerHTML = `
    <button id="calculate-route-btn"></button>
    <input id="start">
    <button id="search-start-btn"></button>
    <input id="end">
    <button id="search-end-btn"></button>
    <button id="clear-route-btn"></button>
    <select id="profile"></select>

    <div id="search-results" style="display:block"></div>

    <!-- necessários por outras partes do controller -->
    <div id="stops-container"></div>
    <button id="add-stop-btn"></button>
`;


        const ui = new UIController();
        ui.handleSearch = jest.fn();
        ui.mapManager = { addClickHandler: jest.fn(), getMap: () => ({ closePopup: jest.fn() }) };

        ui.setupEventListeners(); // necessário

        const event = new KeyboardEvent("keypress", { key: "Enter" });
        document.getElementById("start").dispatchEvent(event);

        expect(ui.handleSearch).toHaveBeenCalledWith("start");
    });


    test("window.selectSearchLocation chama handleLocationSelect com último campo", () => {
        document.body.innerHTML = `
    <button id="calculate-route-btn"></button>
    <input id="start">
    <button id="search-start-btn"></button>
    <input id="end">
    <button id="search-end-btn"></button>
    <button id="clear-route-btn"></button>
    <select id="profile"></select>

    <div id="search-results" style="display:block"></div>

    <!-- necessários por outras partes do controller -->
    <div id="stops-container"></div>
    <button id="add-stop-btn"></button>
`;


        const ui = new UIController();
        ui.handleLocationSelect = jest.fn();
        ui.mapManager = { addClickHandler: jest.fn(), getMap: () => ({ closePopup: jest.fn() }) };

        ui.setupEventListeners(); // cria window.selectSearchLocation

        window.__lastSearchField = "start";

        window.selectSearchLocation(1, 2, "X");

        expect(ui.handleLocationSelect).toHaveBeenCalledWith(1, 2, "X", "start");
    });


    test("initThemeSelector aplica tema guardado no localStorage", () => {
        document.body.innerHTML = `
    <button id="calculate-route-btn"></button>
    <input id="start">
    <button id="search-start-btn"></button>
    <input id="end">
    <button id="search-end-btn"></button>
    <button id="clear-route-btn"></button>
    <select id="profile"></select>

    <select id="theme-select"></select>

    <div id="search-results" style="display:block"></div>

    <div id="route-info"></div>

    <div id="stops-container"></div>
    <button id="add-stop-btn"></button>

    <div class="poi-bar">
        <button class="poi-icon" data-type="cafe"></button>
    </div>
    <button id="clear-pois-btn"></button>

    <div id="page-map"><aside></aside></div>
`;



        localStorage.setItem("panelTheme", "forest");

        const ui = new UIController();
        ui.applyTheme = jest.fn();

        ui.initThemeSelector();

        expect(ui.applyTheme).toHaveBeenCalledWith("forest");
    });

});
