import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PartyPopper, ThumbsDown } from 'lucide-react'

const graffitiColors = [
  '#f97316',
  '#facc15',
  '#22d3ee',
  '#c026d3',
  '#84cc16',
  '#f43f5e'
]

const sprayVariants = {
  initial: (index) => ({
    opacity: 0,
    scale: 0.2,
    x: 0,
    y: 0,
    rotate: 0
  }),
  animate: (index) => ({
    opacity: [0, 1, 0],
    scale: [0.2, 1.2, 0.8],
    x: [
      0,
      (Math.random() > 0.5 ? 1 : -1) * (120 + index * 8),
      (Math.random() > 0.5 ? 1 : -1) * (200 + index * 10)
    ],
    y: [
      0,
      (Math.random() > 0.5 ? 1 : -1) * (70 + index * 6),
      (Math.random() > 0.5 ? 1 : -1) * (130 + index * 12)
    ],
    rotate: [0, 45, 90, 180]
  })
}

const SprayLayer = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 14 }).map((_, idx) => (
      <motion.span
        key={idx}
        className="absolute rounded-full blur-lg opacity-80 mix-blend-screen"
        style={{
          width: 24 + Math.random() * 24,
          height: 24 + Math.random() * 24,
          backgroundColor: graffitiColors[idx % graffitiColors.length],
          left: '50%',
          top: '50%'
        }}
        custom={idx}
        variants={sprayVariants}
        initial="initial"
        animate="animate"
        transition={{
          duration: 1.6,
          delay: idx * 0.05,
          ease: 'easeOut'
        }}
      />
    ))}
  </div>
)

const FailureParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 10 }).map((_, idx) => (
      <motion.div
        key={idx}
        className="absolute text-3xl"
        style={{
          left: `${30 + Math.random() * 40}%`,
          top: `${30 + Math.random() * 40}%`
        }}
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{
          opacity: [0, 0.9, 0],
          scale: [0.2, 1, 0.6],
          y: [0, -20 - idx * 2, -40 - idx * 3],
          rotate: [0, -10, 10, 0]
        }}
        transition={{ duration: 1.2, delay: idx * 0.04 }}
      >
        😞
      </motion.div>
    ))}
  </div>
)

export const getOverlayRoot = () => (typeof document !== 'undefined' ? document.body : null)

export default function CelebrationOverlay({ celebration, onClose, theme, portalTarget }) {
  useEffect(() => {
    if (!celebration) return
    const timeout = setTimeout(onClose, celebration.duration || 2500)
    return () => clearTimeout(timeout)
  }, [celebration, onClose])

  const overlayRoot = portalTarget === undefined ? getOverlayRoot() : portalTarget
  if (!overlayRoot) return null

  return createPortal(
    <AnimatePresence>
      {celebration && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`pointer-events-auto relative rounded-2xl px-10 py-8 shadow-2xl border ${
              celebration.type === 'failure'
                ? 'bg-red-900/90 border-red-400'
                : 'bg-gradient-to-br from-purple-700 via-pink-600 to-amber-400 border-white/30'
            }`}
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            {celebration.type === 'failure' ? <FailureParticles /> : <SprayLayer />}
            <div className="relative flex flex-col items-center text-center space-y-4">
              {celebration.type === 'failure' ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.8, 1.1, 1] }}
                  className="bg-red-500/30 rounded-full p-4"
                >
                  <ThumbsDown className="w-12 h-12 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ rotate: -10 }}
                  animate={{ rotate: [ -10, 10, -5, 0 ] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.8 }}
                  className="bg-black/20 rounded-full p-4"
                >
                  <PartyPopper className="w-12 h-12 text-white" />
                </motion.div>
              )}

              <div className="space-y-2">
                <p className="text-2xl font-bold text-white drop-shadow">
                  {celebration.title || (celebration.type === 'failure' ? 'Heads up!' : 'Great news!')}
                </p>
                {celebration.message && (
                  <p className="text-white/90 text-lg max-w-lg">{celebration.message}</p>
                )}
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                aria-label="Dismiss celebration"
                className="mt-4 px-4 py-2 bg-white/20 text-white rounded-full font-semibold border border-white/30 backdrop-blur"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    overlayRoot
  )
}
