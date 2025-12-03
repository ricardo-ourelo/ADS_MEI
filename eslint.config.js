import js from "@eslint/js";
import pluginSonarjs from "eslint-plugin-sonarjs";

export default [

    // Ficheiros a ignorar
    {
        ignores: [
            "node_modules",
            "dist",
            "coverage",
            "views",
            "public"
        ]
    },

    // BACKEND → Node.js
    {
        files: ["src/controllers/**/*.js", "src/routes/**/*.js", "index.js"],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "module",
            globals: {
                console: "readonly",
                require: "readonly",
                module: "readonly",
                process: "readonly",
                __dirname: "readonly"
            }
        },
        plugins: { sonarjs: pluginSonarjs },
        rules: {
            ...js.configs.recommended.rules
        }
    },

    // FRONTEND → Browser + Leaflet + DOM
    {
        files: ["src/ui/**/*.js", "src/core/**/*.js"],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                console: "readonly",
                fetch: "readonly",
                setTimeout: "readonly",
                localStorage: "readonly",
                L: "readonly",
                Sortable: "readonly",
                URLSearchParams: "readonly",
                getComputedStyle: "readonly",
                uiController: "readonly"
            }

        },
        plugins: { sonarjs: pluginSonarjs },
        rules: {
            ...js.configs.recommended.rules,
            "complexity": ["warn", 10],
            "sonarjs/cognitive-complexity": ["warn", 15],
            "max-depth": ["warn", 4],
            "max-statements": ["warn", 40]
        }
    }
];
