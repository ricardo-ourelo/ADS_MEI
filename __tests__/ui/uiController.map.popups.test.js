/**
 * @jest-environment jsdom
 */

import UIController from "../../src/ui/uiController.js";
import {beforeEach, describe, expect, jest, test} from "@jest/globals";

/**
 * Testes sobre eventos do mapa, popups e interação.
 * Referências originais: :contentReference[oaicite:39]{index=39} :contentReference[oaicite:40]{index=40} :contentReference[oaicite:41]{index=41}
 */

describe("UIController — Eventos do Mapa e Popups", () => {
    let ui;

    beforeEach(() => {
        document.body.innerHTML = `
        <div id="page-map"><aside></aside></div>
        <div id="search-results"></div>
    `;

        ui = new UIController();

        ui.mapManager = {
            getMap: jest.fn(() => ({ closePopup: jest.fn() }))
        };

        ui.searchManager = {
            reverseGeocode: jest.fn(() => ({ display_name: "Praça" }))
        };

        jest.spyOn(ui, "showLocationPopup");
    });


    test("handleMapClick chama reverseGeocode e showLocationPopup", async () => {
        await ui.handleMapClick({ latlng: { lat: 10, lng: 20 } });

        expect(ui.searchManager.reverseGeocode).toHaveBeenCalledWith(10, 20);
        expect(ui.showLocationPopup).toHaveBeenCalledWith(10, 20, "Praça");
    });

    test("closeCurrentPopup fecha popup atual e popup do mapa", () => {
        const closePopup = jest.fn();
        ui.currentPopup = { closePopup };

        ui.mapManager.getMap = jest.fn(() => ({ closePopup }));

        ui.closeCurrentPopup();

        expect(closePopup).toHaveBeenCalledTimes(2);
        expect(ui.currentPopup).toBeNull();
    });

    test("showLocationPopup cria popup e abre no mapa", () => {
        jest.spyOn(ui, "closeCurrentPopup"); // deve ser chamado
        jest.spyOn(ui, "showLocationPopup"); // spy no método real

        const openOn = jest.fn();

        const popupMock = {
            setLatLng: jest.fn(() => popupMock),
            setContent: jest.fn(() => popupMock),
            openOn
        };

        global.L = {
            popup: jest.fn(() => popupMock)
        };

        // Mapa para o closePopup()
        const mapObj = { closePopup: jest.fn() };

        // Mapa usado pelo openOn()
        ui.mapManager.getMap = jest.fn(() => mapObj);

        ui.showLocationPopup(10, 20, "Aqui");

        expect(openOn).toHaveBeenCalledWith(mapObj);
    });

    test("closeCurrentPopup não falha quando currentPopup é null", () => {
        document.body.innerHTML = `<div id="page-map"><aside></aside></div>`;
        const ui2 = new UIController();

        ui2.mapManager = { getMap: () => ({ closePopup: jest.fn() }) };
        ui2.currentPopup = null;
        expect(() => ui2.closeCurrentPopup()).not.toThrow();
    });

});
