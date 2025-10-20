/**
 * @file helpers.js
 * @description Funções utilitárias para formatação de dados.
 */

export class Utils {
    static formatDistance(meters) {
        return `${(meters / 1000).toFixed(2)} km`;
    }

    static formatDuration(seconds) {
        const minutes = Math.round(seconds / 60);
        return `${minutes} min`;
    }
}
