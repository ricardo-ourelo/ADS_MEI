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

        this.stops = [];
        this.stopMarkers = [];

        this.poiCategories = [
            'restaurant', 'cafe', 'hotel', 'bank', 'pharmacy',
            'hospital', 'fuel', 'parking', 'supermarket', 'park'
        ];
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

        document.addEventListener("click", (e) => {
            const box = document.getElementById("search-results");
            const isClickInside = box.contains(e.target);

            const isSearchInput =
                e.target.id === "start" ||
                e.target.id === "end";

            const isSearchButton =
                e.target.classList.contains("search-btn") || e.target.classList.contains("stop-search-btn");

            if (!isClickInside && !isSearchInput && !isSearchButton) {
                box.style.display = "none";
            }
        });

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

        // Handler global para seleção de localização via markers/popups de pesquisa
        // usa window.__lastSearchField para saber onde aplicar (se existir)
        window.selectSearchLocation = (lat, lng, displayName) => {
            const field = window.__lastSearchField || null;
            this.handleLocationSelect(lat, lng, displayName, field);
        };


        // Handler de clique no mapa
        this.mapManager.addClickHandler((e) => {
            this.handleMapClick(e);
        });
    }

    /**
     * Cria uma nova paragem intermédia a partir de um clique no mapa.
     * Escolhe automaticamente o próximo índice livre (0,1,2,...)
     */
    addStopFromMap(lat, lng, displayName) {
        if (!this.stops) {
            this.stops = [];
        }

        let index = this.stops.findIndex(s => s === null || s === undefined);

        if (index === -1) {
            index = this.stops.length;
        }

        const field = `stop-${index}`;
        this.handleLocationSelect(lat, lng, displayName, field);
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
    this.addPOIControls();

    // Carregar POIs iniciais
    //this.loadInitialPOIs();

    this.initStopsUI();
    this.initThemeSelector();

    }

    /**
     * Inicializa UI das paragens intermédias
     */
    initStopsUI() {
        const container = document.getElementById('stops-container');
        const addBtn = document.getElementById('add-stop-btn');

        if (!container || !addBtn) return;

        addBtn.addEventListener('click', () => {
            this.addStopRow(container);
        });
        // Depois de configurar botões, inicializa Sortable (irá encontrar as rows se existirem)
        this.initStopsSortable();
    }

    /**
     * Inicializa o seletor de tema do painel
     */
    initThemeSelector() {
        const select = document.getElementById('theme-select');
        if (!select) return;

        // Tema guardado ou padrão
        const savedTheme = localStorage.getItem('panelTheme') || 'ocean';

        // Remove classes antigas e aplica a guardada
        this.applyTheme(savedTheme);

        // Atualiza o select
        select.value = savedTheme;

        // Listener de mudança
        select.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            this.applyTheme(newTheme);
            localStorage.setItem('panelTheme', newTheme);
        });
    }

    /**
     * Aplica uma classe de tema ao <body>
     * @param {string} themeId - ex: 'ocean', 'dark'
     */
    applyTheme(themeId) {
        const body = document.body;

        // Remover temas antigos — iterar sobre uma cópia para evitar pular classes ao modificar
        Array.from(body.classList).forEach(cls => {
            if (cls.startsWith('theme-')) {
                body.classList.remove(cls);
            }
        });


        // Adicionar novo tema
        body.classList.add(`theme-${themeId}`);

        // Redesenhar rota com a nova cor do tema, se existir uma rota ativa
        const route = this.stateManager.getCurrentRoute();
        if (route && this.stateManager.isReadyForRoute()) {
            const profile = this.stateManager.getActiveProfile();
            const newColor = getComputedStyle(document.body).getPropertyValue('--route-color').trim();
            this.routeManager.displayRoute(route, profile, newColor);
        }

        // Atualizar cor dos marcadores também
        this.updateAllMarkersTheme();
    }

    /**
     * Atualiza os marcadores já existentes para refletir o novo tema
     */
    updateAllMarkersTheme() {
        // Reaplicar origem e destino se existirem
        const start = this.stateManager.getStartLocation();
        if (start) this.updateLocationMarker('start', start);

        const end = this.stateManager.getEndLocation();
        if (end) this.updateLocationMarker('end', end);

        // Reaplicar paragens se existirem
        this.stops.forEach((stop, index) => {
            if (stop) this.updateStopMarker(index, stop);
        });
    }


    /**
     * Inicializa Sortable apenas para as paragens (stops)
     * Não mexe em start/end — garante compatibilidade com a lógica existente.
     */
    initStopsSortable() {
        const container = document.getElementById('stops-container');
        if (!container || typeof Sortable === 'undefined') return;

        // se já existir, destrói e recria (evita duplicados ao reinicializar)
        if (this._stopsSortable) {
            try { this._stopsSortable.destroy(); } catch{return; }
        }

        // usa um handle específico para não interferir com clique nos inputs
        this._stopsSortable = Sortable.create(container, {
            handle: '.stop-handle',
            animation: 150,
            onEnd: () => {
                // reindexar stops e recalcular rota se aplicável
                this.reindexStops();
                if (this.stateManager.isReadyForRoute()) {
                    this.handleCalculateRoute();
                }
            }
        });
    }

    /**
     * Reindexa os inputs de paragens para stop-0, stop-1... e actualiza this.stops e marcadores.
     * Deve ser chamada após reorder, remoção ou adição.
     */
    reindexStops() {
        const rows = Array.from(document.querySelectorAll('#stops-container .stop-row'));
        const newStops = [];

        // Guardar stops válidos
        rows.forEach((row, newIndex) => {
            const input = row.querySelector('input');
            row.dataset.stopIndex = newIndex;
            input.dataset.stopIndex = newIndex;
            input.id = `stop-${newIndex}`;

            const lat = input.dataset.lat ? Number(input.dataset.lat) : null;
            const lng = input.dataset.lng ? Number(input.dataset.lng) : null;
            const address = input.value || input.dataset.address || null;
            newStops[newIndex] = (lat && lng) ? { lat, lng, address } : null;
        });

        // Atualizar array
        this.stops = newStops;

        // Apagar todos marcas e redesenhar
        this.poiManager.clearStopMarkers();

        this.stops.forEach(stop => {
            if (stop) {
                this.poiManager.addRouteMarker('stop', stop.lat, stop.lng, stop.address);
            }
        });
    }


    /**
     * Cria uma linha de paragem (input + botões)
     * @param {HTMLElement} container - div #stops-container
     * @param {number|null} forcedIndex - índice específico para a paragem (opcional)
     */
    addStopRow(container, forcedIndex = null) {

        let index;
        if (forcedIndex !== null && forcedIndex !== undefined) {
            index = forcedIndex;
            if (this.stops[index] === undefined) {
                this.stops[index] = null;
            }
        } else {
            index = this.stops.length;
            if (this.stops[index] === undefined) {
                this.stops[index] = null;
            }
        }

        const row = document.createElement('div');
        row.className = 'stop-row';
        row.dataset.stopIndex = index;
        row.setAttribute('data-stop-index', String(index));

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Paragem intermédia...';
        input.dataset.stopIndex = index;
        input.setAttribute('data-stop-index', String(index));
        input.id = `stop-${index}`;


        const searchBtn = document.createElement('button');
        searchBtn.type = 'button';
        searchBtn.textContent = '🔍';
        searchBtn.className = 'stop-search-btn';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = '✖';

        removeBtn.className = 'stop-remove-btn';

        searchBtn.addEventListener('click', () => {
            this.handleSearch(`stop-${index}`);
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(`stop-${index}`);
            }
        });

        removeBtn.addEventListener('click', () => {
            // Remover marcador associado antes de reindexar
            const i = index;
            if (this.stopMarkers && this.stopMarkers[i]) {
                this.mapManager.removeMarker(this.stopMarkers[i]);
                this.stopMarkers[i] = null;
            }
            // Remover linha da UI
            container.removeChild(row);
            this.reindexStops();

            // limpar marcador relacionado, se existia
            if (this.stopMarkers && this.stopMarkers.length) {
                // reindexStops já removeu marcadores obsoletos
            }

            // recalcular rota se necessário
            if (this.stateManager.isReadyForRoute() && this.routeManager.hasActiveRoute()) {
                this.handleCalculateRoute();
            }
        });

        // handle visual para arrastar (necessário para Sortable.handle)
        const handle = document.createElement('span');
        handle.className = 'stop-handle';
        handle.textContent = '≡';
        handle.title = 'Arrastar para reordenar';

        // inserir handle primeiro no row
        row.appendChild(handle);
        row.appendChild(input);
        row.appendChild(searchBtn);
        row.appendChild(removeBtn);
        container.appendChild(row);

        // Após criar a row, (re)inicializar Sortable para registar o novo elemento
        this.initStopsSortable();

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
     * Manipula pesquisa de localização a partir do painel (lupa / Enter nos inputs).
     * @param {string} field - Campo ('start', 'end' ou 'stop-<index>')
     */
    async handleSearch(field) {
        const input = document.getElementById(field);
        if (!input) {
            console.warn(`Input com id "${field}" não encontrado.`);
            return;
        }

        const query = input.value.trim();

        if (!query) {
            this.showNotification('Por favor, digite um endereço para pesquisar', 'warning');
            return;
        }
        try {
            this.showLoading(field);

            // guardar o campo actual para que os botões dos markers saibam para onde preencher
            window.__lastSearchField = field;

            const results = await this.searchManager.searchLocation(query);

            if (!results || results.length === 0) {
                
                this.showNotification('Nenhum resultado encontrado para essa pesquisa', 'warning');
                document.getElementById('search-results').innerHTML = '';
                return;
            }

            this.displaySearchResults(results, field);
        console.log(results);

        } catch (error) {
            console.error(error);
            this.showNotification('Erro ao pesquisar localização: ' + error.message, 'error');
        } finally {
            this.hideLoading(field);
            this.searchManager.clearSearchMarkers();
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
        resultsContainer.style.display = "block";
        return;
    }

    resultsContainer.innerHTML = '';

    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'search-result-item';

        item.innerHTML = `
            <div class="sr-title">${result.display_name}</div>
            <div class="sr-coords">📍 ${result.lat}, ${result.lon}</div>
        `;

        item.onclick = () => {
            const input = document.getElementById(field);

            if (input) {
                input.value = result.display_name;
                input.dataset.lat = result.lat;
                input.dataset.lng = result.lon;
                input.dataset.address = result.display_name;
            }

            this.handleLocationSelect(result.lat, result.lon, result.display_name, field);

            resultsContainer.style.display = "none";  // esconder
            this.searchManager.clearSearchMarkers();
            this.closeCurrentPopup();
        };

        resultsContainer.appendChild(item);
    });
    // Mostra a caixa
    resultsContainer.style.display = "block";  // agora mostra sempre
    // Adiciona marcadores
        this.searchManager.addSearchMarkers(results);

    }


    /**
     * Manipula a seleção de localização vinda de pesquisa, popup ou mapa.
     * Decide automaticamente entre atualizar origem, destino ou paragem intermédia.
     *
     * @param {number} lat - Latitude selecionada
     * @param {number} lng - Longitude selecionada
     * @param {string} displayName - Nome/descrição da localização
     * @param {string|null} field - Campo alvo ("start", "end" ou "stop-X")
     */
    handleLocationSelect(lat, lng, displayName, field = null) {
        const location = { lat, lng, address: displayName };

        // Determinar campo (start/end) automaticamente se não for fornecido
        if (!field) {
            field = this._resolveField();
        }

        if (field.startsWith("stop-")) {
            this._handleStopSelection(field, location);
        } else {
            this._handleStartEndSelection(field, location);
        }

        this._finalizeLocationSelection();
    }

    /**
     * Determina automaticamente se deve preencher a origem ("start") ou destino ("end").
     * Se ainda não houver origem definida, escolhe "start". Caso contrário, "end".
     *
     * @returns {string} O campo a utilizar ("start" ou "end")
     */
    _resolveField() {
        return this.stateManager.getStartLocation() ? "end" : "start";
    }

    /**
     * Processa seleção de localização para uma paragem intermédia.
     *
     * @param {string} field - Identificador do tipo "stop-0", "stop-1", ...
     * @param {Object} location - Objeto contendo {lat, lng, address}
     */
    _handleStopSelection(field, location) {
        const index = parseInt(field.split("-")[1], 10);

        // Atualizar array interno de paragens
        this.stops[index] = location;

        // Garantir que existe input associado à paragem
        let input = document.querySelector(`input[data-stop-index="${index}"]`);

        if (!input) {
            const container = document.getElementById("stops-container");
            if (container) {
                this.addStopRow(container, index);
                input = document.querySelector(`input[data-stop-index="${index}"]`)
                    || document.getElementById(`stop-${index}`);
            }
        }

        // Preencher input
        if (input) {
            input.value = location.address;
            input.dataset.lat = location.lat;
            input.dataset.lng = location.lng;
            input.dataset.address = location.address;
        }

        // Atualizar marcador no mapa
        this.poiManager.removeStopMarker(index);
        this.poiManager.addRouteMarker("stop", location.lat, location.lng, location.address);

        // Recalcular rota se origem e destino existirem
        if (this.stateManager.isReadyForRoute()) {
            this.handleCalculateRoute();
        }
    }

    /**
     * Processa seleção de localização para origem ("start") ou destino ("end").
     *
     * @param {string} field - "start" ou "end"
     * @param {Object} location - Objeto contendo {lat, lng, address}
     */
    _handleStartEndSelection(field, location) {
        const input = document.getElementById(field);

        if (input) {
            input.value = location.address;
        }

        if (field === "start") {
            this.stateManager.setStartLocation(location);
        } else {
            this.stateManager.setEndLocation(location);
        }
    }

    /**
     * Realiza ações finais após seleção de localização:
     * - limpa resultados de pesquisa
     * - remove marcadores temporários
     * - fecha popups
     * - limpa rota atual para ser recalculada
     */
    _finalizeLocationSelection() {
        const resultsContainer = document.getElementById("search-results");

        if (resultsContainer) {
            resultsContainer.innerHTML = "";
        }

        this.searchManager.clearSearchMarkers();
        this.closeCurrentPopup();
        this.clearCurrentRoute(); // rota será recalculada automaticamente
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
        this.closeCurrentPopup(); 
        
        const safeName = displayName.replace(/'/g, "\\'");
        
        this.currentPopup = L.popup()
            .setLatLng([lat, lng])
            .setContent(`
                <div style="text-align: center;">
                    <strong>📍 Localização</strong><br>
                    <small>${displayName}</small><br><br>
                    <button onclick="window.uiController.handleLocationSelect(${lat}, ${lng}, '${safeName}', 'start')">
                        🟢 Usar como Origem
                    </button>
                    <button onclick="window.uiController.handleLocationSelect(${lat}, ${lng}, '${safeName}', 'end')">
                        🔴 Usar como Destino
                    </button>
                    <button onclick="window.uiController.addStopFromMap(${lat}, ${lng}, '${safeName}')">
                        🔵 Usar como Paragem
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

        // Esconder informações da rota (mas só se existir no DOM)
        const routeInfoElement = document.getElementById('route-info');
        if (routeInfoElement) {
            routeInfoElement.classList.add('hidden');
            routeInfoElement.innerHTML = '';
        }

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
        const stops = this.stops.filter(Boolean); 

        try {
            this.showRouteLoading();
            
            const routeData = await this.routeManager.calculateRoute(start, end, profile, stops);
            const routeColor = getComputedStyle(document.body).getPropertyValue('--route-color').trim();
            this.routeManager.displayRoute(routeData, profile, routeColor);


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
        this.poiManager.clearStopMarkers();
        
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

        if (this.stopMarkers && this.stopMarkers.length) {
            this.stopMarkers.forEach(marker => {
                if (marker) {
                    this.mapManager.removeMarker(marker);
                }
            });
        }
        this.stopMarkers = [];

        this.stops = [];

        const stopsContainer = document.getElementById('stops-container');
        if (stopsContainer) {
            stopsContainer.innerHTML = '';
        }
    }

    /**
     * Atualiza perfil da rota
     */
    updateRouteProfile() {
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
            <div class="-item route-adjust-note" >
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
            button.classList.add("loading");
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
            button.classList.remove("loading");
        }
    }

    /**
     * Mostra loading da rota
     */
    showRouteLoading() {
        const btn = document.getElementById('calculate-route-btn');
        btn.innerHTML = '⏳ Calculando...';
        btn.disabled = true;
        btn.classList.add("loading");
    }

    /**
     * Esconde loading da rota
     */
    hideRouteLoading() {
        const btn = document.getElementById('calculate-route-btn');
        btn.innerHTML = 'Calcular Rota';
        btn.disabled = false;
        btn.classList.remove("loading");
    }


    /**
     * Exibe notificação visual no painel
     * @param {string} message - Mensagem da notificação
     * @param {string} type - Tipo ('info', 'success', 'warning', 'error')
     */
    showNotification(message, type = 'info') {
        const icons = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };

        // Se já existir uma notificação na tela, remove
        const prev = document.querySelector('.ui-notification');
        if (prev) prev.remove();

        // Criar container
        const notif = document.createElement('div');
        notif.className = `ui-notification ui-notification-${type}`;
        notif.innerHTML = `
        <span class="ui-notification-icon">${icons[type]}</span>
        <span class="ui-notification-message">${message}</span>
    `;

        // Adicionar ao painel lateral (aside)
        const panel = document.querySelector('#page-map aside');
        panel.insertBefore(notif, panel.firstChild);

        // Remover automaticamente após 3.2s
        setTimeout(() => {
            notif.classList.add('fade-out');
            setTimeout(() => notif.remove(), 300);
        }, 3200);
    }

    // over passs

    /**
     * Adiciona controles de POI à interface
     */
    addPOIControls() {
        // Event listeners para POIs
        // document.getElementById('load-pois-btn').addEventListener('click', () => this.handleLoadPOIs());
        document.querySelectorAll(".poi-icon").forEach(btn => {
            btn.addEventListener("click", () => {
                const type = btn.dataset.type;
                // loadPois(type);
                this.handleLoadPOIs(type);
            });
        });
        document.getElementById('clear-pois-btn').addEventListener('click', () => this.handleClearPOIs());
    }

    /**
     * Manipula carregamento de POIs
     */
    async handleLoadPOIs(selectedCategory) {
        this.handleClearPOIs();
        // const categorySelect = document.getElementById('poi-category');
        // const selectedCategory = categorySelect.value;
        const loadButton = document.getElementById('clear-pois-btn');
        
        const categories = selectedCategory === 'all' 
            ? this.poiCategories 
            : [selectedCategory];

        try {
            // Mostrar loading
            loadButton.innerHTML = '⏳';
            loadButton.disabled = true;
            
            this.showNotification('Carregando pontos de interesse...', 'info');
            
            const stats = await this.poiManager.loadPOIsForVisibleArea(categories);
           
            this.showNotification(stats.message, 'success');
            
        } catch (error) {
            console.error('Erro ao carregar POIs:', error);
            this.showNotification('Erro ao carregar POIs: ' + error.message, 'error');
        } finally {
            // Restaurar botão
            loadButton.innerHTML = '🗑️';
            loadButton.disabled = false;
        }
    }

    /**
     * Manipula limpeza de POIs
     */
    handleClearPOIs() {
        const removed = this.poiManager.clearAllPOIs();
        this.showNotification(`Removidos ${removed} pontos de interesse`, 'info');
    }


    /**
     * Usa POI como localização (origem/destino)
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} name - Nome do POI
     */
    usePOIAsLocation(lat, lng, name) {
        // Determinar se deve usar como origem ou destino
        const field = !this.stateManager.getStartLocation() ? 'start' : 'end';
        this.handleLocationSelect(lat, lng, name, field);
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

// Adicionar função global para uso do POI
window.uiController.usePOIAsLocation = function(lat, lng, name) {
    window.uiController.usePOIAsLocation(lat, lng, name);
};

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.uiController.initialize('map');
});

export default UIController;
