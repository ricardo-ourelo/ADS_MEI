/**
 * @file stateManager.js
 * @description Classe responsável por armazenar e gerir o estado global da aplicação,
 * incluindo localização inicial/final, rota ativa, perfil e eventos de mudança.
 * @module core/stateManager
 */

/**
 * Gerencia o estado da aplicação.
 * @class
 */
export class StateManager {
    constructor() {
        this.state = {
            startLocation: null,
            endLocation: null,
            currentRoute: null,
            activeProfile: 'car',
            mapCenter: [-14.2350, -51.9253],
            mapZoom: 4,
            userLocation: null
        };

        this.listeners = new Map();
    }

    /**
     * Define localização de início
     * @param {Object} location - Localização {lat, lng, address}
     */
    setStartLocation(location) {
        this.state.startLocation = location;
        this.notify('startLocationChanged', location);
    }

    /**
     * Define localização de fim
     * @param {Object} location - Localização {lat, lng, address}
     */
    setEndLocation(location) {
        this.state.endLocation = location;
        this.notify('endLocationChanged', location);
    }

    /**
     * Define rota atual
     * @param {Object} route - Dados da rota
     */
    setCurrentRoute(route) {
        this.state.currentRoute = route;
        this.notify('routeChanged', route);
    }

    /**
     * Define perfil ativo
     * @param {string} profile - ID do perfil
     */
    setActiveProfile(profile) {
        this.state.activeProfile = profile;
        this.notify('profileChanged', profile);
    }

    /**
     * Define localização do usuário
     * @param {Object} location - Localização {lat, lng}
     */
    setUserLocation(location) {
        this.state.userLocation = location;
        this.notify('userLocationChanged', location);
    }

    /**
     * Obtém localização de início
     * @returns {Object|null} Localização de início
     */
    getStartLocation() {
        return this.state.startLocation;
    }

    /**
     * Obtém localização de fim
     * @returns {Object|null} Localização de fim
     */
    getEndLocation() {
        return this.state.endLocation;
    }

    /**
     * Obtém rota atual
     * @returns {Object|null} Dados da rota
     */
    getCurrentRoute() {
        return this.state.currentRoute;
    }

    /**
     * Obtém perfil ativo
     * @returns {string} ID do perfil
     */
    getActiveProfile() {
        return this.state.activeProfile;
    }

    /**
     * Obtém localização do usuário
     * @returns {Object|null} Localização do usuário
     */
    getUserLocation() {
        return this.state.userLocation;
    }

    /**
     * Verifica se ambas localizações estão definidas
     * @returns {boolean} True se pronto para calcular rota
     */
    isReadyForRoute() {
        return this.state.startLocation !== null && this.state.endLocation !== null;
    }

    /**
     * Troca origem e destino
     */
    swapLocations() {
        const temp = this.state.startLocation;
        this.state.startLocation = this.state.endLocation;
        this.state.endLocation = temp;
        
        this.notify('locationsSwapped', {
            start: this.state.startLocation,
            end: this.state.endLocation
        });
    }

    /**
     * Limpa todas as localizações e rota
     */
    clearAll() {
        this.state.startLocation = null;
        this.state.endLocation = null;
        this.state.currentRoute = null;
        this.notify('allCleared');
    }

    /**
     * Registra listener para mudanças de estado
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função callback
     */
    addListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    /**
     * Remove listener
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função callback
     */
    removeListener(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * Notifica listeners sobre mudanças
     * @param {string} event - Nome do evento
     * @param {any} data - Dados do evento
     */
    notify(event, data = null) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro no listener do evento ${event}:`, error);
                }
            });
        }
    }

    /**
     * Obtém estado completo
     * @returns {Object} Estado atual
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Exporta estado para JSON
     * @returns {string} Estado em formato JSON
     */
    exportState() {
        return JSON.stringify(this.state);
    }

    /**
     * Importa estado de JSON
     * @param {string} jsonString - Estado em formato JSON
     */
    importState(jsonString) {
        try {
            const newState = JSON.parse(jsonString);
            this.state = { ...this.state, ...newState };
            this.notify('stateImported', this.state);
        } catch (error) {
            console.error('Erro ao importar estado:', error);
            throw error;
        }
    }
}