const express = require('express');
const client = require('prom-client');
const { Pool } = require('pg');
const redis = require('redis');

const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown-service';
const SERVICE_PORT = process.env.SERVICE_PORT || 8000;

const app = express();
app.use(express.json());

// Prometheus setup
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: `${SERVICE_NAME.replace(/-/g, '_')}_` });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'endpoint', 'status'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'endpoint', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

const businessMetrics = {
  orders: new client.Counter({
    name: 'business_orders_total',
    help: 'Total orders created',
    registers: [register]
  }),
  revenue: new client.Counter({
    name: 'business_revenue_euros',
    help: 'Total revenue in euros',
    registers: [register]
  }),
  activeUsers: new client.Gauge({
    name: 'business_active_users',
    help: 'Number of active users',
    registers: [register]
  })
};

// Database connection (si applicable)
let dbPool;
if (process.env.DB_HOST) {
  dbPool = new Pool({
    host: process.env.DB_HOST,
    database: 'techshop',
    user: 'techshop',
    password: 'techshop123',
    port: 5432,
  });
}

// Redis connection (si applicable)
let redisClient;
if (process.env.REDIS_HOST) {
  redisClient = redis.createClient({
    socket: { host: process.env.REDIS_HOST, port: 6379 }
  });
  redisClient.connect().catch(console.error);
}

// Middleware de logging et métriques
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, req.path, res.statusCode).observe(duration);
    httpRequestsTotal.labels(req.method, req.path, res.statusCode).inc();

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      service: SERVICE_NAME,
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_seconds: duration
    }));
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: SERVICE_NAME });
});

// Service-specific endpoints (à personnaliser par service)
app.get('/api/items', async (req, res) => {
  try {
    // Simuler latence variable
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));

    // Simuler des erreurs aléatoires (5%)
    if (Math.random() < 0.05) {
      throw new Error('Random service error');
    }

    const items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      price: Math.floor(Math.random() * 100) + 10
    }));

    res.json({ service: SERVICE_NAME, items });
  } catch (error) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      service: SERVICE_NAME,
      level: 'error',
      message: error.message
    }));
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/action', async (req, res) => {
  try {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300));

    // Incrémenter métriques business (exemple)
    if (SERVICE_NAME === 'order-service') {
      businessMetrics.orders.inc();
      const amount = Math.floor(Math.random() * 200) + 20;
      businessMetrics.revenue.inc(amount);
    }

    res.json({ success: true, service: SERVICE_NAME });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Simulateur d'activité
setInterval(() => {
  if (SERVICE_NAME === 'user-service') {
    businessMetrics.activeUsers.set(Math.floor(Math.random() * 50) + 20);
  }
}, 5000);

app.listen(SERVICE_PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    level: 'info',
    message: 'Service started',
    port: SERVICE_PORT
  }));
});