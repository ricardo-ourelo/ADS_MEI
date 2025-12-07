/**
 * @jest-environment jsdom
 */

import { ProfileManager } from "../../src/core/profileManager.js";

describe("ProfileManager — testes completos", () => {

    let pm;

    beforeEach(() => {
        pm = new ProfileManager();
    });

    // ---------------------------
    // getProfile
    // ---------------------------
    test("getProfile retorna perfil existente", () => {
        const car = pm.getProfile("car");
        expect(car).toMatchObject({
            name: "de Carro",
            icon: "🚗",
            speed: 50
        });
    });

    test("getProfile retorna 'car' como fallback", () => {
        const fallback = pm.getProfile("nao_existe");
        expect(fallback).toBe(pm.getProfile("car"));
    });

    // ---------------------------
    // getProfileName
    // ---------------------------
    test("getProfileName retorna nome correto", () => {
        expect(pm.getProfileName("mota")).toBe("de Mota");
    });

    // ---------------------------
    // getProfileIcon
    // ---------------------------
    test("getProfileIcon retorna ícone correto", () => {
        expect(pm.getProfileIcon("bicicleta")).toBe("🚴");
    });

    // ---------------------------
    // getProfileColor
    // ---------------------------
    test("getProfileColor retorna cor correta", () => {
        expect(pm.getProfileColor("walking")).toBe("#3498db");
    });

    // ---------------------------
    // getAllProfiles
    // ---------------------------
    test("getAllProfiles retorna objeto com todos os perfis", () => {
        const profiles = pm.getAllProfiles();
        expect(Object.keys(profiles)).toEqual(["car", "mota", "bicicleta", "walking"]);
    });

});
