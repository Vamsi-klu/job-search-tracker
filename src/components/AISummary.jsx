import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Sparkles, Send, Loader } from 'lucide-react'

const AISummary = ({ logs, jobs, onClose, theme }) => {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const generateSummary = (searchQuery) => {
    setIsLoading(true)

    // Simulate AI processing
    setTimeout(() => {
      const lowerQuery = searchQuery.toLowerCase()

      // Find relevant company
      const companyMatch = jobs.find(job =>
        job.company.toLowerCase().includes(lowerQuery) ||
        lowerQuery.includes(job.company.toLowerCase())
      )

      if (companyMatch) {
        const companyLogs = logs.filter(log =>
          log.company.toLowerCase() === companyMatch.company.toLowerCase()
        )

        let summary = `## Summary for ${companyMatch.company}\n\n`
        summary += `**Position:** ${companyMatch.position}\n`
        summary += `**Recruiter:** ${companyMatch.recruiterName}\n\n`
        summary += `### Current Status\n`
        summary += `- **Recruiter Screen:** ${companyMatch.recruiterScreen}\n`
        summary += `- **Technical Screen:** ${companyMatch.technicalScreen}\n`
        summary += `- **On-site Round 1:** ${companyMatch.onsiteRound1}\n`
        summary += `- **On-site Round 2:** ${companyMatch.onsiteRound2}\n`
        summary += `- **On-site Round 3:** ${companyMatch.onsiteRound3}\n`
        summary += `- **On-site Round 4:** ${companyMatch.onsiteRound4}\n`
        summary += `- **Decision:** ${companyMatch.decision}\n\n`

        if (companyMatch.notes) {
          summary += `### Notes\n${companyMatch.notes}\n\n`
        }

        if (companyLogs.length > 0) {
          summary += `### Recent Activity (${companyLogs.length} updates)\n\n`

          const recentLogs = companyLogs.slice(0, 5)
          recentLogs.forEach((log, idx) => {
            const date = new Date(log.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
            summary += `${idx + 1}. **${date}** - ${log.details}\n`
          })

          if (companyLogs.length > 5) {
            summary += `\n*...and ${companyLogs.length - 5} more updates*\n`
          }

          // Last update
          const lastLog = companyLogs[0]
          const lastUpdateDate = new Date(lastLog.timestamp).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
          summary += `\n### Last Updated\n`
          summary += `${lastUpdateDate} by ${lastLog.username}\n`
          summary += `**Action:** ${lastLog.details}`
        } else {
          summary += `### Activity\nNo updates recorded yet for this application.`
        }

        setResponse(summary)
      } else if (lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
        // General summary
        let summary = `## Overall Job Search Summary\n\n`
        summary += `**Total Applications:** ${jobs.length}\n`
        summary += `**Total Activities:** ${logs.length}\n\n`

        summary += `### Application Status Breakdown\n`
        const statusCounts = {
          'In Progress': jobs.filter(j =>
            j.recruiterScreen === 'In Progress' ||
            j.technicalScreen === 'In Progress'
          ).length,
          'Completed Interviews': jobs.filter(j =>
            j.recruiterScreen === 'Completed' &&
            j.technicalScreen === 'Completed'
          ).length,
          'Rejected': jobs.filter(j =>
            j.decision === 'Rejected'
          ).length,
          'Offers': jobs.filter(j =>
            j.decision === 'Offer Extended' ||
            j.decision === 'Accepted'
          ).length
        }

        Object.entries(statusCounts).forEach(([status, count]) => {
          summary += `- **${status}:** ${count}\n`
        })

        summary += `\n### Recent Companies\n`
        const recentJobs = [...jobs].slice(-5).reverse()
        recentJobs.forEach((job, idx) => {
          summary += `${idx + 1}. **${job.company}** - ${job.position} (${job.decision})\n`
        })

        summary += `\n### Most Active Companies\n`
        const companyCounts = {}
        logs.forEach(log => {
          companyCounts[log.company] = (companyCounts[log.company] || 0) + 1
        })
        const sortedCompanies = Object.entries(companyCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)

        sortedCompanies.forEach(([company, count], idx) => {
          summary += `${idx + 1}. **${company}** - ${count} updates\n`
        })

        setResponse(summary)
      } else {
        setResponse(`I couldn't find specific information about "${searchQuery}".\n\nTry asking:\n- "What's the status for [company name]?"\n- "Give me an overview"\n- "Summary of my applications"\n- "What's the latest on [company name]?"`)
      }

      setIsLoading(false)
    }, 1000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      generateSummary(query)
    }
  }

  const quickQueries = [
    'Give me an overview',
    'What companies am I interviewing with?',
    'Show me recent activity'
  ]

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
        } rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r from-purple-600 to-blue-600 p-6 flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Summary</h2>
              <p className="text-white/80 text-sm">Ask me anything about your job search</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="text-white" />
          </motion.button>
        </div>

        {/* Quick Queries */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <p className={`text-sm mb-2 ${
            theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
          }`}>
            Try these quick queries:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickQueries.map((quickQuery, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setQuery(quickQuery)
                  generateSummary(quickQuery)
                }}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                {quickQuery}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Response Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {response ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'
              } rounded-lg p-6`}
            >
              <div className={`prose prose-sm max-w-none ${
                theme === 'dark' ? 'prose-invert' : ''
              }`}>
                {response.split('\n').map((line, idx) => {
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={idx} className={`text-2xl font-bold mb-4 ${
                        theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                      }`}>
                        {line.replace('## ', '')}
                      </h2>
                    )
                  } else if (line.startsWith('### ')) {
                    return (
                      <h3 key={idx} className={`text-lg font-bold mt-4 mb-2 ${
                        theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                      }`}>
                        {line.replace('### ', '')}
                      </h3>
                    )
                  } else if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={idx} className={`font-semibold ${
                        theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                      }`}>
                        {line.replace(/\*\*/g, '')}
                      </p>
                    )
                  } else if (line.trim()) {
                    // Handle bold text within lines
                    const parts = line.split(/(\*\*.*?\*\*)/)
                    return (
                      <p key={idx} className={`mb-2 ${
                        theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
                      }`}>
                        {parts.map((part, i) =>
                          part.startsWith('**') && part.endsWith('**') ? (
                            <strong key={i} className={
                              theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                            }>
                              {part.replace(/\*\*/g, '')}
                            </strong>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )}
                      </p>
                    )
                  }
                  return null
                })}
              </div>
            </motion.div>
          ) : (
            <div className={`text-center py-12 ${
              theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
            }`}>
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Ask me about your job applications!</p>
              <p className="text-sm mt-2">
                Try: "What's the latest on Google?" or "Give me an overview"
              </p>
            </div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-12"
            >
              <Loader className="w-8 h-8 text-purple-600 animate-spin" />
              <span className="ml-3 text-purple-600">Analyzing your data...</span>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className={`border-t ${
            theme === 'dark' ? 'border-dark-border' : 'border-light-border'
          } p-4`}
        >
          <div className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about a company or get a summary..."
              className={`flex-1 px-4 py-3 rounded-lg ${
                theme === 'dark'
                  ? 'bg-dark-bg text-dark-text border-dark-border'
                  : 'bg-light-bg text-light-text border-light-border'
              } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading || !query.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default AISummary
