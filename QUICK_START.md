# Quick Start Guide - Secure Job Search Tracker

## 🚀 Get Started in 3 Minutes

### Step 1: Install Dependencies
```bash
cd job-search-tracker
npm install
cd server
npm install
cd ..
```

### Step 2: Configure Environment
```bash
cd server
cp .env.example .env
```

Edit `.env` and change `JWT_SECRET` to a strong random string:
```env
JWT_SECRET=your-very-long-random-secret-key-at-least-32-characters-long
```

### Step 3: Start the Application
```bash
# Terminal 1 - Backend (from job-search-tracker/server)
npm run dev

# Terminal 2 - Frontend (from job-search-tracker)
npm run dev
```

### Step 4: Create Account
1. Open http://localhost:5173
2. Click "Create Account"
3. Enter username (3+ alphanumeric characters)
4. Enter password (6+ characters)
5. Start tracking jobs!

## 🔐 Security Features

✅ **Passwords:** Hashed with bcrypt (never stored in plain text)
✅ **Authentication:** JWT tokens with 7-day expiration
✅ **Validation:** All inputs sanitized and validated
✅ **Rate Limiting:** 100 requests per 15 minutes
✅ **Security Headers:** XSS, clickjacking protection
✅ **Authorization:** Users can only access their own data

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Logs (Requires Authentication)
- `GET /api/logs` - Get all logs
- `POST /api/logs` - Create log
- `GET /api/logs/:id` - Get specific log
- `DELETE /api/logs/:id` - Delete log
- `GET /api/logs/stats` - Get statistics

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd ..
npm test
```

## 🔧 Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify .env file exists
- Check JWT_SECRET is set

### Frontend can't connect
- Ensure backend is running on port 3001
- Check CORS_ORIGIN in .env matches frontend URL
- Clear browser cache and localStorage

### Authentication fails
- Clear localStorage: `localStorage.clear()`
- Check JWT_SECRET hasn't changed
- Verify username/password meet requirements

## 📚 Documentation

- `SECURITY_IMPROVEMENTS.md` - Security details
- `IMPLEMENTATION_COMPLETE.md` - Full implementation guide
- `ARCHITECTURE.md` - System architecture

## 🎯 Key Changes from Previous Version

1. **Authentication:** Now uses secure backend auth (not localStorage)
2. **API:** All endpoints require authentication token
3. **Validation:** Strict input validation on all fields
4. **Performance:** Optimized with React.memo and useMemo
5. **Error Handling:** Error boundaries for graceful failures

## ⚡ Performance Tips

- Use search to filter jobs (debounced)
- Logs are paginated automatically
- Components are memoized for fast rendering
- API responses are cached where appropriate

## 🛡️ Security Best Practices

1. **Never share JWT_SECRET**
2. **Use HTTPS in production**
3. **Rotate JWT_SECRET periodically**
4. **Monitor logs for suspicious activity**
5. **Keep dependencies updated**

## 📞 Need Help?

1. Check error messages in browser console
2. Check backend logs in `server/logs/`
3. Review documentation files
4. Check test files for usage examples

## 🎉 You're Ready!

Your secure job search tracker is now running with:
- ✅ Enterprise-grade security
- ✅ Input validation
- ✅ Rate limiting
- ✅ Error handling
- ✅ Performance optimization

Happy job hunting! 🚀
