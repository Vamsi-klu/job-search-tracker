import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database.js';
import logsRouter from './routes/logs.js';

// Create Express app
export function createApp() {
  const app = express();

  // Initialize database
  initializeDatabase();

  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware (only in development)
  if (process.env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  // Routes
  app.use('/api/logs', logsRouter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Job Search Tracker API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        logs: '/api/logs',
      },
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  return app;
}
