import { motion, AnimatePresence } from 'framer-motion'
import { ThumbsDown, X, CloudRain, Frown } from 'lucide-react'
import { useEffect, useState } from 'react'

const DisappointmentAnimation = ({ show, onComplete }) => {
  const [raindrops, setRaindrops] = useState([])

  useEffect(() => {
    if (show) {
      // Generate raindrops for disappointment effect
      const newRaindrops = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        delay: Math.random() * 0.5,
        duration: Math.random() * 1 + 1.5
      }))
      setRaindrops(newRaindrops)

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50"
        >
          {/* Dark overlay with subtle animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900"
          />

          {/* Falling rain effect */}
          {raindrops.map((drop) => (
            <motion.div
              key={drop.id}
              initial={{ y: -20, x: drop.x, opacity: 0.6 }}
              animate={{ y: window.innerHeight + 20, opacity: 0 }}
              transition={{
                duration: drop.duration,
                delay: drop.delay,
                ease: "linear"
              }}
              className="absolute w-1 h-8 bg-gradient-to-b from-blue-400 to-transparent"
            />
          ))}

          {/* Floating X marks */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`x-${i}`}
              initial={{
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                scale: 0,
                rotate: 0,
                opacity: 1
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: Math.random() * 0.5 + 0.5,
                rotate: Math.random() * 360,
                opacity: 0
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                ease: "easeOut"
              }}
              className="absolute"
            >
              <X className="w-8 h-8 text-red-500" strokeWidth={3} />
            </motion.div>
          ))}

          {/* Center thumbs down */}
          <motion.div
            initial={{ scale: 0, rotate: 180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 100,
              delay: 0.2
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-2xl shadow-2xl border-4 border-white">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: 3 }}
                className="flex items-center space-x-3"
              >
                <ThumbsDown className="w-8 h-8" />
                <span className="text-2xl font-bold">NOT THIS TIME</span>
                <Frown className="w-8 h-8" />
              </motion.div>
            </div>
          </motion.div>

          {/* Pulsing sad face */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.3, 0] }}
            transition={{ duration: 2, times: [0, 0.5, 1] }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-64 h-64 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 blur-2xl" />
          </motion.div>

          {/* Cloud with rain */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 100, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.5, times: [0, 0.2, 0.8, 1] }}
            className="absolute top-1/4 left-1/2 transform -translate-x-1/2"
          >
            <CloudRain className="w-24 h-24 text-gray-400" />
          </motion.div>

          {/* Shaking effect for emphasis */}
          <motion.div
            animate={{ x: [-5, 5, -5, 5, 0] }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="absolute inset-0"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default DisappointmentAnimation
