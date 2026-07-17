import { motion } from 'framer-motion'

// ─────────────────────────────────────────────────────────────
// Shared primitives. Every interactive element clears the 48px tap
// floor and has a press state you can feel.
// ─────────────────────────────────────────────────────────────

const VARIANTS = {
  signal: 'bg-signal text-void font-semibold',
  breach: 'bg-breach text-white font-semibold',
  triage: 'bg-triage text-void font-semibold',
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

// A round player color chip with an optional glyph, sized by `size`.
export function Chip({ color, size = 40, glyph, className = '', style }) {
  return (
    <span
      className={['inline-flex shrink-0 items-center justify-center rounded-full', className].join(' ')}
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 0 2px rgba(255,255,255,0.14), 0 2px 8px -2px ${color}`,
        ...style,
      }}
      aria-hidden="true"
    >
      {glyph ? (
        <span
          className="font-display"
          style={{ color: 'rgba(0,0,0,0.55)', fontSize: size * 0.5 }}
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
