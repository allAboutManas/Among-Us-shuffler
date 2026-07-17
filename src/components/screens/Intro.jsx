import { motion } from 'framer-motion'
import { Button } from '../ui.jsx'
import RulesContent from '../Rules.jsx'

// The very first screen. The host reads the game and rules to the room, then
// taps through to set up the crew. Reopenable later from the lobby.
//
// Note: entrance motion here only ever slides content in from a small offset —
// opacity stays up — so the rules are never invisible if an animation is
// interrupted. This is a read-the-rules screen; legibility beats flair.
export default function Intro({ dispatch }) {
  return (
    <div className="flex h-full flex-col">
      <header className="safe-top px-5 pb-3 pt-6 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-signal">
          A social deduction game
        </p>
        <motion.h1
          className="mt-2 font-display text-6xl tracking-wide text-vapor"
          initial={{ scale: 0.94 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        >
          CREW CALL
        </motion.h1>
        <p className="mt-2 text-vapor/55">
          Host reads this out loud. Keep hold of the phone — you'll pass it
          around later, when it's time to peek at roles.
        </p>
      </header>

      <motion.div
        className="min-h-0 flex-1 overflow-y-auto px-5"
        initial={{ y: 10 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <RulesContent />
      </motion.div>

      <div className="safe-bottom border-t border-strut bg-void/80 px-5 pt-3 backdrop-blur">
        <Button
          variant="signal"
          full
          className="text-lg"
          onClick={() => dispatch({ type: 'INTRO_DONE' })}
        >
          Got it — gather the village
        </Button>
        <p className="mt-2 text-center text-xs text-vapor/40">
          You can reopen the rules any time from the lobby.
        </p>
      </div>
    </div>
  )
}
