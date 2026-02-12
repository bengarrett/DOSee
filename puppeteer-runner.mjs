#!/usr/bin/env node

/**
 * DOSee Puppeteer Runner
 * Multi-browser testing utility for DOSee
 * ES Module version
 */

import puppeteer from "puppeteer";
import config from "./puppeteer.config.mjs";
import { execSync, spawn } from "child_process";

// Parse command line arguments
const args = process.argv.slice(2);
let browserType = "chrome"; // default
let pageType = "main"; // default
let headless = true;

// Process arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === "--browser" && args[i + 1]) {
    browserType = args[i + 1].toLowerCase();
    i++; // skip next arg
  } else if (arg === "--page" && args[i + 1]) {
    pageType = args[i + 1].toLowerCase();
    i++; // skip next arg
  } else if (arg === "--headful") {
    headless = false;
  } else if (arg === "--help" || arg === "-h") {
    showHelp();
    process.exit(0);
  }
}

// Validate browser type
const validBrowsers = ["chrome", "firefox", "webkit"];
if (!validBrowsers.includes(browserType)) {
  console.error(`Invalid browser type: ${browserType}`);
  console.error(`Valid options: ${validBrowsers.join(", ")}`);
  process.exit(1);
}

// Get configuration
const puppeteerConfig = config.getConfig(browserType);
const url = config.getUrl(pageType);

console.log(`=== DOSee Puppeteer Runner ===`);
console.log(`Browser: ${browserType}`);
console.log(`Page: ${pageType}`);
console.log(`Headless: ${headless}`);
console.log(`URL: ${url}`);

async function runPuppeteer() {
  try {
    // Build DOSee if needed
    console.log("Building DOSee...");
    execSync("pnpm run install", { stdio: "inherit" });

    // Start server
    console.log(`Starting server on port ${puppeteerConfig.serverPort}...`);
    const serverProcess = spawn(
      "npx",
      [
        "http-server",
        puppeteerConfig.buildDir,
        "--port",
        puppeteerConfig.serverPort.toString(),
        "--silent",
      ],
      {
        stdio: "inherit",
        detached: false,
      },
    );

    // Wait for server to start
    console.log("Waiting for server to start...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Launch browser
    console.log(`Launching ${browserType}...`);
    const browser = await puppeteer.launch({
      product: puppeteerConfig.product,
      headless: headless,
      args: [...puppeteerConfig.launchArgs, ...puppeteerConfig.extraLaunchArgs],
      executablePath: puppeteerConfig.executablePath,
    });

    // Create page with modern user agent approach (setUserAgent is deprecated)
    const page = await browser.newPage();
    await page.setViewport(puppeteerConfig.viewport);

    // Use page.emulate() for modern user agent setting
    await page.emulate({
      viewport: puppeteerConfig.viewport,
      userAgent: puppeteerConfig.userAgent,
    });

    // Navigate to page
    console.log(`Navigating to ${url}...`);
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: puppeteerConfig.timeout,
    });

    console.log("✅ Page loaded successfully!");
    console.log(`Title: ${await page.title()}`);
    console.log(`URL: ${page.url()}`);

    // Take screenshot
    await page.screenshot({ path: puppeteerConfig.screenshotPath });
    console.log(`📸 Screenshot saved as ${puppeteerConfig.screenshotPath}`);

    // Keep browser open for inspection if not headless
    if (!headless) {
      console.log(
        "🔍 Browser window open for inspection. Press Ctrl+C to exit.",
      );
      await new Promise(() => {}); // Keep running
    }

    await browser.close();

    // Clean up server process in headless mode
    if (headless && serverProcess) {
      try {
        serverProcess.kill("SIGTERM");
        // Give it a moment to terminate gracefully
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("🔌 Server process terminated");
      } catch (cleanupError) {
        console.warn(
          "⚠️  Could not clean up server process:",
          cleanupError.message,
        );
      }
    }

    console.log("✅ Puppeteer execution completed successfully");
  } catch (error) {
    console.error("❌ Puppeteer error:", error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log("DOSee Puppeteer Runner");
  console.log("");
  console.log("Usage: node puppeteer-runner.js [options]");
  console.log("");
  console.log("Options:");
  console.log("  --browser <type>   Browser to use (chrome, firefox, webkit)");
  console.log("  --page <type>      Page to test (main, benchmark, offline)");
  console.log("  --headful           Run in headed mode (show browser window)");
  console.log("  --help, -h         Show this help message");
  console.log("");
  console.log("Examples:");
  console.log("  node puppeteer-runner.js");
  console.log("  node puppeteer-runner.js --browser firefox --page benchmark");
  console.log("  node puppeteer-runner.js --browser chrome --headful");
}

// Run Puppeteer
runPuppeteer();
