/**
 * @jest-environment jsdom
 * @file mapManager.US02.test.js
 * @description Testes automatizados para US02 — Seleção de origem e destino no mapa.
 */

import { jest } from "@jest/globals";
import { MapManager } from "../src/core/mapManager.js";

// Mock do Leaflet (para não precisar de mapa real)
global.L = {
  map: jest.fn(() => ({
    setView: jest.fn().mockReturnThis(),
    on: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
  })),
  tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
  marker: jest.fn(() => ({ addTo: jest.fn().mockReturnThis() })),
};

// Mock do DOM
beforeEach(() => {
  document.body.innerHTML = `
    <input id="origem" />
    <input id="destino" />
    <button id="calcularRota" disabled></button>
    <div id="map"></div>
  `;
});

describe("US02 — Seleção de origem e destino no mapa", () => {
  let mapManager;

  beforeEach(() => {
    mapManager = new MapManager();
    mapManager.map = L.map(); // cria mapa simulado
  });

  test("deve definir a origem ao primeiro clique", () => {
    mapManager.handleMapClick(38.7169, -9.1399);

    expect(mapManager.origem).toEqual({ lat: 38.7169, lng: -9.1399 });
    expect(mapManager.destino).toBeNull();
    expect(document.getElementById("origem").value).toContain("38.7169");
  });

  test("deve definir o destino ao segundo clique", () => {
    mapManager.handleMapClick(38.7169, -9.1399); // origem
    mapManager.handleMapClick(38.7200, -9.1400); // destino

    expect(mapManager.destino).toEqual({ lat: 38.7200, lng: -9.1400 });
    expect(document.getElementById("destino").value).toContain("38.7200");
  });

  test("deve limpar os marcadores ao terceiro clique", () => {
    mapManager.handleMapClick(1, 1); // origem
    mapManager.handleMapClick(2, 2); // destino
    mapManager.handleMapClick(3, 3); // novo clique → reinicia

    expect(mapManager.markers.length).toBe(1); // só o novo marcador
    expect(mapManager.origem).not.toBeNull();
    expect(mapManager.destino).toBeNull();
  });

  test("deve ativar o botão de rota quando origem e destino existirem", () => {
    const botao = document.getElementById("calcularRota");

    mapManager.handleMapClick(1, 1); // origem
    expect(botao.disabled).toBe(true);

    mapManager.handleMapClick(2, 2); // destino
    expect(botao.disabled).toBe(false);
  });

  test("deve limpar campos de texto ao chamar clearMarkers()", () => {
    mapManager.handleMapClick(38.7169, -9.1399);
    mapManager.handleMapClick(38.7200, -9.1400);

    mapManager.clearMarkers();

    expect(document.getElementById("origem").value).toBe("");
    expect(document.getElementById("destino").value).toBe("");
    expect(document.getElementById("calcularRota").disabled).toBe(true);
  });
});
