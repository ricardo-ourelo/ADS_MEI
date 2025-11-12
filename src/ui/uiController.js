import { MapManager } from "../core/mapManager.js";
import { StateManager } from "../core/stateManager.js";
import { RouteManager } from "../core/routeManager.js";
import { ProfileManager } from "../core/profileManager.js";
import { POIManager } from "../core/poiManager.js";
import {SearchManager} from "../core/searchManager.js";

/**
 * @file uiController.js
 * @description Controlador principal da interface do utilizador (UI).
 * Integra os managers de mapa, estado, rotas, perfis e POIs.
 * Responsável por lidar com eventos do utilizador e atualizar o mapa.
 * @module ui/uiController
 */

/**
 * Classe principal da interface do utilizador (UI).
 * @class
 */
class UIController {
    constructor() {
        this.mapManager = null;
        this.stateManager = null;
        this.isInitialized = false;
        this.profileManager = null;
        this.routeManager = null;
        this.searchManager = null;
        this.currentPopup = null;
        this.poiManager = null;


    }


    /**
     * Inicializa a aplicação
     * @param {string} mapContainerId - ID do container do mapa
     */
    async initialize(mapContainerId = 'map') {
        try {
            // Inicializar managers
            this.mapManager = new MapManager(mapContainerId);
            this.stateManager = new StateManager();
            this.profileManager = new ProfileManager();

            // Inicializar mapa
            this.mapManager.initialize();
            
            // Inicializar ‘gestores’ dependentes do mapa
            this.routeManager = new RouteManager(this.mapManager.getMap(), this.profileManager);
            this.searchManager = new SearchManager(this.mapManager.getMap());
            this.poiManager = new POIManager(this.mapManager.getMap());
            // Configurar event listeners
            this.setupEventListeners();
            this.setupStateListeners();

            // Configurar UI inicial
            this.initializeUI();

            // Obter localização do utilizador
            await this.getUserLocation();
            
            this.isInitialized = true;
            console.log('UIController inicializado com sucesso!');
            
        } catch (error) {
            console.error('Erro na inicialização do UIController:', error);
            throw error;
        }
    }

    /**
     * Configura event listeners da UI
     */
    setupEventListeners() {
        // Event listeners dos botões        
        document.getElementById('calculate-route-btn').addEventListener('click', () => this.handleCalculateRoute());
        document.getElementById('search-start-btn').addEventListener('click', () => this.handleSearch('start'));
        document.getElementById('search-end-btn').addEventListener('click', () => this.handleSearch('end'));
        document.getElementById('clear-route-btn').addEventListener('click', () => this.handleClearRoute());
        
        // Event listeners dos inputs (Enter)
        document.getElementById('start').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch('start');
        });
        
        document.getElementById('end').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch('end');
        });
        
        // Event listener do perfil
         document.getElementById('profile').addEventListener('change', (e) => {
             this.stateManager.setActiveProfile(e.target.value);
         });
        
        // Handler global para seleção de localização
        window.selectSearchLocation = (lat, lng, displayName) => {
            this.handleLocationSelect(lat, lng, displayName);
        };
        
        // Handler de clique no mapa
        this.mapManager.addClickHandler((e) => {
            this.handleMapClick(e);
        });
    }

    /**
     * Configura listeners do state manager
     */
    setupStateListeners() {
        // Listener para mudanças de localização
        this.stateManager.addListener('startLocationChanged', (location) => {
            this.updateLocationMarker('start', location);
            this.clearCurrentRoute(); // Remove rota quando origem muda
        });
        
        this.stateManager.addListener('endLocationChanged', (location) => {
            this.updateLocationMarker('end', location);
            this.clearCurrentRoute(); // Remove rota quando destino muda
        });
        
        // Listener para mudança de perfil
        this.stateManager.addListener('profileChanged', (profile) => {
            this.updateRouteProfile(profile);
        });
        
        // Listener para rota calculada
        this.stateManager.addListener('routeChanged', (route) => {
            this.displayRouteInfo(route);
        });

        // Listener para limpeza geral
        this.stateManager.addListener('allCleared', () => {
            this.clearAllMarkers();
        });
    }
    /**
     * Inicializa componentes da UI
     */
    initializeUI() {
        // Adicionar legenda
        const legendContent = this.profileManager.generateLegendHTML();
        this.mapManager.addLegend(legendContent);

        // Popular dropdown de perfis
        this.populateProfileDropdown();

        // Adicionar controles de POI
        //this.addPOIControls();

        // Carregar POIs iniciais
        //this.loadInitialPOIs();
    }

    /**
     * Popula dropdown de perfis
     */
    populateProfileDropdown() {
        const profileSelect = document.getElementById('profile');
        const profiles = this.profileManager.getAllProfiles();

        profileSelect.innerHTML = '';

        Object.entries(profiles).forEach(([profileId, profile]) => {
            const option = document.createElement('option');
            option.value = profileId;
            option.textContent = `${profile.icon} ${profile.name}`;
            profileSelect.appendChild(option);
        });
    }

    /**
     * Manipula pesquisa de localização
     * @param {string} field - Campo ('start' ou 'end')
     */
    async handleSearch(field) {
        const input = document.getElementById(field);
        const query = input.value.trim();

        if (!query) {
            this.showNotification('Por favor, digite um endereço para pesquisar', 'warning');
            return;
        }

        try {
            this.showLoading(field);
            const results = await this.searchManager.searchLocation(query);
            this.displaySearchResults(results, field);

        } catch (error) {
            this.showNotification('Erro ao pesquisar localização: ' + error.message, 'error');
        } finally {
            this.hideLoading(field);
        }
    }

    /**
     * Exibe resultados da pesquisa
     * @param {Array} results - Resultados da pesquisa
     * @param {string} field - Campo associado
     */
    displaySearchResults(results, field) {
        const resultsContainer = document.getElementById('search-results');

        if (!results || results.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item">Nenhum resultado encontrado</div>';
            return;
        }

        resultsContainer.innerHTML = '';

        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <strong>${result.display_name}</strong>
                <br><small>Lat: ${result.lat}, Lon: ${result.lon}</small>
            `;

            item.onclick = () => {
                this.handleLocationSelect(result.lat, result.lon, result.display_name, field);
                resultsContainer.innerHTML = '';
                this.searchManager.clearSearchMarkers();
                this.closeCurrentPopup(); // Fechar popup ao selecionar
            };

            resultsContainer.appendChild(item);
        });

        // Adicionar marcadores no mapa
        this.searchManager.addSearchMarkers(results, (lat, lng, name) => {
            this.handleLocationSelect(lat, lng, name, field);
            this.closeCurrentPopup(); // Fechar popup ao selecionar
        });
    }

    /**
     * Manipula seleção de localização
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} displayName - Nome do local
     * @param {string} field - Campo ('start' ou 'end')
     */
    handleLocationSelect(lat, lng, displayName, field = null) {
        const location = { lat, lng, address: displayName };
        
        if (!field) {
            // Determinar campo baseado no estado atual
            field = !this.stateManager.getStartLocation() ? 'start' : 'end';
        }
        
        // Atualizar input
        document.getElementById(field).value = displayName;
        
        // Atualizar estado
        if (field === 'start') {
            this.stateManager.setStartLocation(location);
        } else {
            this.stateManager.setEndLocation(location);
        }

        // Fechar resultados e popups
        document.getElementById('search-results').innerHTML = '';
        this.searchManager.clearSearchMarkers();
        this.closeCurrentPopup();
        
        // Remover rota atual se existir
        this.clearCurrentRoute();
    }

    /**
     * Fecha o popup atual do mapa
     */
    closeCurrentPopup() {
        if (this.currentPopup) {
            this.currentPopup.closePopup();
            this.currentPopup = null;
        }
        // Fechar qualquer popup aberto no mapa
        this.mapManager.getMap().closePopup();
    }

    /**
     * Manipula clique no mapa
     * @param {L.LeafletMouseEvent} event - Evento de clique
     */
    async handleMapClick(event) {
        const { lat, lng } = event.latlng;
        
        try {
            const result = await this.searchManager.reverseGeocode(lat, lng);
            
            if (result) {
                this.showLocationPopup(lat, lng, result.display_name);
            }
        } catch (error) {
            console.error('Erro na geocodificação reversa:', error);
        }
    }

    /**
     * Exibe popup de localização no mapa
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} displayName - Nome do local
     */
    showLocationPopup(lat, lng, displayName) {
        this.closeCurrentPopup(); // Fechar popup anterior
        
        this.currentPopup = L.popup()
            .setLatLng([lat, lng])
            .setContent(`
                <div style="text-align: center;">
                    <strong>📍 Localização</strong><br>
                    <small>${displayName}</small><br><br>
                    <button onclick="window.uiController.handleLocationSelect(${lat}, ${lng}, '${displayName.replace(/'/g, "\\'")}', 'start')">
                        🟢 Usar como Origem
                    </button>
                    <button onclick="window.uiController.handleLocationSelect(${lat}, ${lng}, '${displayName.replace(/'/g, "\\'")}', 'end')">
                        🔴 Usar como Destino
                    </button>
                </div>
            `)
            .openOn(this.mapManager.getMap());
    }


    /**
     * Atualiza marcador de localização no mapa
     * @param {string} type - Tipo ('start' ou 'end')
     * @param {Object} location - Localização {lat, lng, address}
     */
    updateLocationMarker(type, location) {
        if (!location) return;
        
        // Criar ou atualizar marcador no mapa
        const marker = this.poiManager.addRouteMarker(type, location.lat, location.lng, location.address);
        
        // Fechar popup ao clicar no marcador se estiver aberto
        if (marker && this.currentPopup) {
            marker.on('click', () => {
                this.closeCurrentPopup();
            });
        }
        
        // Habilitar botão de calcular rota se ambas localizações estiverem definidas
        if (this.stateManager.isReadyForRoute()) {
            const calculateBtn = document.getElementById('calculate-route-btn');
            calculateBtn.style.background = '#27ae60';
            calculateBtn.disabled = false;
        }
    }

    /**
     * Remove a rota atual do mapa
     */
    clearCurrentRoute() {
        this.routeManager.clearRoute();
        
        //Esconder informações da rota
        const routeInfoElement = document.getElementById('route-info');
        routeInfoElement.classList.add('hidden');
        routeInfoElement.innerHTML = '';
        
        // Resetar estilo do botão de calcular rota
        const calculateBtn = document.getElementById('calculate-route-btn');
        if (calculateBtn) {
            calculateBtn.style.background = '';
        }
    }

    /**
     * Manipula cálculo de rota
     */
    async handleCalculateRoute() {
        if (!this.stateManager.isReadyForRoute()) {
            this.showNotification('Por favor, selecione origem e destino', 'warning');
            return;
        }
        
        const start = this.stateManager.getStartLocation();
        const end = this.stateManager.getEndLocation();
        const profile = this.stateManager.getActiveProfile();
        
        try {
            this.showRouteLoading();
            
            const routeData = await this.routeManager.calculateRoute(start, end, profile);
            this.routeManager.displayRoute(routeData, profile);
            
            this.stateManager.setCurrentRoute(routeData);
            
        } catch (error) {
            this.showNotification('Erro ao calcular rota: ' + error.message, 'error');
        } finally {
            this.hideRouteLoading();
        }
    }

    /**
     * Manipula limpeza de rota
     */
    handleClearRoute() {
        this.stateManager.clearAll();
        this.clearCurrentRoute();
        this.searchManager.clearSearchMarkers();
        this.clearAllMarkers();
        this.closeCurrentPopup();
        
        // Limpar inputs
        document.getElementById('start').value = '';
        document.getElementById('end').value = '';
        
        // Fechar resultados de pesquisa
        document.getElementById('search-results').innerHTML = '';
        
        this.showNotification('Rota limpa com sucesso', 'info');
    }

    /**
     * Limpa todos os marcadores do mapa
     */
    clearAllMarkers() {
        this.poiManager.clearRouteMarkers();
        this.searchManager.clearSearchMarkers();
    }

    /**
     * Atualiza perfil da rota
     * @param {string} profile - ID do perfil
     */
    updateRouteProfile(profile) {
        // Se há rota ativa, recalcular com novo perfil
        const currentRoute = this.stateManager.getCurrentRoute();
        if (currentRoute && this.stateManager.isReadyForRoute()) {
            this.handleCalculateRoute();
        }
    }

    /**
     * Exibe informações da rota
     * @param {Object} routeData - Dados da rota
     */
    displayRouteInfo(routeData) {
        const profile = this.stateManager.getActiveProfile();
        const routeInfo = this.routeManager.getRouteInfo(routeData, profile);

        const routeInfoElement = document.getElementById('route-info');
        routeInfoElement.innerHTML = `
            <h3>${routeInfo.profileIcon} Informações da Rota</h3>
            <div class="info-item">
                <strong>📏 Distância:</strong> ${routeInfo.distance} km
            </div>
            <div class="info-item">
                <strong>⏱️ Duração:</strong> ${routeInfo.duration}
            </div>
            <div class="info-item">
                <strong>🚀 Velocidade média:</strong> ${routeInfo.avgSpeed} km/h
            </div>
            <div class="info-item">
                <strong>🎯 Perfil:</strong> ${routeInfo.profileName}
            </div>
            ${routeInfo.originalDuration ? `
            <div class="info-item" style="font-size: 0.8em; color: #666;">
                <em>* Tempo ajustado para ${routeInfo.profileName}</em>
            </div>
            ` : ''}
        `;

        routeInfoElement.classList.remove('hidden');
    }


    /**
     * Obtém localização do utilizador
     */
    async getUserLocation() {
        if (!navigator.geolocation) {
            this.showNotification('Geolocalização não suportada', 'warning');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                this.stateManager.setUserLocation({ lat, lng });
                this.mapManager.setView(lat, lng, 13);

                // Adicionar marcador da localização atual
                this.poiManager.addCurrentLocationMarker(lat, lng, 'Sua localização atual');

                // Preencher origem automaticamente
                document.getElementById('start').value = 'Minha Localização';
                this.stateManager.setStartLocation({
                    lat,
                    lng,
                    address: 'Minha Localização'
                });

            },
            (error) => {
                console.log('Não foi possível obter localização:', error);
                this.showNotification('Não foi possível obter sua localização', 'warning');
            },
            {
                timeout: 5000,
                maximumAge: 600000
            }
        );
    }


    /**
     * Mostra estado de loading
     * @param {string} field - Campo em loading
     */
    showLoading(field) {
        const button = document.querySelector(`#${field}`).nextElementSibling;
        if (button) {
            button.innerHTML = '⏳';
            button.disabled = true;
        }
    }

    /**
     * Esconde estado de loading
     * @param {string} field - Campo em loading
     */
    hideLoading(field) {
        const button = document.querySelector(`#${field}`).nextElementSibling;
        if (button) {
            button.innerHTML = '🔍';
            button.disabled = false;
        }
    }

    /**
     * Mostra loading da rota
     */
    showRouteLoading() {
        const btn = document.getElementById('calculate-route-btn');
        btn.innerHTML = '⏳ Calculando...';
        btn.disabled = true;
    }

    /**
     * Esconde loading da rota
     */
    hideRouteLoading() {
        const btn = document.getElementById('calculate-route-btn');
        btn.innerHTML = 'Calcular Rota';
        btn.disabled = false;
    }

    /**
     * Exibe notificação
     * @param {string} message - Mensagem
     * @param {string} type - Tipo ('info', 'success', 'warning', 'error')
     */
    showNotification(message, type = 'info') {
        // Implementação simplificada - pode ser expandida com uma lib de notificações
        const typeIcons = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        console.log(`${message}`)
        
        // alert(`${typeIcons[type] || 'ℹ️'} ${message}`);
    }

    /**
     * Obtém instância do manager de mapa
     * @returns {MapManager} manager de mapa
     */
    getMapManager() {
        return this.mapManager;
    }

    /**
     * Obtém instância do manager de estado
     * @returns {StateManager} manager de estado
     */
    getStateManager() {
        return this.stateManager;
    }

    /**
     * Verifica se está inicializado
     * @returns {boolean} True se inicializado
     */
    isInitialized() {
        return this.isInitialized;
    }



}


// Exportar para uso global
window.uiController = new UIController();

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.uiController.initialize('map');
});

export default UIController;
