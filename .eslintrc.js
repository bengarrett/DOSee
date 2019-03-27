/* spell-checker: disable */
module.exports = {
    env: {
        browser: true,
        es6: true
    },
    extends: "eslint:recommended",
    parserOptions: {
        ecmaVersion: 2017,
        impliedStrict: true
    },
    rules: {
        indent: ["error", 4, { SwitchCase: 1 }],
        "linebreak-style": ["off"],
        "no-console": ["error", { allow: ["log", "error", "warn"] }],
        "no-fallthrough": [
            "error",
            { commentPattern: "break[\\s\\w]*omitted" }
        ],
        "no-unused-vars": ["error", { vars: "local" }],
        quotes: ["error", "backtick"],
        semi: ["error", "never"],
        strict: ["error", "global"]
    },
    globals: {
        BrowserFS: true,
        DoseeLoader: true,
        Emulator: true,
        ES6Promise: true,
        FS: true,
        getMetaContent: true,
        Module: true,
        newQueryString: true,
        Promise: true,
        saveAs: true,
        setMetaContent: true,
        storageAvailable: true
    }
}
