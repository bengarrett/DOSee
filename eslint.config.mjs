// eslint.config.mjs
// ESLint v10 flat configuration for DOSee - MS-DOS Emulator for the Web
// https://eslint.org/docs/latest/use/configure/configuration-files-new
/// <reference types="@eslint/js" />
import globals from "globals";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

export default [
  // Global ignores - files that should not be linted
  {
    ignores: [
      "build/**",
      "src/emulator/**",
      "workbox-config.js",
      "tmp/**",
      "*.min.js",
      "*.bundle.js",
      "node_modules/**",
    ],
  },

  // Base recommended rules from ESLint
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023, // Explicit version for clarity
      sourceType: "module", // ES modules (default in modern JS)
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
          jsx: false, // Not using JSX
        },
      },
      globals: {
        ...globals.browser,
        // DOSee application globals
        BrowserFS: "readonly",
        DOSee: "readonly",
        DoseeLoader: "readonly",
        Emulator: "readonly",
        FileSaver: "readonly",
        // Writable globals
        FS: "writable",
        Module: "writable",
        // Service Worker globals (for sw.js)
        self: "readonly",
        caches: "readonly",
        importScripts: "readonly",
      },
    },
    linterOptions: {
      noInlineConfig: false,
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      "no-useless-assignment": "error",
      "require-atomic-updates": "error",
      "accessor-pairs": "warn",
      "symbol-description": "warn",
      "no-eval": "error",
      "no-empty-function": "warn",
      "no-empty": "warn",
      "no-else-return": "warn",
      "no-bitwise": "warn",
      "no-var": "warn",
      "no-undefined": "warn",
      "no-undef-init": "warn",
      "no-useless-constructor": "warn",
      "no-useless-concat": "warn",
      "no-useless-computed-key": "warn",
      "no-unneeded-ternary": "warn",
      "prefer-template": "warn",
      "prefer-spread": "warn",
      "prefer-rest-params": "warn",
      "prefer-const": "warn",
      "prefer-arrow-callback": "warn",
      "operator-assignment": "warn",
      "no-throw-literal": "warn",
      "no-script-url": "warn",
      "no-return-assign": "warn",
      "no-proto": "warn",
      "no-param-reassign": "warn",
      "no-octal-escape": "warn",
      "no-object-constructor": "warn",
      "no-new-wrappers": "warn",
      "no-new-func": "warn",
      "no-new": "warn",
      "no-nested-ternary": "warn",
      "no-negated-condition": "warn",
      "no-multi-assign": "warn",
      "no-magic-numbers": [
        "warn",
        {
          ignore: [-1, 0, 1, 2],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreClassFieldInitialValues: true,
          enforceConst: true,
        },
      ],
      "no-loop-func": "warn",
      "no-lonely-if": "warn",
      "no-implied-eval": "warn",
      "no-implicit-globals": "warn",
      "no-implicit-coercion": "warn",
      "default-case-last": "warn",
      "dot-notation": "warn",
      eqeqeq: "warn",
      "no-extend-native": "error",
    },
  },

  // Prettier compatibility - should be last to override formatting rules
  prettierConfig,
];
