import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button, Chip } from '../ui.jsx'
import { ROLE_META } from '../../lib/assign.js'

const HOLD_MS = 800

// Press-and-hold gauge → flips the card to the role → releasing flips it back.
function HoldCard({ player, partnerName, onSeen }) {
  const reduce = useReducedMotion()
  const [holding, setHolding] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const timer = useRef(null)
  const meta = ROLE_META[player.role] ?? ROLE_META.crewmate

  const start = (e) => {
    // Ignore secondary buttons; keep the gesture on this element.
    if (e.button != null && e.button !== 0) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setHolding(true)
    timer.current = setTimeout(() => {
      setRevealed(true)
      onSeen()
      if (navigator.vibrate) navigator.vibrate(12)
    }, HOLD_MS)
  }
  const end = () => {
    clearTimeout(timer.current)
    setHolding(false)
    setRevealed(false)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div className="grid place-items-center">
      <div
        className="relative select-none touch-none"
        style={{ width: 264, height: 360, perspective: 1200 }}
        onPointerDown={start}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
        role="button"
        tabIndex={0}
        aria-label={`Hold to reveal ${player.name}'s role`}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            setRevealed(true)
            onSeen()
          }
        }}
        onKeyUp={() => setRevealed(false)}
      >
        <motion.div
          className="relative h-full w-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: revealed ? 180 : 0 }}
          transition={
            reduce
              ? { duration: 0.12 }
              : { type: 'spring', stiffness: 260, damping: 26 }
          }
        >
          {/* FRONT — sealed */}
          <div
            className="absolute inset-0 grid place-items-center rounded-3xl border-2 border-strut bg-hull p-6 text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="hull-grid absolute inset-0 rounded-3xl" />
            <div className="relative">
              <Chip color={player.color} size={64} />
              <p className="mt-4 font-display text-3xl tracking-wide text-vapor">
                {player.name}
              </p>
              <p className="mt-6 text-sm text-vapor/60">
                {holding ? 'Keep holding…' : 'Press and hold to reveal'}
              </p>
              {/* Hold gauge */}
              <div className="mx-auto mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-strut">
                <motion.div
                  className="h-full rounded-full bg-signal"
                  initial={{ width: 0 }}
                  animate={{ width: holding && !revealed ? '100%' : 0 }}
                  transition={{
                    duration: holding && !revealed ? HOLD_MS / 1000 : 0.12,
                    ease: 'linear',
                  }}
                />
              </div>
            </div>
          </div>

          {/* BACK — role */}
          <div
            className="absolute inset-0 grid place-items-center rounded-3xl border-2 p-6 text-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderColor: meta.color,
              background: 'var(--hull)',
              boxShadow: `inset 0 0 60px -20px ${meta.color}`,
            }}
          >
            <div>
              <div
                className="mx-auto grid h-20 w-20 place-items-center rounded-full font-display text-4xl"
                style={{ background: meta.color, color: 'var(--void)' }}
              >
                {meta.icon}
              </div>
              <p
                className="mt-4 font-display text-4xl tracking-wide"
                style={{ color: meta.color }}
              >
                {meta.label}
              </p>
              <p className="mx-auto mt-3 max-w-[210px] text-sm text-vapor/80">
                {meta.blurb}
              </p>
              {player.role === 'impostor' && partnerName && (
                <p className="mt-3 rounded-lg bg-breach/15 px-3 py-2 text-sm text-breach">
                  Your fellow Impostor is{' '}
                  <span className="font-semibold">{partnerName}</span>.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <p className="mt-5 h-5 text-sm text-vapor/40">
        {revealed ? 'Release to hide' : ''}
      </p>
    </div>
  )
}

export default function Reveal({ state, dispatch }) {
  const { players, revealIndex, partner } = state
  const player = players[revealIndex]
  // 'cover' = the between-players interstitial (no role on screen while the
  // phone is in the air); 'card' = the sealed hold-to-reveal card.
  const [mode, setMode] = useState('cover')

  useEffect(() => {
    setMode('cover')
  }, [revealIndex])

  if (!player) return null

  const isLast = revealIndex === players.length - 1

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top px-4 pb-1 pt-3 text-center">
        <p className="text-sm text-vapor/40">
          Player {revealIndex + 1} of {players.length}
        </p>
      </header>

      <div className="relative flex-1">
        <AnimatePresence mode="wait">
          {mode === 'cover' ? (
            // ── Hide screen / pass interstitial ──
            <motion.button
              key={`cover-${revealIndex}`}
              onClick={() => setMode('card')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 grid place-items-center px-6 text-center"
            >
              <div>
                <motion.div
                  className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-2xl border-2 border-strut bg-hull"
                  animate={{ boxShadow: ['0 0 0px var(--signal)', '0 0 28px -6px var(--signal)', '0 0 0px var(--signal)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-4xl">📟</span>
                </motion.div>
                <p className="text-lg text-vapor/60">Pass the phone to</p>
                <p className="my-1 font-display text-5xl tracking-wide text-vapor">
                  {player.name}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-signal/40 px-5 py-2.5 text-signal">
                  Tap when {player.name} is holding it
                </div>
              </div>
            </motion.button>
          ) : (
            // ── Sealed card ──
            <motion.div
              key={`card-${revealIndex}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-4"
            >
              <HoldCard
                player={player}
                partnerName={partner[player.id]}
                onSeen={() => dispatch({ type: 'MARK_SEEN' })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Advance — only on the card, never a back button */}
      <div className="safe-bottom px-4 pt-2">
        {mode === 'card' && (
          <Button
            variant="signal"
            full
            className="text-lg"
            onClick={() => dispatch({ type: 'NEXT_REVEAL' })}
          >
            {isLast ? "Everyone's in — start the round" : 'Got it — pass it on'}
          </Button>
        )}
      </div>
    </div>
  )
}
