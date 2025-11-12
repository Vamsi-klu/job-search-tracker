import dotenv from 'dotenv';
import { createApp } from './app.js';

// Load environment variables
dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - Health: http://localhost:${PORT}/health`);
  console.log(`   - Logs: http://localhost:${PORT}/api/logs`);
  console.log(`\n📝 Database: SQLite (logs.db)`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  process.exit(0);
});
