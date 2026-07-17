import { AnimatePresence, motion } from 'framer-motion'
import { Button, Chip } from './ui.jsx'

// The single most consequential tap in the app, so it's guarded — but only
// ONCE. A host doing this eight times a game will riot at double confirms.
//
// Slides up from the bottom, dims everything behind. Tapping the dimmed
// backdrop cancels — the destructive action is never the easy accident. It
// does NOT reveal the player's role and does not ask how they went out.
//
// Reused for elimination, the Doctor's revive, and End game.
export default function ConfirmSheet({
  open,
  player, // optional — shows chip + name
  title,
  detail,
  confirmLabel,
  confirmVariant = 'breach',
  onConfirm,
  onCancel,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial="hidden"
          animate="shown"
          exit="hidden"
        >
          {/* Backdrop — tap to cancel */}
          <motion.button
            aria-label="Cancel"
            onClick={onCancel}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
            transition={{ duration: 0.2 }}
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="safe-bottom relative z-10 w-full max-w-app rounded-t-3xl border-t border-strut bg-hull px-5 pt-3"
            variants={{
              hidden: { y: '100%' },
              shown: { y: 0 },
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            {/* Grabber */}
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-strut" />

            {player && (
              <div className="mb-3 flex flex-col items-center gap-2">
                <Chip color={player.color} size={64} />
                <p className="font-display text-4xl tracking-wide text-vapor">
                  {player.name}
                </p>
              </div>
            )}

            <p className="text-center font-display text-2xl text-vapor">
              {title}
            </p>
            {detail && (
              <p className="mt-1 text-center text-sm text-vapor/50">{detail}</p>
            )}

            <div className="mt-5 flex flex-col gap-2 pb-2">
              <Button variant={confirmVariant} full className="text-lg" onClick={onConfirm}>
                {confirmLabel}
              </Button>
              <Button variant="quiet" full onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
