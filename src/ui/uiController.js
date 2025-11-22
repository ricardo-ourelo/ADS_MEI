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
    // this.addPOIControls();

    // Carregar POIs iniciais
    // this.loadInitialPOIs();

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

        // Remover temas antigos
        body.classList.forEach(cls => {
            if (cls.startsWith('theme-')) {
                body.classList.remove(cls);
            }
        });

        // Adicionar novo tema
        body.classList.add(`theme-${themeId}`);

        // 🔥 Redesenhar rota com a nova cor do tema, se existir uma rota ativa
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
            try { this._stopsSortable.destroy(); } catch(e){/*ignore*/ }
        }

        // usa um handle específico para não interferir com clique nos inputs
        this._stopsSortable = Sortable.create(container, {
            handle: '.stop-handle',
            animation: 150,
            onEnd: (evt) => {
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
        const container = document.getElementById('stops-container');
        if (!container) return;

        const rows = Array.from(container.querySelectorAll('.stop-row'));
        const newStops = [];
        const newStopMarkers = [];

        rows.forEach((row, newIndex) => {
            row.dataset.stopIndex = newIndex;
            const input = row.querySelector('input');
            if (!input) return;

            input.dataset.stopIndex = newIndex;
            input.id = `stop-${newIndex}`;

            // Reatribuir listeners corretos após reorder
            const searchBtn = row.querySelector('.stop-search-btn');
            const fieldId = `stop-${newIndex}`;

            searchBtn.onclick = () => this.handleSearch(fieldId);

            input.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(fieldId);
                }
            };


            // manter lat/lng se existirem nos data-attrs
            const lat = input.dataset.lat ? Number(input.dataset.lat) : null;
            const lng = input.dataset.lng ? Number(input.dataset.lng) : null;
            const address = input.value && input.value.trim() !== '' ? input.value.trim() : (input.dataset.address || null);

            if (lat != null && lng != null) {
                newStops[newIndex] = { lat, lng, address };
                // recriar marcador na nova ordem usando updateStopMarker
                this.updateStopMarker(newIndex, { lat, lng, address });
                newStopMarkers[newIndex] = this.stopMarkers[newIndex] || null;
            } else {
                newStops[newIndex] = null;
                // limpar marcador antigo se existente
                if (this.stopMarkers && this.stopMarkers[newIndex]) {
                    this.mapManager.removeMarker(this.stopMarkers[newIndex]);
                }
                newStopMarkers[newIndex] = null;
            }
        });

        // substituir arrays
        this.stops = newStops;
        this.stopMarkers = newStopMarkers;
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

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Paragem intermédia...';
        input.dataset.stopIndex = index;
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
                document.getElementById('search-results').innerHTML =
                    '<div class="search-result-item">Nenhum resultado encontrado</div>';
                return;
            }

            this.displaySearchResults(results, field);

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
                const input = document.getElementById(field);
                if (input) {
                    input.value = result.display_name;
                    input.dataset.lat = result.lat;
                    input.dataset.lng = result.lon;
                    input.dataset.address = result.display_name;
                }

                this.handleLocationSelect(result.lat, result.lon, result.display_name, field);

                resultsContainer.innerHTML = '';
                this.searchManager.clearSearchMarkers();
                this.closeCurrentPopup();
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
        // se não for especificado, decide se é start ou end
        field = !this.stateManager.getStartLocation() ? 'start' : 'end';
    }
    
    if (field.startsWith('stop-')) {
        const index = parseInt(field.split('-')[1], 10);
        this.stops[index] = location;

        let input = document.querySelector(`input[data-stop-index="${index}"]`);

        // Se ainda não existir linha para esta paragem, cria uma linha com este índice
        if (!input) {
            const container = document.getElementById('stops-container');
            if (container) {
                this.addStopRow(container, index);
                input = document.querySelector(`input[data-stop-index="${index}"]`);
            }
        }

        // Se agora já tivermos input, preenche com o endereço
        if (input) {
            input.value = displayName;
            input.dataset.lat = lat;
            input.dataset.lng = lng;
            input.dataset.address = displayName;
        }


        // Criar/atualizar marcador da paragem
        this.updateStopMarker(index, location);

    } else {
        // Start / End normais (como já tinhas)
        document.getElementById(field).value = displayName;
        
        if (field === 'start') {
            this.stateManager.setStartLocation(location);
        } else {
            this.stateManager.setEndLocation(location);
        }
    }



    // Fechar resultados e popups
    document.getElementById('search-results').innerHTML = '';
    this.searchManager.clearSearchMarkers();
    this.closeCurrentPopup();
    
    // Limpar rota atual (vai ser recalculada)
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
     * Cria ou atualiza o marcador de uma paragem intermédia
     * @param {number} index - índice da paragem em this.stops
     * @param {Object} location - {lat, lng, address}
     */
    updateStopMarker(index, location) {
        if (!location) return;
        if (!this.stopMarkers) this.stopMarkers = [];

        // remover marcador anterior, se existir
        const oldMarker = this.stopMarkers[index];
        if (oldMarker) {
            this.mapManager.removeMarker(oldMarker);
        }

        // usar POIManager com tipo 'stop'
        const marker = this.poiManager.addRouteMarker(
            'stop',
            location.lat,
            location.lng,
            location.address
        );

        this.stopMarkers[index] = marker;
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
