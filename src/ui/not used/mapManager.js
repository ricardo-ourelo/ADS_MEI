/**
 * @file mapManager.js
 * @description Gere o mapa Leaflet (visualização e interações).
 */

export class MapManager {
  constructor() {
    // Inicializa variáveis principais
    this.map = null;
    this.markers = []; // guarda os marcadores (origem e destino)
    this.origem = null;
    this.destino = null;
  }

  initMap() {
    console.log("Inicializar mapa Leaflet...");

    // Cria o mapa centrado em Lisboa
    this.map = L.map("map").setView([38.7169, -9.1399], 13);

    // Adiciona camada base do OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Evento: clique no mapa → adiciona marcador
    this.map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      this.handleMapClick(lat, lng);
    });

    // Liga eventos das caixas de texto
    this.initTextInputs();
  }

  handleMapClick(lat, lng) {
    // Se já existem dois marcadores, limpa tudo
    if (this.markers.length >= 2) {
      this.clearMarkers();
    }

    // Adiciona marcador novo ao mapa
    const marker = L.marker([lat, lng]).addTo(this.map);
    this.markers.push(marker);

    // Primeiro clique → origem
    if (this.markers.length === 1) {
      this.origem = { lat, lng };
      document.getElementById("origem").value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    // Segundo clique → destino
    else if (this.markers.length === 2) {
      this.destino = { lat, lng };
      document.getElementById("destino").value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      this.enableRouteButton();
    }
  }

  clearMarkers() {
    // Remove todos os marcadores do mapa
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    // Limpa variáveis e campos de texto
    this.origem = null;
    this.destino = null;
    document.getElementById("origem").value = "";
    document.getElementById("destino").value = "";
    document.getElementById("calcularRota").disabled = true;
  }

  enableRouteButton() {
    // Ativa o botão apenas se ambos os pontos existirem
    const button = document.getElementById("calcularRota");
    button.disabled = !(this.origem && this.destino);
  }

  initTextInputs() {
    // Liga eventos às caixas de texto e ao botão
    const origemInput = document.getElementById("origem");
    const destinoInput = document.getElementById("destino");
    const button = document.getElementById("calcularRota");

    origemInput.addEventListener("change", () => this.geocodeInput(origemInput, "origem"));
    destinoInput.addEventListener("change", () => this.geocodeInput(destinoInput, "destino"));
    button.addEventListener("click", () => this.calcularRota());
  }

  async geocodeInput(input, tipo) {
    // Obtém texto introduzido e procura coordenadas via Nominatim
    const valor = input.value.trim();
    if (!valor) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(valor)}`
      );
      const data = await response.json();

      // Se encontrou localização → adiciona marcador
      if (data.length > 0) {
        const { lat, lon } = data[0];
        this.addMarkerFromInput(parseFloat(lat), parseFloat(lon), tipo);
      } else {
        alert("Localização não encontrada!");
      }
    } catch (err) {
      console.error("Erro ao geocodificar:", err);
    }
  }

  addMarkerFromInput(lat, lng, tipo) {
    // Cria marcador a partir da morada escrita

    if (tipo === "origem") {
      // Atualiza ou cria marcador de origem
      if (this.markers[0]) this.map.removeLayer(this.markers[0]);
      const marker = L.marker([lat, lng]).addTo(this.map);
      this.markers[0] = marker;
      this.origem = { lat, lng };
      this.map.setView([lat, lng], 13);
    } else if (tipo === "destino") {
      // Atualiza ou cria marcador de destino
      if (this.markers[1]) this.map.removeLayer(this.markers[1]);
      const marker = L.marker([lat, lng]).addTo(this.map);
      this.markers[1] = marker;
      this.destino = { lat, lng };
      this.map.setView([lat, lng], 13);
    }

    // Ativa botão se ambos os pontos existirem
    this.enableRouteButton();
  }

  calcularRota() {
    // Função temporária (vai ligar à API OSRM no futuro)
    if (!this.origem || !this.destino) return;

    alert(`Calcular rota de (${this.origem.lat}, ${this.origem.lng}) até (${this.destino.lat}, ${this.destino.lng})`);
  }
}
