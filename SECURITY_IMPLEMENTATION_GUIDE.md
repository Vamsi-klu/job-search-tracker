# 🔐 SECURITY IMPLEMENTATION GUIDE

This guide explains the security improvements that have been implemented and how to use them.

---

## 📦 REQUIRED DEPENDENCIES

### Backend Dependencies
Add these to `/server/package.json`:

```bash
cd server
npm install bcrypt jsonwebtoken express-validator helmet express-rate-limit
```

**Dependencies:**
- `bcrypt` - Password hashing (10+ rounds)
- `jsonwebtoken` - JWT token generation and verification
- `express-validator` - Request validation middleware
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting protection

---

## 🔧 SERVER SETUP

### 1. Update server/src/index.js

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database.js';
import logsRouter from './routes/logs.js';
import authRouter from './routes/auth.js'; // NEW
import { helmetConfig, generalLimiter, sanitizeRequest, getCorsOptions } from './middleware/security.js'; // NEW
import { authenticate } from './middleware/auth.js'; // NEW

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
app.use('/api/auth', authRouter); // NEW - Authentication routes (public)
app.use('/api/logs', authenticate, logsRouter); // UPDATED - Protected with auth

// Health check endpoint (public)
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
    version: '2.0.0', // Updated version
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

// Start server
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  process.exit(0);
});
```

### 2. Update Environment Variables

Create `/server/.env`:

```bash
# Server
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Database
DATABASE_PATH=./logs.db

# CORS
CORS_ORIGIN=http://localhost:5173
```

**IMPORTANT:** Change `JWT_SECRET` to a random string in production!

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🎨 FRONTEND IMPLEMENTATION

### 1. Update src/services/api.js

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Token management
let authToken = localStorage.getItem('auth_token');

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getAuthToken() {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('auth_token');
}

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));

    // Handle authentication errors
    if (response.status === 401) {
      clearAuthToken();
      window.location.href = '/'; // Redirect to login
    }

    throw new Error(error.error || error.message || 'Request failed');
  }
  return response.json();
}

// Helper to add auth header
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}

// Auth API
export const authAPI = {
  async register(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);

    // Save token
    if (data.token) {
      setAuthToken(data.token);
    }

    return data;
  },

  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);

    // Save token
    if (data.token) {
      setAuthToken(data.token);
    }

    return data;
  },

  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await handleResponse(response);
    clearAuthToken();
    return data;
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async changePassword(currentPassword, newPassword) {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
  }
};

// Logs API (UPDATED with auth headers)
export const logsAPI = {
  async create(logData) {
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(logData),
    });
    return handleResponse(response);
  },

  async getAll(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = `${API_BASE_URL}/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getStats() {
    const response = await fetch(`${API_BASE_URL}/logs/stats`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/logs/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/logs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async bulkCreate(logs) {
    const response = await fetch(`${API_BASE_URL}/logs/bulk`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ logs }),
    });
    return handleResponse(response);
  },

  // ... other methods with getHeaders()
};

// Health check
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return handleResponse(response);
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
}
```

### 2. Update src/components/Auth.jsx

Replace the entire component with secure implementation:

```javascript
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, User, Sparkles, AlertCircle } from 'lucide-react'
import { authAPI } from '../services/api'

const Auth = ({ onAuthenticated }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (isCreatingAccount && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      if (isCreatingAccount) {
        await authAPI.register(username, password)
      } else {
        await authAPI.login(username, password)
      }
      onAuthenticated()
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-md"
      >
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="inline-block mb-4"
            >
              <Sparkles className="w-16 h-16 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Job Search Tracker</h1>
            <p className="text-white/80">
              {isCreatingAccount ? 'Create your account' : 'Welcome back!'}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-white text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-white text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  placeholder={isCreatingAccount ? "Create a password (8+ chars)" : "Enter your password"}
                  disabled={isLoading}
                />
              </div>
            </motion.div>

            {isCreatingAccount && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-white text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg text-sm flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Please wait...' : (isCreatingAccount ? 'Create Account' : 'Sign In')}
            </motion.button>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <button
              onClick={() => {
                setIsCreatingAccount(!isCreatingAccount)
                setError('')
              }}
              className="text-white/80 text-sm hover:text-white transition-colors"
              disabled={isLoading}
            >
              {isCreatingAccount ? 'Already have an account? Sign in' : 'Need an account? Create one'}
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Auth
```

---

## 🧪 TESTING

### Test Authentication

1. **Register a new user:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

2. **Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

3. **Access protected endpoint:**
```bash
curl http://localhost:3001/api/logs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ✅ SECURITY CHECKLIST

### Implemented:
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT-based authentication
- ✅ Protected API routes
- ✅ Rate limiting (general + auth-specific)
- ✅ Security headers (Helmet)
- ✅ Input validation (express-validator)
- ✅ Request sanitization
- ✅ CORS configuration
- ✅ Lockout after failed attempts (15 min)
- ✅ Token expiration (7 days default)

### Still TODO:
- ⚠️ HTTPS in production
- ⚠️ Refresh token mechanism
- ⚠️ Password strength requirements (uppercase, numbers, special chars)
- ⚠️ Email verification
- ⚠️ Two-factor authentication (2FA)
- ⚠️ Token blacklisting on logout
- ⚠️ Session management
- ⚠️ Audit logging

---

## 🚀 DEPLOYMENT NOTES

### Production Checklist:
1. Change `JWT_SECRET` to a strong random string
2. Enable HTTPS
3. Set `NODE_ENV=production`
4. Use proper CORS_ORIGIN (your production domain)
5. Consider using Redis for rate limiting
6. Implement token refresh mechanism
7. Add monitoring and alerting
8. Regular security audits
9. Keep dependencies updated

---

**Last Updated:** 2025-11-09
**Version:** 2.0.0
