import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Chip } from '../ui.jsx'
import { ROLE_META } from '../../lib/assign.js'

// A brief full-screen moment (~2.5s, skippable by tap). The player's chip
// drifts off-screen into the void, slow ease-in. It does NOT say whether they
// were the Impostor — unless the host turned on the reveal-role-on-out lobby
// setting. That silence is the reveal mechanic.
export default function Out({ state, dispatch }) {
  const reduce = useReducedMotion()
  const player = state.players.find((p) => p.id === state.lastOut)
  const meta = player ? ROLE_META[player.role] : null
  // A Detective catch is a confirmed Impostor, so it always reveals — the
  // catch is the reveal. A normal ejection stays silent unless the host opted in.
  const caught = state.outReason === 'detective'

  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'OUT_DONE' }), reduce ? 1100 : 2500)
    return () => clearTimeout(t)
  }, [dispatch, reduce])

  if (!player) return null

  return (
    <button
      onClick={() => dispatch({ type: 'OUT_DONE' })}
      className="grid h-full w-full place-items-center px-6 text-center"
      aria-label="Skip"
    >
      <div>
        <motion.div
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={
            reduce
              ? { opacity: 0.2 }
              : { y: -420, opacity: 0, scale: 0.6, rotate: -20 }
          }
          transition={{ duration: reduce ? 0.3 : 1.2, ease: 'easeIn', delay: 0.5 }}
          className="mx-auto mb-6 grid place-items-center"
        >
          <Chip color={player.color} size={96} />
        </motion.div>

        {caught && (
          <motion.p
            className="mb-1 font-display text-xl tracking-[0.2em] text-sleuth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            🔍 THE DETECTIVE WAS RIGHT
          </motion.p>
        )}

        <motion.p
          className="font-display text-5xl tracking-wide text-vapor"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {player.name} is out.
        </motion.p>

        {caught ? (
          <motion.p
            className="mt-3 text-lg text-breach"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {ROLE_META.impostor.icon} Caught — they were a Werewolf.
          </motion.p>
        ) : (
          state.settings.revealRoleOnOut &&
          meta && (
            <motion.p
              className="mt-3 text-lg"
              style={{ color: meta.color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {meta.icon} They were the {meta.label}.
            </motion.p>
          )
        )}

        <p className="mt-8 text-sm text-vapor/30">tap to continue</p>
      </div>
    </button>
  )
}
