import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Chip } from '../ui.jsx'
import ConfirmSheet from '../ConfirmSheet.jsx'
import { useTimer } from '../../hooks/useTimer.js'
import { useWakeLock } from '../../hooks/useWakeLock.js'
import { useAudio } from '../../hooks/useAudio.js'

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function Meeting({ state, dispatch }) {
  const { meeting, settings, players } = state
  const { secondsLeft, isPaused, isDone } = useTimer(meeting)
  const { tick, beep, alarm } = useAudio(settings.muted)

  useWakeLock(!isPaused && !isDone) // keep the screen awake while running

  const [confirm, setConfirm] = useState(null)
  const living = players.filter((p) => p.alive)

  // Escalation tier drives color + pulse.
  const tier = secondsLeft > 30 ? 'calm' : secondsLeft > 10 ? 'warn' : 'crit'
  const color =
    tier === 'calm' ? 'var(--signal)' : tier === 'warn' ? 'var(--triage)' : 'var(--breach)'

  // ── Cue engine: fire on second-boundary transitions only ──
  const prev = useRef(secondsLeft)
  useEffect(() => {
    const from = prev.current
    const s = secondsLeft
    if (s !== from) {
      if (s === 30 && from > 30) tick()
      if (s <= 5 && s >= 1 && s < from) beep()
      if (s === 10 && from > 10 && navigator.vibrate) navigator.vibrate(200)
      prev.current = s
    }
  }, [secondsLeft, tick, beep])

  // ── 0:00 takeover: repeating alarm + haptic until dismissed ──
  useEffect(() => {
    if (!isDone) return
    if (navigator.vibrate) navigator.vibrate([300, 120, 300])
    alarm()
    const id = setInterval(alarm, 1300)
    return () => clearInterval(id)
  }, [isDone, alarm])

  // ─────────────────────────────────────────────
  // Time's-up takeover
  // ─────────────────────────────────────────────
  if (isDone) {
    return (
      <div className="grid h-full place-items-center bg-breach/10 px-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <motion.p
            className="font-display text-7xl tracking-wide text-breach"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            TIME'S UP
          </motion.p>
          <p className="mx-auto mt-3 max-w-xs text-lg text-vapor/80">
            Talk it out and decide.
          </p>
          <div className="mt-8">
            <Button
              variant="signal"
              className="text-lg"
              onClick={() => dispatch({ type: 'END_MEETING' })}
            >
              Back to crew
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // Running meeting
  // ─────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* Mute toggle */}
      <header className="safe-top flex items-center justify-between px-4 pb-1 pt-3">
        <p className="text-sm uppercase tracking-widest text-vapor/40">
          Emergency meeting
        </p>
        <button
          onClick={() =>
            dispatch({ type: 'SET_SETTING', key: 'muted', value: !settings.muted })
          }
          aria-label={settings.muted ? 'Unmute' : 'Mute'}
          className="min-h-tap min-w-tap rounded-lg px-3 text-xl"
        >
          {settings.muted ? '🔇' : '🔊'}
        </button>
      </header>

      {/* The clock */}
      <div className="grid flex-1 place-items-center px-4">
        <motion.div
          className="tabular font-display whitespace-nowrap leading-none"
          style={{ color, fontSize: 'clamp(88px, 28vw, 148px)' }}
          animate={
            tier === 'crit'
              ? { scale: [1, 1.08, 1] }
              : tier === 'warn'
                ? { opacity: [1, 0.75, 1] }
                : { scale: 1 }
          }
          transition={
            tier === 'crit'
              ? { duration: 1, repeat: Infinity }
              : tier === 'warn'
                ? { duration: 1, repeat: Infinity }
                : { duration: 0.2 }
          }
        >
          {fmt(secondsLeft)}
        </motion.div>
      </div>

      {/* Compact living roster — still tappable; marking out ends the meeting */}
      <div className="px-4">
        <p className="mb-1 text-xs text-vapor/35">
          Decided early? Tap a name to mark them out.
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {living.map((p) => (
            <button
              key={p.id}
              onClick={() => setConfirm(p)}
              className="flex min-h-tap shrink-0 items-center gap-2 rounded-full border border-strut bg-hull px-3 py-2 active:border-breach/60"
            >
              <Chip color={p.color} size={24} />
              <span className="max-w-28 truncate text-sm text-vapor">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="safe-bottom grid grid-cols-3 gap-2 px-4 pt-2">
        <Button
          variant="ghost"
          onClick={() =>
            dispatch({
              type: isPaused ? 'RESUME_MEETING' : 'PAUSE_MEETING',
              now: Date.now(),
            })
          }
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: 'ADD_30S' })}
        >
          +30s
        </Button>
        <Button
          variant="breach"
          onClick={() => dispatch({ type: 'END_MEETING' })}
        >
          End
        </Button>
      </div>

      <ConfirmSheet
        open={!!confirm}
        player={confirm}
        title={`${confirm?.name} is out?`}
        confirmLabel="Yes, they're out"
        confirmVariant="breach"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          dispatch({ type: 'ELIMINATE', id: confirm.id })
          setConfirm(null)
        }}
      />
    </div>
  )
}
