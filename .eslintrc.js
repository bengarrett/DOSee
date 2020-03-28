// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 6,
    impliedStrict: true
  },
  rules: {
    quotes: ["error", "backtick"],
    semi: ["error", "never"],
    strict: ["error", "global"]
  },
  globals: {
    BrowserFS: true,
    DOSee: true,
    DoseeLoader: true,
    Emulator: true,
    ES6Promise: true,
    FileSaver: true,
    FS: true,
    Module: true,
    Promise: true
  }
}
