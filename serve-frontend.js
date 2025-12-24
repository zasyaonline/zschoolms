const express = require('express');
const path = require('path');

const app = express();
const PORT = 5173;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Handle client-side routing - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Frontend Server Running!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://192.168.1.2:${PORT}`);
  console.log(`✨ Serving production build from: ${path.join(__dirname, 'frontend/dist')}\n`);
});
