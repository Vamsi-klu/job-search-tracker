import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const user = localStorage.getItem('jobTracker_user')
    if (user) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('jobTracker_user')
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            <Auth key="auth" onAuthenticated={() => setIsAuthenticated(true)} />
          ) : (
            <Dashboard key="dashboard" onLogout={handleLogout} />
          )}
        </AnimatePresence>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
