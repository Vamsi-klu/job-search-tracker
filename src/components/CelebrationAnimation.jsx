import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Star, Award, Trophy, PartyPopper } from 'lucide-react'
import { useEffect, useState } from 'react'

const CelebrationAnimation = ({ show, onComplete }) => {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (show) {
      // Generate random particles for graffiti effect
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        delay: Math.random() * 0.3,
        color: ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)]
      }))
      setParticles(newParticles)

      // Auto complete after animation
      const timer = setTimeout(() => {
        onComplete?.()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {/* Graffiti-style particles */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{
                  x: window.innerWidth / 2,
                  y: window.innerHeight / 2,
                  scale: 0,
                  rotate: 0,
                  opacity: 1
                }}
                animate={{
                  x: particle.x,
                  y: particle.y,
                  scale: particle.scale,
                  rotate: particle.rotation,
                  opacity: 0
                }}
                transition={{
                  duration: 2,
                  delay: particle.delay,
                  ease: "easeOut"
                }}
                className="absolute"
              >
                {particle.id % 5 === 0 ? (
                  <Star className="w-6 h-6" style={{ color: particle.color }} fill={particle.color} />
                ) : particle.id % 5 === 1 ? (
                  <Sparkles className="w-6 h-6" style={{ color: particle.color }} />
                ) : particle.id % 5 === 2 ? (
                  <Award className="w-6 h-6" style={{ color: particle.color }} />
                ) : particle.id % 5 === 3 ? (
                  <Trophy className="w-6 h-6" style={{ color: particle.color }} />
                ) : (
                  <PartyPopper className="w-6 h-6" style={{ color: particle.color }} />
                )}
              </motion.div>
            ))}

            {/* Center explosion effect */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 blur-xl" />
            </motion.div>

            {/* Success text */}
            <motion.div
              initial={{ scale: 0, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: "spring",
                damping: 10,
                stiffness: 100,
                delay: 0.2
              }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl border-4 border-white">
                <motion.div
                  animate={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="flex items-center space-x-3"
                >
                  <Trophy className="w-8 h-8" />
                  <span className="text-2xl font-bold">SUCCESS!</span>
                  <Trophy className="w-8 h-8" />
                </motion.div>
              </div>
            </motion.div>

            {/* Graffiti spray paint effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.8, 0], scale: [0, 1.5, 2, 2.5] }}
              transition={{ duration: 2, times: [0, 0.3, 0.6, 1] }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <svg width="400" height="400" viewBox="0 0 400 400" className="opacity-20">
                <motion.circle
                  cx="200"
                  cy="200"
                  r="150"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="20"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CelebrationAnimation
