import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database.js';
import logsRouter from './routes/logs.js';
import authRouter from './routes/auth.js';
import { helmetConfig, generalLimiter, sanitizeRequest, getCorsOptions } from './middleware/security.js';
import { authenticate } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Security middleware (MUST be first)
app.use(helmetConfig); // Security headers
app.use(generalLimiter); // Rate limiting

// CORS with proper configuration
app.use(cors(getCorsOptions()));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request sanitization
app.use(sanitizeRequest);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRouter); // Authentication routes (public)
app.use('/api/logs', authenticate, logsRouter); // Protected with authentication

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Job Search Tracker API',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      logs: '/api/logs'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔐 Security features enabled`);
    console.log(`📊 API endpoints:`);
    console.log(`   - Health: http://localhost:${PORT}/health`);
    console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
    console.log(`   - Logs: http://localhost:${PORT}/api/logs`);
    console.log(`\n📝 Database: SQLite (logs.db)`);
    console.log(`\nPress Ctrl+C to stop the server\n`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Export for testing
export default app;
