import { motion } from 'framer-motion'
import { X, Clock, TrendingUp, Edit, Trash2, Plus } from 'lucide-react'

const ActivityLog = ({ logs, jobs, onClose, theme }) => {
  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
        return <Plus className="w-4 h-4" />
      case 'updated':
        return <Edit className="w-4 h-4" />
      case 'deleted':
        return <Trash2 className="w-4 h-4" />
      case 'status_update':
        return <TrendingUp className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'created':
        return 'bg-green-500'
      case 'updated':
        return 'bg-blue-500'
      case 'deleted':
        return 'bg-red-500'
      case 'status_update':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
      data-testid="activity-log-overlay"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`${
          theme === 'dark' ? 'bg-dark-card' : 'bg-white'
        } rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col`}
        data-testid="activity-log-modal"
      >
        {/* Header */}
        <div className={`${
          theme === 'dark' ? 'bg-dark-card' : 'bg-white'
        } border-b ${
          theme === 'dark' ? 'border-dark-border' : 'border-light-border'
        } p-6 flex items-center justify-between`}>
          <div>
            <h2 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-dark-text' : 'text-light-text'
            }`}>
              Activity Logs
            </h2>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
            }`}>
              {logs.length} total activities
            </p>
          </div>
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

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          {logs.length === 0 ? (
            <div className={`text-center py-12 ${
              theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
            }`}>
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No activity logs yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                  data-testid={`activity-log-entry-${log.id}`}
                >
                  {/* Timeline line */}
                  {index !== logs.length - 1 && (
                    <div className={`absolute left-4 top-12 bottom-0 w-0.5 ${
                      theme === 'dark' ? 'bg-dark-border' : 'bg-light-border'
                    }`} />
                  )}

                  <div className="flex space-x-4">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`${getActionColor(log.action)} w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 z-10`}
                    >
                      {getActionIcon(log.action)}
                    </motion.div>

                    {/* Content */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`flex-1 ${
                        theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'
                      } rounded-lg p-4`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className={`font-semibold ${
                            theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                          }`}>
                            {log.jobTitle} at {log.company}
                          </h4>
                          <p className={`text-sm ${
                            theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
                          }`}>
                            {log.details}
                          </p>
                          {log.metadata && (
                            <div className={`mt-2 text-xs flex flex-wrap gap-2 ${
                              theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
                            }`}>
                              {Object.entries(log.metadata).map(([key, value]) => (
                                <span
                                  key={key}
                                  className={`px-2 py-0.5 rounded-full ${
                                    theme === 'dark' ? 'bg-dark-card' : 'bg-white/70'
                                  } border ${
                                    theme === 'dark' ? 'border-dark-border' : 'border-light-border'
                                  } text-left break-words`}
                                >
                                  <strong className="mr-1">{key}:</strong>
                                  {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className={`text-xs ${
                          theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
                        } ml-2 whitespace-nowrap`}>
                          {formatDate(log.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className={`${
                          theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
                        }`}>
                          by {log.username}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          theme === 'dark' ? 'bg-dark-card' : 'bg-white'
                        } ${
                          theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
                        }`}>
                          {log.action.replace('_', ' ')}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className={`${
          theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'
        } border-t ${
          theme === 'dark' ? 'border-dark-border' : 'border-light-border'
        } p-4`}>
          <div className="grid grid-cols-4 gap-4 text-center">
            {['created', 'updated', 'deleted', 'status_update'].map(action => {
              const count = logs.filter(log => log.action === action).length
              return (
                <motion.div
                  key={action}
                  whileHover={{ scale: 1.05 }}
                  className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-dark-card' : 'bg-white'
                  }`}
                >
                  <div className={`${getActionColor(action)} w-8 h-8 rounded-full flex items-center justify-center text-white mx-auto mb-2`}>
                    {getActionIcon(action)}
                  </div>
                  <p className={`text-xl font-bold ${
                    theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                  }`}>
                    {count}
                  </p>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
                  }`}>
                    {action.replace('_', ' ')}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ActivityLog
