import { motion } from 'framer-motion'
import { Building2, User, Briefcase, Edit, Trash2, CheckCircle, Circle, Clock } from 'lucide-react'

const statusOptions = ['Not Started', 'In Progress', 'Completed', 'Rejected']
const roundOptions = ['Not Started', 'Scheduled', 'Completed', 'Passed', 'Failed']

const JobCard = ({ job, index, onEdit, onDelete, onUpdateStatus, theme }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Passed':
        return 'text-green-500'
      case 'In Progress':
      case 'Scheduled':
        return 'text-yellow-500'
      case 'Rejected':
      case 'Failed':
        return 'text-red-500'
      default:
        return theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
      case 'Passed':
        return <CheckCircle className="w-4 h-4" />
      case 'In Progress':
      case 'Scheduled':
        return <Clock className="w-4 h-4" />
      default:
        return <Circle className="w-4 h-4" />
    }
  }

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
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Edit className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(job.id)}
            className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Recruiter Info */}
      <div className={`flex items-center space-x-2 mb-4 ${
        theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
      }`}>
        <User className="w-4 h-4" />
        <span>Recruiter: {job.recruiterName}</span>
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
            <span className={`flex items-center space-x-1 text-sm ${getStatusColor(job.recruiterScreen)}`}>
              {getStatusIcon(job.recruiterScreen)}
              <span>{job.recruiterScreen}</span>
            </span>
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
            <span className={`flex items-center space-x-1 text-sm ${getStatusColor(job.technicalScreen)}`}>
              {getStatusIcon(job.technicalScreen)}
              <span>{job.technicalScreen}</span>
            </span>
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
              <div key={round} className="flex items-center justify-between">
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
                }`}>
                  Round {idx + 1}
                </span>
                <select
                  value={job[round]}
                  onChange={(e) => onUpdateStatus(job.id, round, e.target.value)}
                  className={`px-2 py-1 rounded text-xs ${
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
            <span className={`flex items-center space-x-1 text-sm ${getStatusColor(job.decision)}`}>
              {getStatusIcon(job.decision)}
              <span>{job.decision}</span>
            </span>
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
      {job.notes && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-4 p-3 rounded-lg ${
            theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'
          }`}
        >
          <p className={`text-sm ${
            theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
          }`}>
            <span className="font-semibold">Notes:</span> {job.notes}
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default JobCard
