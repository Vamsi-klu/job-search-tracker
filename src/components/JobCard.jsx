import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, User, Briefcase, Edit, Trash2, CheckCircle, Circle, Clock, FileText } from 'lucide-react'

const statusOptions = ['Not Started', 'In Progress', 'Completed', 'Rejected']
const roundOptions = ['Not Started', 'Scheduled', 'Completed', 'Passed', 'Failed']

const successStates = new Set(['Completed', 'Passed', 'Offer Extended', 'Accepted'])
const dangerStates = new Set(['Rejected', 'Failed', 'Declined'])
const progressStates = new Set(['In Progress', 'Scheduled', 'Pending', 'Offer Extended'])

const statusClasses = {
  success: 'text-green-600 border-green-500/40 bg-green-500/10 shadow-[0_0_18px_rgba(34,197,94,0.2)]',
  danger: 'text-red-600 border-red-500/40 bg-red-500/10 shadow-[0_0_16px_rgba(239,68,68,0.25)]',
  progress: 'text-amber-600 border-amber-500/40 bg-amber-500/10',
  neutral: 'text-slate-500 border-slate-500/30 bg-slate-500/10'
}

const statusMotionMap = {
  success: {
    animateExtras: {
      scale: [0.95, 1.1, 1],
      boxShadow: [
        '0 0 0 rgba(34,197,94,0)',
        '0 0 25px rgba(34,197,94,0.35)',
        '0 0 0 rgba(34,197,94,0)'
      ]
    },
    transition: { duration: 0.9 }
  },
  danger: {
    animateExtras: {
      x: [0, -4, 4, -2, 2, 0]
    },
    transition: { duration: 0.6 }
  },
  progress: {
    animateExtras: {
      opacity: [1, 0.6, 1]
    },
    transition: { duration: 0.9 }
  },
  neutral: {
    animateExtras: {},
    transition: { duration: 0.4 }
  }
}

const getStatusMood = (status = '') => {
  if (successStates.has(status)) return 'success'
  if (dangerStates.has(status)) return 'danger'
  if (progressStates.has(status)) return 'progress'
  return 'neutral'
}

const renderStatusIcon = (status) => {
  switch (status) {
    case 'Completed':
    case 'Passed':
    case 'Accepted':
    case 'Offer Extended':
      return <CheckCircle className="w-4 h-4" />
    case 'In Progress':
    case 'Scheduled':
    case 'Pending':
      return <Clock className="w-4 h-4" />
    case 'Rejected':
    case 'Failed':
    case 'Declined':
      return <Circle className="w-4 h-4" />
    default:
      return <Circle className="w-4 h-4" />
  }
}

const StatusPill = ({ value, size = 'md' }) => {
  const mood = getStatusMood(value)
  const classes = statusClasses[mood]
  const motionConfig = statusMotionMap[mood] || statusMotionMap.neutral
  const animateExtras = motionConfig.animateExtras
  const transitionExtras = motionConfig.transition
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : 'px-3 py-1 text-xs'
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value || 'unknown'}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          ...animateExtras
        }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{
          duration: 0.6,
          ease: 'easeOut',
          ...transitionExtras
        }}
        className={`flex items-center space-x-1 font-semibold rounded-full border ${sizeClasses} ${classes}`}
      >
        {renderStatusIcon(value)}
        <span>{value}</span>
      </motion.span>
    </AnimatePresence>
  )
}

const JobCard = ({ job, index, onEdit, onDelete, onUpdateStatus, theme }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className={`${
        theme === 'dark' ? 'bg-dark-card' : 'bg-white'
      } rounded-xl p-6 shadow-lg border ${
        theme === 'dark' ? 'border-dark-border' : 'border-light-border'
      } hover:shadow-xl transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <motion.h3
            whileHover={{ scale: 1.02 }}
            className={`text-xl font-bold mb-1 ${
              theme === 'dark' ? 'text-dark-text' : 'text-light-text'
            }`}
          >
            {job.position}
          </motion.h3>
          <div className="flex items-center space-x-2 text-purple-600">
            <Building2 className="w-4 h-4" />
            <span className="font-semibold">{job.company}</span>
          </div>
        </div>

      <div className="flex space-x-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onEdit(job)}
          aria-label="Edit job"
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          <Edit className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(job.id)}
          aria-label="Delete job"
          className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
      </div>

      {/* People Info */}
      <div className="mb-4 space-y-2 text-sm">
        <div className={`flex items-center space-x-2 ${
          theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
        }`}>
          <User className="w-4 h-4" />
          <span>Recruiter: {job.recruiterName || '—'}</span>
        </div>
        {job.hiringManager && (
          <div className={`flex items-center space-x-2 ${
            theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
          }`}>
            <Briefcase className="w-4 h-4" />
            <span>Hiring Manager: {job.hiringManager}</span>
          </div>
        )}
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {/* Recruiter Screen */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`p-3 rounded-lg ${
            theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${
              theme === 'dark' ? 'text-dark-text' : 'text-light-text'
            }`}>
              Recruiter Screen
            </span>
            <StatusPill value={job.recruiterScreen} />
          </div>
          <select
            value={job.recruiterScreen}
            onChange={(e) => onUpdateStatus(job.id, 'recruiterScreen', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg text-sm ${
              theme === 'dark'
                ? 'bg-dark-card text-dark-text border-dark-border'
                : 'bg-white text-light-text border-light-border'
            } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </motion.div>

        {/* Technical Screen */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`p-3 rounded-lg ${
            theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${
              theme === 'dark' ? 'text-dark-text' : 'text-light-text'
            }`}>
              Technical Screen
            </span>
            <StatusPill value={job.technicalScreen} />
          </div>
          <select
            value={job.technicalScreen}
            onChange={(e) => onUpdateStatus(job.id, 'technicalScreen', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg text-sm ${
              theme === 'dark'
                ? 'bg-dark-card text-dark-text border-dark-border'
                : 'bg-white text-light-text border-light-border'
            } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </motion.div>

        {/* On-site Rounds */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`p-3 rounded-lg ${
            theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'
          }`}
        >
          <div className={`text-sm font-semibold mb-3 ${
            theme === 'dark' ? 'text-dark-text' : 'text-light-text'
          }`}>
            On-site Rounds
          </div>
          <div className="space-y-2">
            {['onsiteRound1', 'onsiteRound2', 'onsiteRound3', 'onsiteRound4'].map((round, idx) => (
              <div key={round} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${
                    theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
                  }`}>
                    Round {idx + 1}
                  </span>
                  <StatusPill value={job[round]} size="sm" />
                </div>
                <select
                  value={job[round]}
                  onChange={(e) => onUpdateStatus(job.id, round, e.target.value)}
                  className={`w-full px-2 py-1 rounded text-xs ${
                    theme === 'dark'
                      ? 'bg-dark-card text-dark-text border-dark-border'
                      : 'bg-white text-light-text border-light-border'
                  } border focus:outline-none focus:ring-1 focus:ring-purple-500`}
                >
                  {roundOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Decision */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`p-3 rounded-lg ${
            theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${
              theme === 'dark' ? 'text-dark-text' : 'text-light-text'
            }`}>
              Final Decision
            </span>
            <StatusPill value={job.decision} />
          </div>
          <select
            value={job.decision}
            onChange={(e) => onUpdateStatus(job.id, 'decision', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg text-sm ${
              theme === 'dark'
                ? 'bg-dark-card text-dark-text border-dark-border'
                : 'bg-white text-light-text border-light-border'
            } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
          >
            {['Pending', 'Offer Extended', 'Accepted', 'Rejected', 'Declined'].map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </motion.div>
      </div>

      {/* Notes */}
      {(job.notes?.trim() || job.hiringManagerNotes?.trim()) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-4 p-4 rounded-lg space-y-3 ${
            theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'
          }`}
        >
          {job.notes?.trim() && (
            <div className="flex space-x-3">
              <FileText className="w-4 h-4 text-purple-500 mt-1" />
              <div>
                <p className="text-xs uppercase tracking-wide text-purple-500 font-semibold">Candidate Notes</p>
                <p className={`text-sm whitespace-pre-line ${
                  theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
                }`}>
                  {job.notes}
                </p>
              </div>
            </div>
          )}
          {job.hiringManagerNotes?.trim() && (
            <div className="flex space-x-3">
              <Briefcase className="w-4 h-4 text-blue-500 mt-1" />
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-500 font-semibold">Hiring Manager Notes</p>
                <p className={`text-sm whitespace-pre-line ${
                  theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
                }`}>
                  {job.hiringManagerNotes}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

export default memo(JobCard)
