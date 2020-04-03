// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: ['plugin:prettier/recommended'],
  plugins: ['prettier'],
  rules: {
    'no-console': ['off'],
    'prettier/prettier': ['error'],
    quotes: ['error', 'backtick'],
  },
  parserOptions: {
    ecmaVersion: 2016,
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
