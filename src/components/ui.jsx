import { motion } from 'framer-motion'
import Crewmate from './Crewmate.jsx'

// ─────────────────────────────────────────────────────────────
// Shared primitives. Every interactive element clears the 48px tap
// floor and has a press state you can feel.
// ─────────────────────────────────────────────────────────────

const VARIANTS = {
  signal: 'bg-signal text-void font-semibold',
  breach: 'bg-breach text-white font-semibold',
  triage: 'bg-triage text-void font-semibold',
  sleuth: 'bg-sleuth text-void font-semibold',
  ghost: 'bg-hull text-vapor border border-strut',
  quiet: 'bg-transparent text-vapor/70 border border-transparent',
}

export function Button({
  children,
  variant = 'signal',
  className = '',
  full = false,
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={[
        'inline-flex min-h-tap items-center justify-center gap-2 rounded-xl px-5 py-3',
        'text-base leading-none transition-colors select-none',
        'disabled:cursor-not-allowed disabled:opacity-40',
        VARIANTS[variant],
        full ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// A player token: the recolourable crewmate, in the player's colour. An
// optional `glyph` (a role icon) rides along as a small corner badge.
export function Chip({ color, size = 40, glyph, className = '', style }) {
  return (
    <span
      className={['relative inline-flex shrink-0 items-center justify-center', className].join(' ')}
      style={{ width: size, height: size, ...style }}
      aria-hidden="true"
    >
      <Crewmate color={color} size={size} />
      {glyph ? (
        <span
          className="absolute -bottom-1 -right-1 grid place-items-center rounded-full font-display leading-none"
          style={{
            width: size * 0.52,
            height: size * 0.52,
            background: 'var(--void)',
            border: '1px solid var(--strut)',
            color: 'var(--vapor)',
            fontSize: size * 0.3,
          }}
        >
          {glyph}
        </span>
      ) : null}
    </span>
  )
}

// The centered ship-terminal shell that keeps everything ≤480px on desktop.
export function AppShell({ children }) {
  return (
    <div className="relative mx-auto flex h-full w-full max-w-app flex-col overflow-hidden">
      {children}
    </div>
  )
}

// A cold star / grid backdrop rendered once behind the whole app.
export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, #131a26 0%, var(--void) 60%)',
        }}
      />
      <div className="hull-grid absolute inset-0" />
    </div>
  )
}
