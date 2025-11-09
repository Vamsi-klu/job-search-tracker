import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LogOut, Sun, Moon, Sparkles, Search } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import JobCard from './JobCard'
import JobForm from './JobForm'
import ActivityLog from './ActivityLog'
import AISummary from './AISummary'

const Dashboard = ({ onLogout }) => {
  const { theme, toggleTheme } = useTheme()
  const [jobs, setJobs] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [showJobForm, setShowJobForm] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [showLogs, setShowLogs] = useState(false)
  const [showAISummary, setShowAISummary] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Load jobs and logs from localStorage
    const savedJobs = localStorage.getItem('jobTracker_jobs')
    const savedLogs = localStorage.getItem('jobTracker_logs')

    if (savedJobs) {
      setJobs(JSON.parse(savedJobs))
    }
    if (savedLogs) {
      setActivityLogs(JSON.parse(savedLogs))
    }
  }, [])

  const saveJobs = (newJobs) => {
    setJobs(newJobs)
    localStorage.setItem('jobTracker_jobs', JSON.stringify(newJobs))
  }

  const addLog = (action, jobTitle, company, details) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      jobTitle,
      company,
      details,
      username: localStorage.getItem('jobTracker_user')
    }
    const newLogs = [newLog, ...activityLogs]
    setActivityLogs(newLogs)
    localStorage.setItem('jobTracker_logs', JSON.stringify(newLogs))
  }

  const handleAddJob = (jobData) => {
    if (editingJob) {
      const updatedJobs = jobs.map(job =>
        job.id === editingJob.id ? { ...jobData, id: job.id } : job
      )
      saveJobs(updatedJobs)
      addLog('updated', jobData.position, jobData.company, 'Job details updated')
    } else {
      const newJob = { ...jobData, id: Date.now(), createdAt: new Date().toISOString() }
      saveJobs([...jobs, newJob])
      addLog('created', jobData.position, jobData.company, 'New job application added')
    }
    setShowJobForm(false)
    setEditingJob(null)
  }

  const handleEditJob = (job) => {
    setEditingJob(job)
    setShowJobForm(true)
  }

  const handleDeleteJob = (jobId) => {
    const job = jobs.find(j => j.id === jobId)
    const updatedJobs = jobs.filter(j => j.id !== jobId)
    saveJobs(updatedJobs)
    if (job) {
      addLog('deleted', job.position, job.company, 'Job application removed')
    }
  }

  const handleUpdateJobStatus = (jobId, field, value) => {
    const job = jobs.find(j => j.id === jobId)
    const updatedJobs = jobs.map(j =>
      j.id === jobId ? { ...j, [field]: value } : j
    )
    saveJobs(updatedJobs)
    if (job) {
      addLog('status_update', job.position, job.company, `${field} updated to: ${value}`)
    }
  }

  const filteredJobs = jobs.filter(job =>
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.recruiterName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const username = localStorage.getItem('jobTracker_user')

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`${
          theme === 'dark' ? 'bg-dark-card/50' : 'bg-white/50'
        } backdrop-blur-lg border-b ${
          theme === 'dark' ? 'border-dark-border' : 'border-light-border'
        } sticky top-0 z-50`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className={`w-8 h-8 ${
                  theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </motion.div>
              <div>
                <h1 className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                }`}>
                  Job Search Tracker
                </h1>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
                }`}>
                  Welcome, {username}!
                </p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAISummary(true)}
                className={`p-2 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-purple-500 hover:bg-purple-600'
                } text-white transition-colors`}
                title="AI Summary"
              >
                <Sparkles className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-dark-card hover:bg-dark-border'
                    : 'bg-light-card hover:bg-light-border'
                } transition-colors`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-purple-600" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onLogout}
                className={`p-2 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white transition-colors`}
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats and Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${
              theme === 'dark' ? 'bg-dark-card' : 'bg-white'
            } rounded-xl p-6 shadow-lg border ${
              theme === 'dark' ? 'border-dark-border' : 'border-light-border'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-2 ${
              theme === 'dark' ? 'text-dark-text' : 'text-light-text'
            }`}>
              Total Applications
            </h3>
            <p className="text-4xl font-bold text-purple-600">{jobs.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${
              theme === 'dark' ? 'bg-dark-card' : 'bg-white'
            } rounded-xl p-6 shadow-lg border ${
              theme === 'dark' ? 'border-dark-border' : 'border-light-border'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-2 ${
              theme === 'dark' ? 'text-dark-text' : 'text-light-text'
            }`}>
              Activity Logs
            </h3>
            <p className="text-4xl font-bold text-blue-600">{activityLogs.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowJobForm(true)}
              className="w-full h-full bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6 shadow-lg font-semibold text-lg flex items-center justify-center space-x-2"
            >
              <Plus className="w-6 h-6" />
              <span>Add New Job</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
            }`} />
            <input
              type="text"
              placeholder="Search jobs by company, position, or recruiter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-xl ${
                theme === 'dark'
                  ? 'bg-dark-card text-dark-text border-dark-border'
                  : 'bg-white text-light-text border-light-border'
              } border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
            />
          </div>
        </motion.div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AnimatePresence>
            {filteredJobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                index={index}
                onEdit={handleEditJob}
                onDelete={handleDeleteJob}
                onUpdateStatus={handleUpdateJobStatus}
                theme={theme}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredJobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center py-16 ${
              theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
            }`}
          >
            <p className="text-xl">No jobs found. Add your first job application!</p>
          </motion.div>
        )}

        {/* View Logs Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowLogs(true)}
          className={`w-full py-4 rounded-xl font-semibold ${
            theme === 'dark'
              ? 'bg-dark-card hover:bg-dark-border text-dark-text'
              : 'bg-white hover:bg-light-border text-light-text'
          } border ${
            theme === 'dark' ? 'border-dark-border' : 'border-light-border'
          } transition-all`}
        >
          View Activity Logs ({activityLogs.length})
        </motion.button>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showJobForm && (
          <JobForm
            job={editingJob}
            onSave={handleAddJob}
            onClose={() => {
              setShowJobForm(false)
              setEditingJob(null)
            }}
            theme={theme}
          />
        )}

        {showLogs && (
          <ActivityLog
            logs={activityLogs}
            jobs={jobs}
            onClose={() => setShowLogs(false)}
            theme={theme}
          />
        )}

        {showAISummary && (
          <AISummary
            logs={activityLogs}
            jobs={jobs}
            onClose={() => setShowAISummary(false)}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dashboard
