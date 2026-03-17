import Fastify from 'fastify';
import cors from '@fastify/cors';
import { scenarioRoutes } from './routes/scenarios.js';
import { initiativeRoutes } from './routes/initiatives.js';
import { capabilityRoutes } from './routes/capabilities.js';
import { effectRoutes } from './routes/effects.js';
import { snapshotRoutes } from './routes/snapshots.js';
import { membershipRoutes } from './routes/memberships.js';
import { settingsRoutes } from './routes/settings.js';
import { benchmarkRoutes } from './routes/benchmarks.js';
import { auditRoutes } from './routes/audit.js';
import { authRoutes } from './routes/auth.js';
import { initPublicSchema } from './db/provision.js';

const app = Fastify({
  logger: process.env.NODE_ENV !== 'test',
  trustProxy: true,
});

// CORS
await app.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:5173'],
  credentials: true,
});

// Zod validation error handler
app.setErrorHandler((error, _request, reply) => {
  if (error.name === 'ZodError') {
    return reply.code(400).send({
      error: 'Validation error',
      details: JSON.parse(error.message),
    });
  }
  app.log.error(error);
  return reply.code(error.statusCode ?? 500).send({
    error: error.message ?? 'Internal server error',
  });
});

// Health check
app.get('/health', async (_req, reply) => {
  return reply.send({ ok: true, timestamp: new Date().toISOString() });
});

// Routes
const API_PREFIX = '/api/v1';
await app.register(authRoutes, { prefix: API_PREFIX });
await app.register(scenarioRoutes, { prefix: API_PREFIX });
await app.register(initiativeRoutes, { prefix: API_PREFIX });
await app.register(capabilityRoutes, { prefix: API_PREFIX });
await app.register(effectRoutes, { prefix: API_PREFIX });
await app.register(snapshotRoutes, { prefix: API_PREFIX });
await app.register(membershipRoutes, { prefix: API_PREFIX });
await app.register(settingsRoutes, { prefix: API_PREFIX });
await app.register(benchmarkRoutes, { prefix: API_PREFIX });
await app.register(auditRoutes, { prefix: API_PREFIX });

// Startup
const start = async () => {
  try {
    // Initialise cairn_public schema if needed
    if (process.env.DB_INIT_ON_START === 'true') {
      await initPublicSchema();
    }

    const port = parseInt(process.env.PORT ?? '3001', 10);
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Cairn API listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
