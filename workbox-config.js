// NOTE: This file must use CommonJS (module.exports) format because workbox-cli
// requires CommonJS configuration files. ES modules are not supported in Workbox 7.
// This is a build configuration file, not application code.
const ThirteenMB = 13 * 1000000;

module.exports = {
  globDirectory: `build/`,
  globPatterns: [`**/*.{css,html,ico,js,json,mem,png,wasm,zip}`],
  maximumFileSizeToCacheInBytes: ThirteenMB,
  swDest: `build/sw.js`,
  swSrc: `src/sw.js`,
  globIgnores: [`../workbox-config.js`],
};
