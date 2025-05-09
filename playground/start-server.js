// Simple server for the Gibber playground

const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Enable CORS headers for AudioWorklet support
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// Start the server
app.listen(port, () => {
  console.log(`Gibber-as-a-Service is running at http://localhost:${port}`);
  console.log(`Press Ctrl+C to stop the server.`);
}); 