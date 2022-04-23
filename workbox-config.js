module.exports = {
  globDirectory: `build/`,
  globPatterns: [`**/*.{css,html,ico,js,json,mem,png,wasm,zip}`],
  maximumFileSizeToCacheInBytes: 8000000,
  swDest: `build/sw.js`,
  swSrc: `src/sw.js`,
  globIgnores: [`../workbox-config.js`],
};
