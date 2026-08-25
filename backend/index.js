require('dotenv').config({ path: '.env.local' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const promClient = require('prom-client');

const expenseRoutes = require('./routes/expenses');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Prometheus metrics ──────────────────────────────────────────
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Middleware
// Allow all origins (dev-safe; restrict in production via env)
app.use(cors());
app.use(express.json());

// Collect request metrics
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.baseUrl + req.route.path : req.path;
    httpRequestDuration
      .labels(req.method, route, String(res.statusCode))
      .observe(end());
    httpRequestsTotal
      .labels(req.method, route, String(res.statusCode))
      .inc();
  });
  next();
});

// Expose metrics to Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Routes
//Connect expenses routes
app.use('/api/expenses', expenseRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Expense Tracker API running' });
});

// Connect to MongoDB then start server
mongoose
  .connect(process.env.NEXT_PUBLIC_MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
