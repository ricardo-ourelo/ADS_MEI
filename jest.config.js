/**
 * @file jest.config.js
 * @description Configuração do Jest para suportar ES Modules e ambiente jsdom.
 */

export default {
    testEnvironment: "jsdom",
    roots: ["<rootDir>/__tests__"],
    transform: {}, // sem Babel, código é JS moderno nativo
};
