import { motion, useReducedMotion } from 'framer-motion'

// The signature element. Two blast-door panels start closed over the screen,
// then part down the middle — a seam of --signal light glowing between them —
// to reveal the content behind. Used for exactly four moments: entering
// Assigning, each reveal card flip, the "Out" moment, and Game Over.
//
// Reduced motion: no doors, a 120ms crossfade instead.
//
// `tone` tints the seam/edge: 'signal' (default), 'breach', 'triage'.
export default function Airlock({ children, tone = 'signal', onOpened }) {
  const reduce = useReducedMotion()
  const edge = `var(--${tone})`

  if (reduce) {
    return (
      <motion.div
        className="relative h-full w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.12 }}
        onAnimationComplete={onOpened}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {children}

      {/* Left panel */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 z-40 w-1/2"
        style={{
          background:
            'linear-gradient(90deg, var(--void) 0%, var(--hull) 92%, var(--strut) 100%)',
          borderRight: `2px solid ${edge}`,
          boxShadow: `8px 0 40px -8px ${edge}`,
        }}
        initial={{ x: 0 }}
        animate={{ x: '-100%' }}
        transition={{ duration: 0.35, ease: [0.7, 0, 0.3, 1], delay: 0.05 }}
      >
        <div className="hull-grid absolute inset-0" />
      </motion.div>

      {/* Right panel */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 right-0 z-40 w-1/2"
        style={{
          background:
            'linear-gradient(270deg, var(--void) 0%, var(--hull) 92%, var(--strut) 100%)',
          borderLeft: `2px solid ${edge}`,
          boxShadow: `-8px 0 40px -8px ${edge}`,
        }}
        initial={{ x: 0 }}
        animate={{ x: '100%' }}
        transition={{ duration: 0.35, ease: [0.7, 0, 0.3, 1], delay: 0.05 }}
        onAnimationComplete={onOpened}
      >
        <div className="hull-grid absolute inset-0" />
      </motion.div>

      {/* Seam of light where the doors meet, fading as they part */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-1/2 z-50 w-[3px] -translate-x-1/2"
        style={{ background: edge, boxShadow: `0 0 24px 4px ${edge}` }}
        initial={{ opacity: 1, scaleY: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      />
    </div>
  )
}
