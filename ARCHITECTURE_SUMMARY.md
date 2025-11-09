# Job Search Tracker - Architecture Summary

## Quick Reference Guide

### 📁 Project Structure

```
job-search-tracker/
├── src/                          # Frontend source
│   ├── components/               # React components
│   │   ├── Auth.jsx             # Authentication UI
│   │   ├── Dashboard.jsx        # Main application hub
│   │   ├── JobCard.jsx          # Individual job display
│   │   ├── JobForm.jsx          # Job create/edit modal
│   │   ├── ActivityLog.jsx      # Activity timeline
│   │   └── AISummary.jsx        # Query interface
│   ├── contexts/                # React contexts
│   │   └── ThemeContext.jsx    # Theme state management
│   ├── services/                # API clients
│   │   └── api.js              # Backend HTTP client
│   ├── App.jsx                  # Root component
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
├── server/                       # Backend source
│   └── src/
│       ├── controllers/         # Business logic
│       │   └── logsController.js
│       ├── routes/              # API routes
│       │   └── logs.js
│       ├── database.js          # SQLite manager
│       └── index.js             # Server entry point
├── dist/                         # Production build
├── node_modules/                 # Dependencies
├── package.json                  # Frontend config
└── server/package.json          # Backend config
```

### 🎯 Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 | UI framework |
| | Vite 5 | Build tool & dev server |
| | Tailwind CSS 3 | Utility-first styling |
| | Framer Motion 10 | Animations |
| | Lucide React | Icon library |
| **Backend** | Node.js | Runtime environment |
| | Express 4 | Web framework |
| | better-sqlite3 9 | Database driver |
| | CORS | Cross-origin support |
| **Database** | SQLite 3 | Embedded database |
| **Storage** | localStorage | Browser persistence |

### ✅ Test Harness

- **Runner**: `vitest` + `jsdom` via `vite.config.js` (shared config for app + tests).
- **Libraries**: React Testing Library + `@testing-library/user-event` for user-centric assertions, `@testing-library/jest-dom` for expressive matchers.
- **Mocking**: targeted `vi.mock` of `logsAPI` and theme context; configurable summary delay in `AISummary` to avoid brittle timers.
- **Coverage Rules**: v8 instrumentation with per-file thresholds (95% statements/branches/functions/lines) to keep regressions visible in CI.
- **Suites**: 22 deterministic tests across Dashboard, JobForm, JobCard, ActivityLog, AISummary, and CelebrationOverlay covering both interaction flows and helper edge cases (metadata chips, fallback paths, API failures, celebrations, etc.).
- **Current Status**: Aggregate coverage at ~91% statements; remaining gap sits in declarative JSX for `Dashboard`, `JobForm`, and `JobCard`. Closing the delta requires extracting presentational sections into smaller view components or expanding DOM assertions to hit every branch of the UI (e.g., all status pills, every modal permutation).

### 🔄 Data Flow Summary

```
User Action → Component → State Update → localStorage → API Call → Backend → Database → Response → State Update → Re-render
```

### 📊 Database Schema Quick Reference

**users**
- `id` (PK, INTEGER)
- `username` (UNIQUE, TEXT)
- `created_at` (INTEGER)

**jobs**
- `id` (PK, TEXT)
- `title`, `company`, `recruiter_name` (TEXT)
- `created_at`, `updated_at` (INTEGER)

**log_entries**
- `id` (PK, INTEGER)
- `job_id` (FK, TEXT, nullable)
- `user_id` (FK, INTEGER)
- `action`, `details`, `metadata` (TEXT)
- `company_snapshot`, `job_title_snapshot` (TEXT)
- `created_at` (INTEGER, indexed)

### 🚀 Quick Start Commands

```bash
# Install all dependencies
npm run install:all

# Start development (frontend + backend)
npm run dev:all

# Frontend only
npm run dev

# Backend only
npm run server:dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| POST | `/api/logs` | Create log entry |
| GET | `/api/logs` | Get all logs (with filters) |
| GET | `/api/logs/stats` | Get statistics |
| GET | `/api/logs/:id` | Get single log |
| DELETE | `/api/logs/:id` | Delete log |
| POST | `/api/logs/bulk` | Bulk create logs |

### 🎨 Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| **App.jsx** | Authentication routing, loading state |
| **Auth.jsx** | Login/signup UI, password management |
| **Dashboard.jsx** | Main controller, state management, API coordination |
| **JobCard.jsx** | Display job, inline status updates |
| **JobForm.jsx** | Create/edit job modal, form validation |
| **ActivityLog.jsx** | Timeline display, statistics |
| **AISummary.jsx** | Query interface, summary generation |
| **ThemeContext.jsx** | Global theme state, persistence |

### 🔐 Security Status

⚠️ **Current Implementation: NOT PRODUCTION READY**

**Issues:**
- Plain text passwords in localStorage
- No server-side authentication
- No encryption
- Vulnerable to XSS attacks
- No rate limiting

**Required for Production:**
- Password hashing (bcrypt)
- JWT authentication
- HTTPS only
- Input validation
- CSRF protection
- Rate limiting

### 📈 Performance Features

**Frontend:**
- Optimistic UI updates
- Staggered animations
- Lazy modal rendering
- Efficient filtering
- localStorage caching

**Backend:**
- SQLite WAL mode
- Prepared statements
- Composite indexes
- Transaction batching
- 64MB page cache
- Denormalized snapshots

### 🎭 Animation Patterns

| Animation | Trigger | Effect |
|-----------|---------|--------|
| Page load | Component mount | Fade + slide up |
| Modal open | State change | Scale + slide |
| Modal close | State change | Scale + fade out |
| List items | Array map | Staggered entrance |
| Hover | Mouse enter | Scale up |
| Button tap | Click | Scale down |

### 📦 State Management

**Local State:**
- Component-specific data
- Form inputs
- Modal visibility

**Context State:**
- Theme (dark/light)
- Shared across all components

**Persistent State:**
- localStorage: Jobs, user, password, theme
- SQLite: Activity logs, users, jobs metadata

### 🔧 Environment Variables

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001/api
```

**Backend (server/.env):**
```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 📝 Key Design Decisions

1. **Hybrid Storage**: Jobs in localStorage (fast), logs in database (durable)
2. **Denormalization**: Snapshots prevent data loss on deletion
3. **Optimistic Updates**: UI responds immediately
4. **Component Composition**: Small, focused components
5. **Animation-First**: Smooth transitions everywhere
6. **Theme System**: Context-based with persistence
7. **RESTful API**: Standard HTTP methods
8. **Prepared Statements**: SQL injection protection

### 🐛 Common Issues & Solutions

**Issue: API calls failing**
- Check backend server is running (port 3001)
- Verify CORS_ORIGIN matches frontend URL
- Check network tab for errors

**Issue: Jobs not persisting**
- Check localStorage quota
- Verify browser allows localStorage
- Check console for errors

**Issue: Logs not loading**
- Verify database file exists (server/logs.db)
- Check database permissions
- Review server logs

**Issue: Theme not saving**
- Check localStorage access
- Verify ThemeContext is wrapping app
- Check browser console

### 📚 Documentation Files

- `ARCHITECTURE.md` - Detailed component documentation (Part 1)
- `ARCHITECTURE_PART2.md` - Controllers, API, deployment (Part 2)
- `DIAGRAMS.md` - Comprehensive Mermaid diagrams
- `ARCHITECTURE_SUMMARY.md` - This quick reference
- `README.md` - User-facing documentation

### 🎯 Future Enhancement Priorities

**High Priority:**
1. Implement proper authentication
2. Add input validation
3. Implement HTTPS
4. Add error boundaries
5. Improve accessibility

**Medium Priority:**
1. Add data export (CSV/PDF)
2. Implement email notifications
3. Add advanced filtering
4. Create analytics dashboard
5. Mobile responsive improvements

**Low Priority:**
1. Real AI integration
2. Multi-user support
3. Calendar integration
4. Mobile app
5. Advanced search

### 🔍 Testing Strategy

**Unit Tests:**
- Component rendering
- Event handlers
- Helper functions
- API client methods

**Integration Tests:**
- API endpoints
- Database operations
- Authentication flow
- CRUD operations

**E2E Tests:**
- User workflows
- Job creation
- Status updates
- Search functionality

### 📊 Monitoring Recommendations

**Application Metrics:**
- API response times
- Error rates
- Database query performance
- User activity patterns

**Infrastructure Metrics:**
- Server uptime
- Memory usage
- CPU utilization
- Disk space

**User Metrics:**
- Page load times
- Time to interactive
- Core Web Vitals
- Error frequency

---

## Quick Troubleshooting

### Frontend Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Check for port conflicts
lsof -i :5173
```

### Backend Issues

```bash
# Check if server is running
curl http://localhost:3001/health

# View server logs
npm run server:dev

# Reset database
rm server/logs.db
# Restart server to recreate

# Check SQLite
sqlite3 server/logs.db ".tables"
```

### Database Issues

```bash
# Open database
sqlite3 server/logs.db

# Check tables
.tables

# View schema
.schema log_entries

# Count records
SELECT COUNT(*) FROM log_entries;

# Check indexes
.indexes log_entries

# Exit
.quit
```

---

## Development Workflow

1. **Start Development**:
   ```bash
   npm run dev:all
   ```

2. **Make Changes**:
   - Frontend: Hot reload automatic
   - Backend: Nodemon auto-restarts

3. **Test Changes**:
   - Manual testing in browser
   - Check console for errors
   - Verify API calls in Network tab

4. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Description"
   git push
   ```

5. **Deploy**:
   - Build frontend: `npm run build`
   - Deploy dist/ to static host
   - Deploy server/ to Node.js host

---

## Performance Benchmarks

**Frontend:**
- Initial load: < 2s
- Time to interactive: < 3s
- Component render: < 16ms
- Animation frame rate: 60fps

**Backend:**
- API response: < 100ms
- Database query: < 10ms
- Log creation: < 50ms
- Bulk insert (100): < 500ms

**Database:**
- Table scan: < 5ms (1000 rows)
- Indexed query: < 1ms
- JOIN query: < 10ms
- Transaction commit: < 20ms

---

This summary provides quick access to the most important architectural information. For detailed explanations, refer to the full architecture documents.
