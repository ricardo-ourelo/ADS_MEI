/**
 * Gerencia cálculo e exibição de rotas
 */
export class RouteManager {
    constructor(map, profileManager) {
        this.map = map;
        this.profileManager = profileManager;
        this.routeLayer = null;
        this.currentRouteData = null;
    }

    /**
     * Calcula rota entre dois pontos
     * @param {Object} start - Coordenadas de início {lat, lng}
     * @param {Object} end - Coordenadas de fim {lat, lng}
     * @param {string} profile - Perfil da rota
     * @returns {Promise<Object>} Dados da rota calculada
     */
    async calculateRoute(start, end, profile) {
        const startStr = `${start.lng},${start.lat}`;
        const endStr = `${end.lng},${end.lat}`;

        try {
            console.log(`Calculando rota: perfil=${profile}, start=${startStr}, end=${endStr}`);
            
            const response = await fetch(`/api/route?start=${startStr}&end=${endStr}&profile=${profile}`);
            const routeData = await response.json();

            if (routeData.code !== 'Ok') {
                throw new Error(routeData.message || 'Erro ao calcular rota');
            }

            this.currentRouteData = routeData;
            return routeData;

        } catch (error) {
            console.error('Erro no cálculo da rota:', error);
            throw error;
        }
    }

    /**
     * Exibe rota no mapa
     * @param {Object} routeData - Dados da rota retornado da api
     * @param {string} profile - Perfil da rota
     */
    displayRoute(routeData, profile) {
        // Remove rota anterior
        this.clearRoute();

        const route = routeData.routes[0];
        const routeCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        const color = this.profileManager.getProfileColor(profile);

        this.routeLayer = L.polyline(routeCoordinates, {
            color: color,
            weight: 6,
            opacity: 0.8,
            lineJoin: 'round',
            className: `route-${profile}`
        }).addTo(this.map);

        // Adicionar popup informativo
        this.routeLayer.bindPopup(`
            <div style="text-align: center;">
                <strong>🗺️ Rota ${this.profileManager.getProfileName(profile)}</strong><br>
                <small>Clique no mapa para fechar</small>
            </div>
        `);

        // Ajustar visualização para mostrar toda a rota
        this.map.fitBounds(this.routeLayer.getBounds(), { padding: [20, 20] });
    }

    /**
     * Remove rota atual do mapa
     */
    clearRoute() {
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
            this.routeLayer = null;
        }
        this.currentRouteData = null;
    }

    /**
     * Obtém informações da rota atual
     * @param {Object} routeData - Dados da rota
     * @param {string} profile - Perfil da rota
     * @returns {Object} Informações formatadas da rota
     */
    getRouteInfo(routeData, profile) {
        const route = routeData.routes[0];
        const distance = (route.distance / 1000).toFixed(2);
        const durationMinutes = Math.round(route.duration / 60);
        const durationHours = Math.floor(durationMinutes / 60);
        const remainingMinutes = durationMinutes % 60;
        
        // Formatar tempo
        let durationText = '';
        if (durationHours > 0) {
            durationText = `${durationHours}h ${remainingMinutes}min`;
        } else {
            durationText = `${durationMinutes} min`;
        }

        // Calcular velocidade média
        const distanceKm = route.distance / 1000;
        const durationHoursDecimal = route.duration / 3600;
        const avgSpeed = durationHoursDecimal > 0 ? (distanceKm / durationHoursDecimal).toFixed(1) : '0';

        return {
            distance: distance,
            duration: durationText,
            avgSpeed: avgSpeed,
            profileName: this.profileManager.getProfileName(profile),
            profileIcon: this.profileManager.getProfileIcon(profile),
            originalDuration: route.originalDuration
        };
    }

    /**
     * Obtém dados da rota atual
     * @returns {Object|null} Dados da rota atual
     */
    getCurrentRoute() {
        return this.currentRouteData;
    }

    /**
     * Verifica se há rota ativa
     * @returns {boolean} True se há rota ativa
     */
    hasActiveRoute() {
        return this.routeLayer !== null;
    }

    /**
     * Calcula bounding box que contém toda a rota
     * @returns {L.LatLngBounds|null} Bounds da rota
     */
    getRouteBounds() {
        if (this.routeLayer) {
            return this.routeLayer.getBounds();
        }
        return null;
    }
}