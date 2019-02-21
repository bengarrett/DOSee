/* spell-checker: disable */
module.exports = {
    "env": {
        "browser":true,
        "es6": true,
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2017,
        "impliedStrict": true,
    },
    "rules": {
        "indent": ["error", 4, { "SwitchCase": 1 }],
        "linebreak-style": [
            "off"
        ],
        "no-console": ["error", { allow: ["log", "error", "warn"] }],
        "no-fallthrough": ["error", { "commentPattern": "break[\\s\\w]*omitted" }],
        "no-unused-vars": ["error", { "vars": "local" }],
        "quotes": [
            "error",
            "backtick",
        ],
        "semi": [
            "error",
            "never",
        ],
        "strict": ["error", "global"],
    },
    "globals": {
        "DoseeLoader": true,
        "Emulator": true,
        "getMetaContent": true,
        "storageAvailable": true,

        "BuildEcma48": true,
        "buildLinksToCSS": true,
        "changeTextScanlines": true,
        "changeTextEffect": true,
        "checkArg": true,
        "checkErr": true,
        "checkRange": true,
        "displayErr": true,
        "findControlSequences": true,
        "findEngine": true,
        "Font": true,
        "Guess": true,
        "humaniseFS": true,
        "Palette": true,
        "ParseToChildren": true,
        "runSpinLoader": true,
        "Transcode": true,
    }
};