import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Chip } from './ui.jsx'
import { ROLE_META } from '../lib/assign.js'

const HOLD_MS = 800

// Order the briefing so the host reads the dangerous roles first.
const GROUPS = [
  { role: 'impostor', one: 'Werewolf', many: 'Werewolves' },
  { role: 'doctor', one: 'Doctor', many: 'Doctors' },
  { role: 'detective', one: 'Detective', many: 'Detectives' },
  { role: 'crewmate', one: 'Villager', many: 'Villagers' },
]

// ─────────────────────────────────────────────────────────────
// The who's-who list, grouped by role. Pure display.
// ─────────────────────────────────────────────────────────────
export function HostRolePanel({ players }) {
  return (
    <div className="space-y-4">
      {GROUPS.map(({ role, one, many }) => {
        const members = players.filter((p) => p.role === role)
        if (members.length === 0) return null
        const meta = ROLE_META[role]
        return (
          <section key={role}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="grid h-6 w-6 place-items-center rounded-full text-sm font-display"
                style={{ background: meta.color, color: 'var(--void)' }}
              >
                {meta.icon}
              </span>
              <p
                className="font-display text-lg tracking-wide"
                style={{ color: meta.color }}
              >
                {members.length > 1 ? `${many} · ${members.length}` : one}
              </p>
            </div>
            <ul className="space-y-2">
              {members.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                  style={{
                    borderColor: `${meta.color}55`,
                    background: `${meta.color}12`,
                  }}
                >
                  <Chip color={p.color} size={32} />
                  <span className="flex-1 truncate text-vapor">{p.name}</span>
                  <span
                    className="flex items-center gap-1 text-sm font-medium"
                    style={{ color: meta.color }}
                  >
                    {meta.icon} {meta.label}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

// A deliberate press-and-hold so a peek can never fire from a stray tap while
// the phone changes hands.
function HoldButton({ onComplete, label = 'Hold to reveal roles' }) {
  const [holding, setHolding] = useState(false)
  const timer = useRef(null)

  const start = (e) => {
    if (e.button != null && e.button !== 0) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setHolding(true)
    timer.current = setTimeout(() => {
      onComplete()
      if (navigator.vibrate) navigator.vibrate(12)
    }, HOLD_MS)
  }
  const end = () => {
    clearTimeout(timer.current)
    setHolding(false)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <button
      onPointerDown={start}
      onPointerUp={end}
      onPointerLeave={end}
      onPointerCancel={end}
      className="relative min-h-tap w-full select-none touch-none overflow-hidden rounded-xl border border-signal bg-signal/10 px-5 py-4 text-signal"
    >
      <span className="relative z-10">
        {holding ? 'Keep holding…' : label}
      </span>
      <motion.span
        className="absolute inset-y-0 left-0 z-0 bg-signal/25"
        initial={{ width: 0 }}
        animate={{ width: holding ? '100%' : 0 }}
        transition={{ duration: holding ? HOLD_MS / 1000 : 0.12, ease: 'linear' }}
      />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// Gated reveal: a "pass it to the host" cover that unlocks (on hold) into the
// role panel. Reused by the post-reveal step and the in-game peek.
// ─────────────────────────────────────────────────────────────
export function HostRolesReveal({
  players,
  continueLabel,
  onContinue,
  onCancel,
  cancelLabel = 'Not now',
}) {
  const [unlocked, setUnlocked] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <AnimatePresence mode="wait">
        {!unlocked ? (
          // ── Hand-over cover ──
          <motion.div
            key="cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center px-6 text-center"
          >
            <motion.div
              className="mb-6 grid h-24 w-24 place-items-center rounded-2xl border-2 border-strut bg-hull"
              animate={{
                boxShadow: [
                  '0 0 0px var(--signal)',
                  '0 0 28px -6px var(--signal)',
                  '0 0 0px var(--signal)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-4xl">🔒</span>
            </motion.div>
            <p className="font-display text-4xl tracking-wide text-vapor">
              Pass it back to the host
            </p>
            <p className="mx-auto mt-2 max-w-xs text-vapor/55">
              Everyone's seen their own role. This next screen shows{' '}
              <span className="text-vapor">every</span> role — for the host's eyes
              only. Don't let players see it.
            </p>

            <div className="mt-8 w-full max-w-xs space-y-3">
              <HoldButton onComplete={() => setUnlocked(true)} />
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="min-h-tap w-full text-sm text-vapor/45 hover:text-vapor/80"
                >
                  {cancelLabel}
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          // ── Unlocked panel ──
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex items-center justify-between px-4 pb-2 pt-1">
              <div>
                <p className="font-display text-2xl tracking-wide text-vapor">
                  Who's who
                </p>
                <p className="text-xs text-breach/80">
                  Host only — keep this private.
                </p>
              </div>
              <button
                onClick={() => setUnlocked(false)}
                className="min-h-tap rounded-lg px-3 text-sm text-vapor/50 hover:text-vapor"
              >
                Hide
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              <HostRolePanel players={players} />
            </div>

            <div className="safe-bottom px-4 pt-3">
              <Button variant="signal" full className="text-lg" onClick={onContinue}>
                {continueLabel}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// A full-screen overlay wrapper for peeking mid-game (In Game screen).
export function HostPeekOverlay({ players, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-void"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="mx-auto h-full w-full max-w-app">
          <HostRolesReveal
            players={players}
            continueLabel="Hide roles — back to the game"
            onContinue={onClose}
            onCancel={onClose}
            cancelLabel="Close"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
