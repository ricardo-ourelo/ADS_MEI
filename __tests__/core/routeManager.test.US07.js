/**
 * @jest-environment jsdom
 */

import { RouteManager } from "../../src/core/routeManager.js";
import { ProfileManager } from "../../src/core/profileManager.js";
import {describe, jest} from "@jest/globals";


global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ code: "Ok", routes: [] })
    })
);

describe("US07 — RouteManager envia múltiplos waypoints", () => {
    test("deve incluir parâmetro ?waypoints= ao haver paragens", async () => {
        const rm = new RouteManager({}, new ProfileManager());

        const start = { lat: 1, lng: 1 };
        const end = { lat: 9, lng: 9 };
        const stops = [
            { lat: 2, lng: 2 },
            { lat: 3, lng: 3 }
        ];

        await rm.calculateRoute(start, end, "car", stops);

        const url = fetch.mock.calls[0][0];
        expect(decodeURIComponent(url)).toContain("waypoints=2,2;3,3");
    });
});
