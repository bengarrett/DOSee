/**
 * Simple HTTP Server for DOSee Testing
 * Run with: node test_server.js
 * Then open: http://localhost:8090/test/load_test.html
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8090;
const BASE_DIR = __dirname;

const server = http.createServer((req, res) => {
  // Parse the requested URL
  const parsedUrl = url.parse(req.url);
  let filepath = path.join(BASE_DIR, parsedUrl.pathname);

  // Security: Prevent directory traversal
  if (!filepath.startsWith(BASE_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Try to read the file
  fs.readFile(filepath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        // Other error
        res.writeHead(500);
        res.end('500 Server Error');
      }
    } else {
      // Determine content type
      let contentType = 'text/html';
      if (filepath.endsWith('.js')) contentType = 'application/javascript';
      if (filepath.endsWith('.css')) contentType = 'text/css';
      if (filepath.endsWith('.json')) contentType = 'application/json';
      if (filepath.endsWith('.png')) contentType = 'image/png';
      if (filepath.endsWith('.jpg') || filepath.endsWith('.jpeg'))
        contentType = 'image/jpeg';
      if (filepath.endsWith('.zip')) contentType = 'application/zip';
      if (filepath.endsWith('.wasm')) contentType = 'application/wasm';

      // Add CORS headers for service worker
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Service-Worker-Allowed': '/',
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`DOSee Test Server running at http://localhost:${PORT}`);
  console.log('');
  console.log('Available test pages:');
  console.log(`  - Load Test: http://localhost:${PORT}/test/load_test.html`);
  console.log(`  - Main App: http://localhost:${PORT}/src/index.html`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\nShutting down test server...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit();
  });
});

