# 🚀 Job Search Tracker

A beautiful, animated job search tracking application built with React, Vite, Tailwind CSS, and Framer Motion.

## ✨ Features

### 🔐 Authentication System
- First-time password creation
- Secure local authentication
- Username personalization

### 🎨 Beautiful UI with Animations
- **Framer Motion animations** for smooth interactions
- Celebratory/responsive status animations for success/failure states
- **Dark Theme** and **Light Theme** support
- Glass morphism effects
- Smooth transitions and hover effects
- Responsive design

### 📊 Job Tracking
Track your job applications with detailed fields:
- **Company Name**
- **Recruiter Name**
- **Hiring Manager + dedicated notes**
- **Position Title**
- **Recruiter Screen** (Not Started, In Progress, Completed, Rejected)
- **Technical Screen** (Not Started, In Progress, Completed, Rejected)
- **On-site Rounds** (4 rounds with individual statuses)
- **Final Decision** (Pending, Offer Extended, Accepted, Rejected, Declined)
- **Notes** for additional information

### 📝 Activity Logging
- Automatic logging of all changes
- Timestamps for every action
- User attribution
- Complete history tracking
- Metadata-rich entries (status updates, candidate notes, hiring manager notes)
- Beautiful timeline view

### 🤖 AI Summary
- Query your job search data
- Get summaries for specific companies
- Overview of all applications
- Recent activity insights
- Smart search functionality

### 🎯 Additional Features
- Real-time search across all jobs
- Statistics dashboard
- Color-coded status indicators
- Export-ready data (stored in localStorage)

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database for logs
- **better-sqlite3** - SQLite library
- **CORS** - Cross-origin resource sharing

### 🗃️ Backend Data Model

- `users` table keeps one row per authenticated user (normalized lookups, indexed by username).
- `jobs` table stores the authoritative copy of company/title metadata for each tracked job ID.
- Hiring manager contact + notes are synced into the jobs table and snapshotted with each log entry for historical accuracy.
- `log_entries` table records every activity with foreign keys to `users`/`jobs`, snapshot columns for denormalized reads, JSON metadata, and multi-column indexes (`user_id + created_at`, `job_id + created_at`, `action + created_at`) for low-latency queries.
- SQLite runs in **WAL mode** with tuned pragmas (reduced sync cost, large page cache, in-memory temp tables) so high-volume inserts and filters stay sub‑millisecond on modest hardware.

## 🚀 Getting Started

### Installation

#### Quick Install (Recommended)
```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

#### Manual Install
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install
```

### Running the Application

#### Run Everything (Recommended)
```bash
# Start both frontend and backend together
npm run dev:all
```

This will start:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

#### Run Separately
```bash
# Frontend only
npm run dev

# Backend only (from root directory)
npm run server:dev
```

#### Production Build
```bash
# Build frontend for production
npm run build

# Preview production build
npm run preview
```

### First Time Setup

1. Open the application
2. You'll be prompted to create a password
3. Enter your username and create a password
4. Start tracking your job applications!

## 📖 Usage

### Adding a Job Application

1. Click **"Add New Job"** button
2. Fill in the company details
3. Set initial interview stages
4. Add notes if needed
5. Click **"Add Job"**

### Updating Job Status

- Each job card has dropdown menus for each stage
- Simply select the new status
- Changes are automatically logged

### Viewing Activity Logs

1. Click **"View Activity Logs"** button
2. See all changes with timestamps
3. Filter by action type
4. View activity statistics

### Using AI Summary

1. Click the **Sparkles icon** in the header
2. Ask questions like:
   - "What's the status for Google?"
   - "Give me an overview"
   - "Show me recent activity"
3. Get instant intelligent summaries

### Switching Themes

- Click the **Sun/Moon icon** in the header
- Toggle between dark and light themes
- Your preference is saved automatically

## 🎨 Themes

### Dark Theme
- Deep blacks and purples
- Easy on the eyes
- Perfect for late-night job hunting

### Light Theme
- Clean whites and soft colors
- Crisp and professional
- Great for daytime use

## 💾 Data Storage

- **Jobs**: Stored in browser's localStorage
- **Activity Logs**: Persisted in SQLite via the backend (`users`, `jobs`, `log_entries` tables with JSON metadata + composite indexes)
- **User Data**: Stored in localStorage (password, username, theme)

LocalStorage keys:
- `jobTracker_password` - Your password
- `jobTracker_user` - Your username
- `jobTracker_jobs` - All job applications
- `jobTracker_theme` - Theme preference

## 🔌 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

#### Backend (server/.env)
```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Endpoints

#### Health Check
```
GET /health
```
Returns server health status and uptime.

#### Create Log Entry
```http
POST /api/logs
Content-Type: application/json

{
  "timestamp": "2025-11-09T10:30:00.000Z",
  "action": "created",
  "jobTitle": "Software Engineer",
  "company": "Tech Corp",
  "hiringManager": "Alex Hiring",
  "details": "New job application added",
  "jobId": "1731183000000",
  "username": "john_doe",
  "metadata": {
    "field": "recruiterScreen",
    "value": "Completed"
  }
}
```

#### Get All Logs
```http
GET /api/logs
```

#### Query Logs with Filters
```http
# Filter by action
GET /api/logs?action=created

# Filter by company
GET /api/logs?company=Tech Corp

# Filter by job ID
GET /api/logs?jobId=1731183000000

# Search logs
GET /api/logs?search=engineer

# Get recent activity (last 7 days)
GET /api/logs?days=7

# Pagination
GET /api/logs?limit=20&offset=0
```

#### Get Log Statistics
```http
GET /api/logs/stats
```

#### Get Single Log
```http
GET /api/logs/:id
```

#### Delete Log
```http
DELETE /api/logs/:id
```

#### Bulk Create Logs
```http
POST /api/logs/bulk
Content-Type: application/json

{
  "logs": [...]
}
```

### Database Schema

**users**
- `id` (INTEGER, PK)
- `username` (TEXT, UNIQUE, indexed)
- `created_at` (INTEGER epoch)

**jobs**
- `id` (TEXT, PK — matches frontend job id)
- `title` (TEXT)
- `company` (TEXT)
- `recruiter_name` (TEXT)
- `hiring_manager` (TEXT)
- `created_at` / `updated_at` (INTEGER epoch)

**log_entries**
- `id` (INTEGER, PK)
- `job_id` (TEXT, FK → jobs.id, nullable)
- `user_id` (INTEGER, FK → users.id)
- `action` (TEXT enum: created/updated/deleted/status_update)
- `details` (TEXT)
- `metadata` (TEXT storing JSON payload)
- `company_snapshot` / `job_title_snapshot` / `hiring_manager_snapshot` (TEXT fallbacks)
- `created_at` (INTEGER epoch)

**Indexes**
- Composite: `(user_id, created_at DESC)`, `(job_id, created_at DESC)`, `(action, created_at DESC)`
- Single-column: `created_at DESC` (covering scans for recent activity)

### JavaScript API Usage

```javascript
import { logsAPI } from './services/api';

// Create log
await logsAPI.create({
  timestamp: new Date().toISOString(),
  action: 'created',
  jobTitle: 'Developer',
  company: 'Tech Corp',
  details: 'New application',
  hiringManager: 'Jane Hiring',
  jobId: '1731183000000',
  username: 'john_doe',
  metadata: { field: 'technicalScreen', value: 'In Progress' }
});

// Get all logs
const logs = await logsAPI.getAll();

// Query logs
const filtered = await logsAPI.getByAction('created');
const recent = await logsAPI.getRecent(7);
const stats = await logsAPI.getStats();
```

## 🔒 Security Note

This is a demo application using localStorage for data persistence. For production use, consider:
- Backend API integration
- Proper authentication system
- Database storage
- Password encryption

## 📱 Responsive Design

The application works beautifully on:
- Desktop computers
- Tablets
- Mobile phones

## 🎬 Demo Features

- ✅ Password creation on first use
- ✅ Beautiful animations throughout
- ✅ Dark and light themes
- ✅ Complete job tracking workflow
- ✅ Activity logging with timestamps
- ✅ AI-powered summaries
- ✅ Search functionality
- ✅ Statistics dashboard

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - feel free to use this project for your job search!

---

**Happy Job Hunting! 🎯**
