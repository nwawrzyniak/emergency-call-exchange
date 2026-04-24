import 'dotenv/config';
import express from 'express';

import configureSecurity from './server/security.js';
import configureCors from './server/cors.js';
import configureServeStatic from './server/serve-static.js';
import configureLimiter from './server/limiter.js';
import configureRoutes from './server/routes.js';
import configureHealthCheck from './server/health-check.js';
import configureAPI from './server/api.js';
import configureServeIndex from './server/serve-index.js';
import configureErrorHandling from './server/error-handling.js';
import connectDatabaseAndStartServer from './server/server.js';

const app = express();

configureSecurity(app);
configureCors(app);
configureServeStatic(app);
configureLimiter(app);
configureRoutes(app);
configureHealthCheck(app);
configureAPI(app);
configureServeIndex(app);
configureErrorHandling(app);

connectDatabaseAndStartServer(app);

export default app;
