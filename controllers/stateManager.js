/**
 * @file stateManager.js
 * @description Guarda o estado atual da aplicação (origem, destino, modo, rota).
 */

export class StateManager {
    constructor() {
        this.origin = null;
        this.destination = null;
        this.currentRoute = null;
    }

    /**
     * Define o ponto de origem.
     * @param {Array<number>} coords - [lat, lng].
     */
    setOrigin(coords) {
        this.origin = coords;
    }

    /**
     * Define o ponto de destino.
     * @param {Array<number>} coords - [lat, lng].
     */
    setDestination(coords) {
        this.destination = coords;
    }

    /**
     * Guarda a rota atual.
     * @param {object} route - Dados da rota.
     */
    setCurrentRoute(route) {
        this.currentRoute = route;
    }
}
