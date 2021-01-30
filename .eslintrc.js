/*
 *  ESLint configuration.
 *
 *  This config was last revised for ESLint v7
 *
 *  Rules: https://eslint.org/docs/rules/
 */
module.exports = {
  env: {
    // Browser global variables.
    browser: true,
    // Es2017 JS syntax
    es2017: true,
  },
  /*
   * Prettier must be the last item in extends.
   * It uses the npm package eslint-config-prettier.
   * https://github.com/prettier/eslint-config-prettier
   *
   * No other plugins or addons are required, instead in VSCode,
   * simply enable the Prettier and ESLint extensions.
   */
  extends: [`eslint:recommended`, `prettier`],
  // global variables
  globals: {
    module: `readonly`,
    BrowserFS: `readonly`,
    DOSee: `readonly`,
    DoseeLoader: `readonly`,
    Emulator: `readonly`,
    FileSaver: `readonly`,
    FS: `readonly`,
    Module: true,
  },
  parserOptions: {
    ecmaVersion: 2017,
  },
  rules: {
    "no-unused-vars": [`error`, { vars: `local` }],
    // Possible errors
    "no-template-curly-in-string": `error`,
    "no-unreachable-loop": `error`,
    //"no-unsafe-optional-chaining": `error`,
    // Best practices
    "array-callback-return": `error`,
    "block-scoped-var": `error`,
    //"consistent-return": `error`,
    "default-case": `error`,
    "default-case-last": `error`,
    eqeqeq: [`error`, `smart`],
    //"no-alert": `error`,
    "no-else-return": `error`,
    "no-empty-function": [`error`],
    "no-eval": `error`,
    "no-extend-native": `error`,
    "no-extra-bind": `error`,
    "no-extra-label": `error`,
    "no-floating-decimal": `error`,
    "no-implicit-coercion": `error`,
    "no-implicit-globals": `error`,
    "no-implied-eval": `error`,
    "no-invalid-this": `error`,
    "no-iterator": `error`,
    "no-labels": `error`,
    "no-lone-blocks": `error`,
    "no-loop-func": `error`,
    "no-magic-numbers": [
      `error`,
      { ignore: [0, 1, 2], ignoreArrayIndexes: true },
    ],
    "no-multi-spaces": `error`,
    "no-multi-str": `error`,
    "no-new": `error`,
    "no-new-func": `error`,
    "no-new-wrappers": `error`,
    //"no-nonoctal-decimal-escape": `error`,
    "no-octal": `error`,
    "no-octal-escape": `error`,
    "no-param-reassign": `error`,
    "no-proto": `error`,
    "no-return-assign": `error`,
    "no-return-await": `error`,
    "no-script-url": `error`,
    "no-self-compare": `error`,
    "no-sequences": `error`,
    "no-throw-literal": `error`,
    "no-unmodified-loop-condition": `error`,
    "no-useless-call": `error`,
    "no-useless-concat": `error`,
    "no-useless-return": `error`,
    "no-void": `error`,
    "no-warning-comments": `error`,
    "prefer-promise-reject-errors": `error`,
    "require-await": `error`,
    "vars-on-top": `error`,
    yoda: [`error`, `never`],
    // Strict mode
    strict: `error`,
    // Variables
    //"init-declarations": [`error`, `never`, { ignoreForLoopInit: true }],
    "no-label-var": `error`,
    "no-shadow": `error`,
    "no-undef-init": `error`,
    "no-undefined": `error`,
    //"no-use-before-define": `error`,
    // Stylistic issues
    camelcase: `error`,
    "new-cap": `error`,
    "no-array-constructor": `error`,
    "no-inline-comments": `error`,
    "no-lonely-if": `error`,
    "no-multi-assign": `error`,
    "no-negated-condition": `error`,
    "no-nested-ternary": `error`,
    "no-new-object": `error`,
    "no-tabs": [`error`, { allowIndentationTabs: true }],
    quotes: [`error`, `backtick`],
    "unicode-bom": [`error`, `never`],
    // ES2015
    "no-confusing-arrow": `error`,
    "no-duplicate-imports": `error`,
    "no-useless-computed-key": `error`,
    "no-useless-constructor": `error`,
    "no-var": `error`,
    "object-shorthand": `error`,
    "prefer-const": `error`,
    "prefer-rest-params": `error`,
    "prefer-spread": `error`,
    "prefer-template": `error`,
    "symbol-description": `error`,
    "template-curly-spacing": `error`,
  },
};
