/**
 * @file jest.config.js
 * @description Configuração Jest para ES Modules com Babel e jsdom.
 */
export default {
    testEnvironment: "jsdom",
    roots: ["<rootDir>/__tests__"],
    transform: {
        "^.+\\.js$": "babel-jest"   // 👈 transforma os imports/exports
    },
};
