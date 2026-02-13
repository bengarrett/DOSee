// Puppeteer configuration for DOSee
// Supports multiple browsers: Chrome, Firefox, and WebKit
// ES Module version

const config = {
  // Default configuration
  default: {
    browser: "chrome", // 'chrome', 'firefox', or 'webkit'
    headless: true,
    viewport: {
      width: 800,
      height: 1200,
    },
    userAgent: "DOSee-Puppeteer/1.0",
    timeout: 30000, // 30 seconds
    screenshotPath: "dosee-puppeteer.png",
    serverPort: 8086,
    buildDir: "build",
    launchArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
  },

  // Browser-specific configurations
  browsers: {
    chrome: {
      product: "chrome",
      executablePath: null, // null for default
      extraLaunchArgs: [],
    },
    firefox: {
      product: "firefox",
      executablePath: null, // null for default
      extraLaunchArgs: [],
    },
    webkit: {
      product: "webkit",
      executablePath: null, // null for default
      extraLaunchArgs: [],
    },
  },

  // Test URLs
  urls: {
    main: "index.html",
    benchmark: "benchmark.html",
    offline: "offline.html",
  },

  // Get full configuration for a specific browser
  getConfig: function (browserType) {
    const browserConfig = this.browsers[browserType] || this.browsers.chrome;

    return {
      ...this.default,
      browser: browserType,
      ...browserConfig,
    };
  },

  // Get the URL for a specific page
  getUrl: function (pageType) {
    return `http://localhost:${this.default.serverPort}/${this.urls[pageType] || this.urls.main}`;
  },
};

export default config;
