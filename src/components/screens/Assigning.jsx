import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Crewmate from '../Crewmate.jsx'

// Full-screen shuffle. Roughly 2.5s, NOT skippable — a deliberate stall so
// the host can't be accused of peeking, and it builds tension. The roles are
// already computed and stored (reducer START_GAME); this animation is pure
// theater. One chip flickers --breach red for a single frame near the end.
// It means nothing. It's the red herring. It's the fun part.
//
// Reduced motion: a static 800ms "Assigning…" state, no scatter.

export default function Assigning({ players, onDone }) {
  const reduce = useReducedMotion()
  const n = players.length

  // A single chip flickers red near the end. -1 = nobody.
  const [flicker, setFlicker] = useState(-1)

  const chipSize = n <= 8 ? 46 : n <= 12 ? 38 : 32
  const gap = 10
  const rowH = chipSize + gap
  const colH = n * rowH

  // Precompute per-chip scatter + orbit vectors (stable across renders).
  const vectors = useMemo(() => {
    return players.map((_, i) => {
      const a0 = (i / Math.max(1, n)) * Math.PI * 2 + i * 1.7
      const a1 = a0 + Math.PI * 0.9
      const r = 110 + (i % 4) * 22
      return {
        sx: Math.cos(a0) * r,
        sy: Math.sin(a0) * r,
        ox: Math.cos(a1) * (r * 0.7),
        oy: Math.sin(a1) * (r * 0.7),
        fy: i * rowH - colH / 2 + rowH / 2,
        spin: (i % 2 ? 1 : -1) * 360,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  useEffect(() => {
    if (reduce) {
      const t = setTimeout(onDone, 800)
      return () => clearTimeout(t)
    }
    // Red-herring flicker at ~2.15s, cleared one frame later.
    const pick = n > 0 ? Math.floor(Math.random() * n) : -1
    const on = setTimeout(() => setFlicker(pick), 2150)
    const off = setTimeout(() => setFlicker(-1), 2230)
    const done = setTimeout(onDone, 2500)
    return () => {
      clearTimeout(on)
      clearTimeout(off)
      clearTimeout(done)
    }
  }, [reduce, n, onDone])

  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden">
      {/* Rotating scanner ring behind the shuffle */}
      {!reduce && (
        <motion.div
          className="pointer-events-none absolute h-72 w-72 rounded-full border border-signal/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{ boxShadow: '0 0 60px -20px var(--signal)' }}
        />
      )}

      <div className="relative grid place-items-center" style={{ height: colH + 40 }}>
        {reduce
          ? players.map((p) => (
              <span key={p.id} className="sr-only">
                {p.name}
              </span>
            ))
          : players.map((p, i) => {
              const v = vectors[i]
              const isFlicker = flicker === i
              return (
                <motion.div
                  key={p.id}
                  className="absolute grid place-items-center rounded-full"
                  style={{
                    width: chipSize,
                    height: chipSize,
                    filter: isFlicker
                      ? 'drop-shadow(0 0 12px var(--breach))'
                      : 'none',
                  }}
                  initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                  animate={{
                    x: [0, v.sx, v.ox, 0],
                    y: [0, v.sy, v.oy, v.fy],
                    scale: [0.3, 1, 1, 1],
                    opacity: [0, 1, 1, 1],
                    rotate: [0, v.spin, v.spin * 1.4, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    times: [0, 0.28, 0.62, 1],
                    ease: 'easeInOut',
                  }}
                >
                  <Crewmate
                    color={isFlicker ? 'var(--breach)' : p.color}
                    size={chipSize}
                  />
                </motion.div>
              )
            })}
      </div>

      {/* Caption */}
      <div className="absolute bottom-24 text-center">
        <motion.p
          className="font-display text-2xl tracking-[0.3em] text-signal"
          animate={reduce ? {} : { opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          ASSIGNING…
        </motion.p>
        <p className="mt-1 text-sm text-vapor/40">Dealing roles. No peeking.</p>
      </div>
    </div>
  )
}
