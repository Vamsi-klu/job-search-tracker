import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

const JobForm = ({ job, onSave, onClose, theme }) => {
  const [formData, setFormData] = useState(job || {
    company: '',
    recruiterName: '',
    position: '',
    recruiterScreen: 'Not Started',
    technicalScreen: 'Not Started',
    onsiteRound1: 'Not Started',
    onsiteRound2: 'Not Started',
    onsiteRound3: 'Not Started',
    onsiteRound4: 'Not Started',
    decision: 'Pending',
    notes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`${
          theme === 'dark' ? 'bg-dark-card' : 'bg-white'
        } rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className={`sticky top-0 ${
          theme === 'dark' ? 'bg-dark-card' : 'bg-white'
        } border-b ${
          theme === 'dark' ? 'border-dark-border' : 'border-light-border'
        } p-6 flex items-center justify-between`}>
          <h2 className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-dark-text' : 'text-light-text'
          }`}>
            {job ? 'Edit Job Application' : 'Add New Job Application'}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`p-2 rounded-lg ${
              theme === 'dark' ? 'hover:bg-dark-border' : 'hover:bg-light-border'
            } transition-colors`}
          >
            <X className={theme === 'dark' ? 'text-dark-text' : 'text-light-text'} />
          </motion.button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                theme === 'dark' ? 'text-dark-text' : 'text-light-text'
              }`}>
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-dark-bg text-dark-text border-dark-border'
                    : 'bg-light-bg text-light-text border-light-border'
                } border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                theme === 'dark' ? 'text-dark-text' : 'text-light-text'
              }`}>
                Position *
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-dark-bg text-dark-text border-dark-border'
                    : 'bg-light-bg text-light-text border-light-border'
                } border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                placeholder="Enter position"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              theme === 'dark' ? 'text-dark-text' : 'text-light-text'
            }`}>
              Recruiter Name *
            </label>
            <input
              type="text"
              required
              value={formData.recruiterName}
              onChange={(e) => handleChange('recruiterName', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg ${
                theme === 'dark'
                  ? 'bg-dark-bg text-dark-text border-dark-border'
                  : 'bg-light-bg text-light-text border-light-border'
              } border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
              placeholder="Enter recruiter name"
            />
          </div>

          {/* Interview Stages */}
          <div className="space-y-4">
            <h3 className={`text-lg font-bold ${
              theme === 'dark' ? 'text-dark-text' : 'text-light-text'
            }`}>
              Interview Stages
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                }`}>
                  Recruiter Screen
                </label>
                <select
                  value={formData.recruiterScreen}
                  onChange={(e) => handleChange('recruiterScreen', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg ${
                    theme === 'dark'
                      ? 'bg-dark-bg text-dark-text border-dark-border'
                      : 'bg-light-bg text-light-text border-light-border'
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                >
                  {['Not Started', 'In Progress', 'Completed', 'Rejected'].map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                }`}>
                  Technical Screen
                </label>
                <select
                  value={formData.technicalScreen}
                  onChange={(e) => handleChange('technicalScreen', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg ${
                    theme === 'dark'
                      ? 'bg-dark-bg text-dark-text border-dark-border'
                      : 'bg-light-bg text-light-text border-light-border'
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                >
                  {['Not Started', 'In Progress', 'Completed', 'Rejected'].map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 ${
                theme === 'dark' ? 'text-dark-text' : 'text-light-text'
              }`}>
                On-site Rounds
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(num => (
                  <div key={num}>
                    <label className={`block text-xs mb-1 ${
                      theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
                    }`}>
                      Round {num}
                    </label>
                    <select
                      value={formData[`onsiteRound${num}`]}
                      onChange={(e) => handleChange(`onsiteRound${num}`, e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${
                        theme === 'dark'
                          ? 'bg-dark-bg text-dark-text border-dark-border'
                          : 'bg-light-bg text-light-text border-light-border'
                      } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    >
                      {['Not Started', 'Scheduled', 'Completed', 'Passed', 'Failed'].map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                theme === 'dark' ? 'text-dark-text' : 'text-light-text'
              }`}>
                Final Decision
              </label>
              <select
                value={formData.decision}
                onChange={(e) => handleChange('decision', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-dark-bg text-dark-text border-dark-border'
                    : 'bg-light-bg text-light-text border-light-border'
                } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                {['Pending', 'Offer Extended', 'Accepted', 'Rejected', 'Declined'].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              theme === 'dark' ? 'text-dark-text' : 'text-light-text'
            }`}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className={`w-full px-4 py-3 rounded-lg ${
                theme === 'dark'
                  ? 'bg-dark-bg text-dark-text border-dark-border'
                  : 'bg-light-bg text-light-text border-light-border'
              } border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none`}
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              {job ? 'Update Job' : 'Add Job'}
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className={`flex-1 ${
                theme === 'dark'
                  ? 'bg-dark-border text-dark-text'
                  : 'bg-light-border text-light-text'
              } py-3 rounded-lg font-semibold transition-all`}
            >
              Cancel
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default JobForm
