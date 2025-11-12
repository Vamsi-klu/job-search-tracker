import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import { ThemeProvider } from './contexts/ThemeContext'
import { authAPI } from './services/api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated (has valid token)
    const hasToken = authAPI.isAuthenticated()
    if (hasToken) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)

    // Listen for auth:required event (dispatched on 401 responses)
    const handleAuthRequired = () => {
      setIsAuthenticated(false)
    }

    window.addEventListener('auth:required', handleAuthRequired)

    return () => {
      window.removeEventListener('auth:required', handleAuthRequired)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsAuthenticated(false)
    }
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
    <ThemeProvider>
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <Auth key="auth" onAuthenticated={() => setIsAuthenticated(true)} />
        ) : (
          <Dashboard key="dashboard" onLogout={handleLogout} />
        )}
      </AnimatePresence>
    </ThemeProvider>
  )
}

export default App
