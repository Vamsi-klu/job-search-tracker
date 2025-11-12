import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Keyboard } from 'lucide-react'
import { useFocusTrap } from '../hooks/useKeyboardShortcuts'

const KeyboardShortcutsHelp = ({ onClose, theme }) => {
  const modalRef = useRef(null)

  // Trap focus within modal
  useFocusTrap(modalRef, true)

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const shortcuts = [
    { key: 'N', description: 'Add new job application' },
    { key: 'L', description: 'View activity logs' },
    { key: 'A', description: 'Open AI summary' },
    { key: 'T', description: 'Toggle dark/light theme' },
    { key: 'Ctrl/Cmd + K', description: 'Focus search box' },
    { key: 'Esc', description: 'Close modal or dialog' },
    { key: '?', description: 'Show this help menu' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`${
          theme === 'dark' ? 'bg-dark-card' : 'bg-white'
        } rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border ${
          theme === 'dark' ? 'border-dark-border' : 'border-light-border'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-dark-border' : 'border-light-border'
        }`}>
          <div className="flex items-center space-x-3">
            <Keyboard className={`w-6 h-6 ${
              theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
            }`} aria-hidden="true" />
            <h2
              id="shortcuts-title"
              className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-dark-text' : 'text-light-text'
              }`}
            >
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close keyboard shortcuts help"
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-dark-border text-dark-muted hover:text-dark-text'
                : 'hover:bg-light-border text-light-muted hover:text-light-text'
            }`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <p className={`mb-6 ${
            theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
          }`}>
            Use these keyboard shortcuts to navigate the app more efficiently.
          </p>

          <table
            className="w-full"
            role="table"
            aria-label="Keyboard shortcuts reference"
          >
            <thead>
              <tr className={`border-b ${
                theme === 'dark' ? 'border-dark-border' : 'border-light-border'
              }`}>
                <th
                  scope="col"
                  className={`text-left py-3 px-4 font-semibold ${
                    theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                  }`}
                >
                  Shortcut
                </th>
                <th
                  scope="col"
                  className={`text-left py-3 px-4 font-semibold ${
                    theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                  }`}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((shortcut, index) => (
                <tr
                  key={index}
                  className={`border-b ${
                    theme === 'dark' ? 'border-dark-border/50' : 'border-light-border/50'
                  } last:border-0`}
                >
                  <td className="py-4 px-4">
                    <kbd
                      className={`inline-block px-3 py-2 text-sm font-mono rounded-md border ${
                        theme === 'dark'
                          ? 'bg-dark-border text-dark-text border-dark-border'
                          : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                    >
                      {shortcut.key}
                    </kbd>
                  </td>
                  <td className={`py-4 px-4 ${
                    theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                  }`}>
                    {shortcut.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={`mt-6 p-4 rounded-lg ${
            theme === 'dark' ? 'bg-dark-border/50' : 'bg-gray-100'
          }`}>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-dark-muted' : 'text-light-muted'
            }`}>
              <strong>Tip:</strong> These shortcuts work when no modal is open. Press <kbd
                className={`inline px-2 py-1 text-xs font-mono rounded ${
                  theme === 'dark' ? 'bg-dark-border' : 'bg-white'
                }`}
              >?</kbd> anytime to see this help menu.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default KeyboardShortcutsHelp
