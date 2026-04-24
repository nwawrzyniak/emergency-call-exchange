import 'dotenv/config';
import express from 'express';

const app = express();

const modules = [
  './server/security.js',
  './server/cors.js',
  './server/serve-static.js',
  './server/limiter.js',
  './server/routes.js',
  './server/health-check.js',
  './server/api.js',
  './server/serve-index.js',
  './server/error-handling.js',
];

for (const mod of modules) {
  const { default: configure } = await import(mod);
  configure(app);
}

const { default: connectDatabaseAndStartServer } = await import('./server/server.js');
connectDatabaseAndStartServer(app);

export default app;
