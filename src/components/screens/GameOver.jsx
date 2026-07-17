import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Button, Chip } from '../ui.jsx'
import { ROLE_META } from '../../lib/assign.js'

const ROLE_ORDER = { impostor: 0, doctor: 1, detective: 2, crewmate: 3 }

// Red confetti for the Impostor victory. Deterministic-ish spread by index so
// it doesn't depend on Math.random timing; still lively.
function Confetti({ color }) {
  const reduce = useReducedMotion()
  const bits = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: (i % 12) * 0.12,
        dur: 2.2 + ((i * 13) % 20) / 10,
        size: 6 + (i % 4) * 3,
        rot: (i % 2 ? 1 : -1) * 360,
      })),
    [],
  )
  if (reduce) return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute top-[-8%] rounded-sm"
          style={{ left: `${b.left}%`, width: b.size, height: b.size * 1.6, background: color }}
          initial={{ y: '-10%', opacity: 0, rotate: 0 }}
          animate={{ y: '115%', opacity: [0, 1, 1, 0.8], rotate: b.rot }}
          transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

export default function GameOver({ state, dispatch }) {
  const reduce = useReducedMotion()
  const { winner, players } = state
  const impostors = players.filter((p) => p.role === 'impostor')

  const roster = [...players].sort(
    (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role],
  )

  const theme =
    winner === 'impostors'
      ? { accent: 'var(--breach)', bg: 'rgba(255,59,92,0.12)' }
      : winner === 'crew'
        ? { accent: 'var(--signal)', bg: 'rgba(77,255,195,0.10)' }
        : { accent: 'var(--vapor)', bg: 'transparent' }

  return (
    <div className="relative flex h-full flex-col" style={{ background: theme.bg }}>
      {winner === 'impostors' && <Confetti color="var(--breach)" />}

      {/* Banner */}
      <div className="relative px-4 pt-8 text-center">
        {winner === 'impostors' && (
          <>
            <motion.p
              className="font-display text-2xl tracking-[0.3em] text-breach"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              THE {impostors.length > 1 ? 'WEREWOLVES WIN' : 'WEREWOLF WINS'}
            </motion.p>
            <motion.h1
              className="mt-2 font-display text-5xl leading-tight text-vapor"
              initial={reduce ? {} : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
            >
              Winner Winner
              <br />
              Alhua Dinner 🍗
            </motion.h1>
          </>
        )}

        {winner === 'crew' && (
          <>
            <motion.p
              className="font-display text-2xl tracking-[0.3em] text-signal"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              THE VILLAGE WINS
            </motion.p>
            <motion.h1
              className="mt-2 font-display text-5xl text-vapor"
              initial={reduce ? {} : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            >
              The village survives.
            </motion.h1>
          </>
        )}

        {winner === 'abandoned' && (
          <>
            <p className="font-display text-2xl tracking-[0.3em] text-vapor/50">
              ROUND ENDED
            </p>
            <h1 className="mt-2 font-display text-5xl text-vapor">
              Round abandoned.
            </h1>
          </>
        )}

        {/* Impostor chips strutting */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {impostors.map((p, i) => (
            <motion.div
              key={p.id}
              className="flex flex-col items-center"
              initial={reduce ? {} : { y: 20, opacity: 0 }}
              animate={
                winner === 'crew' && !reduce
                  ? { y: [-4, 4, -4], opacity: 1 }
                  : { y: 0, opacity: 1 }
              }
              transition={
                winner === 'crew' && !reduce
                  ? { y: { duration: 2.4, repeat: Infinity }, opacity: { delay: 0.3 + i * 0.1 } }
                  : { delay: 0.3 + i * 0.12 }
              }
            >
              <Chip color={p.color} size={56} glyph={ROLE_META.impostor.icon} />
              <span className="mt-1 text-sm text-vapor">{p.name}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full role reveal */}
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-4">
        <p className="mb-2 text-xs uppercase tracking-widest text-vapor/35">
          Full reveal
        </p>
        <ul className="grid grid-cols-1 gap-2 pb-2">
          {roster.map((p) => {
            const meta = ROLE_META[p.role]
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-strut bg-hull px-3 py-2.5"
                style={{ opacity: p.alive ? 1 : 0.7 }}
              >
                <Chip color={p.color} size={32} />
                <span className="flex-1 truncate text-vapor">
                  {p.name}
                  {!p.alive && (
                    <span className="ml-2 text-xs text-vapor/40">(was out)</span>
                  )}
                </span>
                <span
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium"
                  style={{ color: meta.color, background: `${meta.color}1f` }}
                >
                  <span>{meta.icon}</span>
                  {meta.label}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Actions */}
      <div className="safe-bottom flex flex-col gap-2 border-t border-strut bg-void/80 px-4 pt-3 backdrop-blur">
        <Button
          variant="signal"
          full
          className="text-lg"
          onClick={() => dispatch({ type: 'PLAY_AGAIN' })}
        >
          🔀 Play again (same village)
        </Button>
        <Button
          variant="ghost"
          full
          onClick={() => dispatch({ type: 'BACK_TO_LOBBY' })}
        >
          Back to lobby
        </Button>
      </div>
    </div>
  )
}
