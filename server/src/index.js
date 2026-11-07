import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { config } from './config.js';
import { createApiRouter } from './routes/api.js';
import { registerLabSockets } from './sockets/labSocket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '../../client/dist');

const app = express();
app.use(
  cors({
    origin: [config.clientOrigin, 'http://127.0.0.1:5173'],
    credentials: true,
  }),
);
app.use(express.json({ limit: '256kb' }));

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    product: 'DataComPredia',
    message: 'API is running',
    docs: '/api/v1/health',
  });
});

app.use('/api/v1', createApiRouter());

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected server error.' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [config.clientOrigin, 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

registerLabSockets(io);

server.listen(config.port, config.host, () => {
  console.log(`DataComPredia server listening on http://${config.host}:${config.port}`);
});
