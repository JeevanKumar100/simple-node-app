const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const os = require('os');

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Kubernetes!',
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'simple-node-app' });
});

app.get('/info', (req, res) => {
  res.json({
    service: 'Simple Node App',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Hostname: ${os.hostname()}`);
});
