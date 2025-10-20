/**
 * @file dataParser.js
 * @description Converte respostas JSON das APIs em objetos internos.
 */

export class DataParser {
    static parseOSRMResponse(json) {
        console.log("Parsing OSRM response");
        if (!json.routes || !json.routes.length) return null;
        const route = json.routes[0];
        return {
            distance: route.distance,
            duration: route.duration,
            geometry: route.geometry
        };
    }

    static parseNominatimResponse(json) {
        console.log("Parsing Nominatim response");
        if (!json.length) return null;
        return {
            name: json[0].display_name,
            lat: parseFloat(json[0].lat),
            lon: parseFloat(json[0].lon)
        };
    }

    static parseOverpassResponse(json) {
        console.log("Parsing Overpass response");
        return json.elements.map(el => ({
            id: el.id,
            name: el.tags?.name || "Sem nome",
            type: el.tags?.amenity || "desconhecido",
            lat: el.lat,
            lon: el.lon
        }));
    }

    static routeToBBox(route) {
        // Exemplo simples; pode ser melhorado depois
        return "38.70,-9.15,38.75,-9.10";
    }
}
