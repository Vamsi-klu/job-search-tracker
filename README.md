# 🚀 Job Search Tracker

A beautiful, animated job search tracking application built with React, Vite, Tailwind CSS, and Framer Motion.

## ✨ Features

### 🔐 Authentication System
- First-time password creation
- Secure local authentication
- Username personalization

### 🎨 Beautiful UI with Animations
- **Framer Motion animations** for smooth interactions
- **Dark Theme** and **Light Theme** support
- Glass morphism effects
- Smooth transitions and hover effects
- Responsive design

### 📊 Job Tracking
Track your job applications with detailed fields:
- **Company Name**
- **Recruiter Name**
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

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **LocalStorage** - Data persistence

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
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

All data is stored locally in your browser's localStorage:
- `jobTracker_password` - Your password
- `jobTracker_user` - Your username
- `jobTracker_jobs` - All job applications
- `jobTracker_logs` - Activity logs
- `jobTracker_theme` - Theme preference

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