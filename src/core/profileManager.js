/**
 * @file profileManager.js
 * @description Define e gere os perfis de rota disponíveis (carro, mota, bicicleta, a pé),
 * incluindo ícones, cores e velocidades médias.
 * @module core/profileManager
 */

/**
 * Gerencia perfis de rota, cores e ícones.
 * @class
 */
export class ProfileManager {
    constructor() {
        this.profiles = {
            'car': {
                name: 'de Carro',
                icon: '🚗',
                color: '#e74c3c',
                speed: 50, // km/h
                type: 'vehicle'
            },
            'mota': {
                name: 'de Mota',
                icon: '🏍️',
                color: '#9b59b6',
                speed: 60, // km/h
                type: 'vehicle'
            },
            'bicicleta': {
                name: 'de Bicicleta',
                icon: '🚴',
                color: '#27ae60',
                speed: 15, // km/h
                type: 'bicycle'
            },
            'walking': {
                name: 'a Pé',
                icon: '🚶',
                color: '#3498db',
                speed: 5, // km/h
                type: 'pedestrian'
            }
        };
    }

    /**
     * Obtém configuração completa de um perfil
     * @param {string} profileId - ID do perfil
     * @returns {Object} Configuração do perfil
     */
    getProfile(profileId) {
        return this.profiles[profileId] || this.profiles['car'];
    }

    /**
     * Obtém nome amigável do perfil
     * @param {string} profileId - ID do perfil
     * @returns {string} Nome do perfil
     */
    getProfileName(profileId) {
        const profile = this.getProfile(profileId);
        return profile.name;
    }

    /**
     * Obtém ícone do perfil
     * @param {string} profileId - ID do perfil
     * @returns {string} Ícone do perfil
     */
    getProfileIcon(profileId) {
        const profile = this.getProfile(profileId);
        return profile.icon;
    }

    /**
     * Obtém cor do perfil
     * @param {string} profileId - ID do perfil
     * @returns {string} Cor hexadecimal
     */
    getProfileColor(profileId) {
        const profile = this.getProfile(profileId);
        return profile.color;
    }

    /**
     * Obtém velocidade média do perfil
     * @param {string} profileId - ID do perfil
     * @returns {number} Velocidade em km/h
     */
    getProfileSpeed(profileId) {
        const profile = this.getProfile(profileId);
        return profile.speed;
    }

    /**
     * Obtém todos os perfis disponíveis
     * @returns {Object} Todos os perfis
     */
    getAllProfiles() {
        return this.profiles;
    }

    
    /**
     * Valida se um perfil existe
     * @param {string} profileId - ID do perfil a validar
     * @returns {boolean} True se o perfil é válido
     */
    isValidProfile(profileId) {
        return this.profiles.hasOwnProperty(profileId);
    }
}