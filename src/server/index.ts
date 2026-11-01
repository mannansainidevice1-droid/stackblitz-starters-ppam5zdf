/**
 * BHAIRAVI Creations Digital Platform
 * Server Entry Point
 * Target: src/server/index.ts
 */

import { createServer } from './app.js';
import { getDatabase, closeDatabase } from './db/connection.js';

const PORT = Number(process.env.PORT) || 4001;
const HOST = process.env.HOST || '0.0.0.0';

const db = getDatabase();
const server = createServer(PORT, db);

server.listen(PORT, HOST, () => {
  console.log(`BHAIRAVI Creations Server running at http://${HOST}:${PORT}/`);
});

function handleShutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default server;
