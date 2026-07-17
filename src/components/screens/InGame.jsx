import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Chip } from '../ui.jsx'
import ConfirmSheet from '../ConfirmSheet.jsx'
import { HostPeekOverlay } from '../HostRoles.jsx'

// The home screen of the whole game. The host returns here after every
// meeting and every elimination. Names only, never roles.
export default function InGame({ state, dispatch }) {
  const { players, doctorReviveUsed, detectiveUsed, settings, investigation } = state
  const living = players.filter((p) => p.alive)
  const ghosts = players.filter((p) => !p.alive)

  const [confirm, setConfirm] = useState(null) // {type, player}
  const [reviveMode, setReviveMode] = useState(false)
  const [investigateMode, setInvestigateMode] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [showPeek, setShowPeek] = useState(false) // host-only who's-who

  const canRevive = !doctorReviveUsed && ghosts.length > 0
  const canInvestigate = settings.detective && !detectiveUsed
  const busy = reviveMode || investigateMode // a mode owns the roster taps

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="safe-top flex items-center justify-between px-4 pb-2 pt-3">
        <div>
          <p className="font-display text-2xl tracking-wide text-vapor">
            {living.length} still in
          </p>
          <p className="text-xs text-vapor/40">Tap a name to mark them out.</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPeek(true)}
            className="min-h-tap rounded-lg border border-strut px-3 text-sm text-vapor/70 hover:border-signal/60 hover:text-signal"
          >
            🔒 Roles
          </button>
          <button
            onClick={() => setConfirmEnd(true)}
            className="min-h-tap rounded-lg px-3 text-sm text-vapor/45 hover:text-breach"
          >
            End game
          </button>
        </div>
      </header>

      {/* Rosters (scroll) */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
        {reviveMode && (
          <div className="mb-3 rounded-xl border border-triage/50 bg-triage/10 px-3 py-2 text-sm text-triage">
            Pick a player to revive.{' '}
            <button className="underline" onClick={() => setReviveMode(false)}>
              Cancel
            </button>
          </div>
        )}
        {investigateMode && (
          <div className="mb-3 rounded-xl border border-sleuth/50 bg-sleuth/10 px-3 py-2 text-sm text-sleuth">
            🔍 Who does the Detective accuse?{' '}
            <button className="underline" onClick={() => setInvestigateMode(false)}>
              Cancel
            </button>
          </div>
        )}

        {/* Living */}
        <ul className="grid grid-cols-1 gap-2">
          <AnimatePresence initial={false}>
            {living.map((p) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  disabled={reviveMode}
                  onClick={() =>
                    setConfirm({
                      type: investigateMode ? 'investigate' : 'eliminate',
                      player: p,
                    })
                  }
                  className={[
                    'flex min-h-tap w-full items-center gap-3 rounded-xl border bg-hull px-4 py-3 text-left transition-colors disabled:opacity-40',
                    investigateMode
                      ? 'border-sleuth/60 enabled:hover:border-sleuth enabled:active:bg-sleuth/10'
                      : 'border-strut enabled:hover:border-breach/60 enabled:active:bg-breach/10',
                  ].join(' ')}
                >
                  <Chip color={p.color} size={36} />
                  <span className="flex-1 truncate text-lg text-vapor">
                    {p.name}
                  </span>
                  {investigateMode ? (
                    <span className="text-xs text-sleuth">accuse</span>
                  ) : (
                    !reviveMode && (
                      <span className="text-xs text-vapor/30">mark out</span>
                    )
                  )}
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {/* Ghosts */}
        {ghosts.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs uppercase tracking-widest text-vapor/30">
              Out ({ghosts.length})
            </p>
            <ul className="grid grid-cols-1 gap-2">
              <AnimatePresence initial={false}>
                {ghosts.map((p) => {
                  const selectable = reviveMode && !doctorReviveUsed
                  return (
                    <motion.li
                      key={p.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: selectable ? 1 : 0.4 }}
                      exit={{ opacity: 0 }}
                    >
                      <button
                        disabled={!selectable}
                        onClick={() =>
                          selectable && setConfirm({ type: 'revive', player: p })
                        }
                        className={[
                          'flex min-h-tap w-full items-center gap-3 rounded-xl border px-4 py-3 text-left',
                          selectable
                            ? 'border-triage/60 bg-triage/10 hover:bg-triage/20'
                            : 'cursor-default border-strut/50 bg-hull/40',
                        ].join(' ')}
                      >
                        <Chip
                          color={p.color}
                          size={32}
                          style={{ filter: selectable ? 'none' : 'grayscale(0.6)' }}
                        />
                        <span
                          className={[
                            'flex-1 truncate text-lg',
                            selectable ? 'text-vapor' : 'text-vapor/60 line-through',
                          ].join(' ')}
                        >
                          {p.name}
                        </span>
                        {selectable && (
                          <span className="text-xs text-triage">revive</span>
                        )}
                      </button>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          </div>
        )}
      </div>

      {/* Bottom action zone (thumb-reachable) */}
      <div className="safe-bottom border-t border-strut bg-void/80 px-4 pt-3 backdrop-blur">
        {canInvestigate && !busy && (
          <button
            onClick={() => setInvestigateMode(true)}
            className="mb-2 min-h-tap w-full rounded-xl border border-sleuth/50 text-sleuth hover:bg-sleuth/10"
          >
            🔍 Detective investigates <span className="opacity-60">(once)</span>
          </button>
        )}
        {canRevive && !busy && (
          <button
            onClick={() => setReviveMode(true)}
            className="mb-2 min-h-tap w-full rounded-xl border border-triage/50 text-triage hover:bg-triage/10"
          >
            ✚ Revive a player <span className="opacity-60">(Doctor, once)</span>
          </button>
        )}
        <Button
          variant="signal"
          full
          className="text-xl font-semibold"
          onClick={() => dispatch({ type: 'CALL_MEETING', now: Date.now() })}
        >
          📢 Call meeting
        </Button>
      </div>

      {/* Confirm: eliminate */}
      <ConfirmSheet
        open={confirm?.type === 'eliminate'}
        player={confirm?.player}
        title={`${confirm?.player?.name} is out?`}
        confirmLabel="Confirm — out"
        confirmVariant="breach"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          dispatch({ type: 'ELIMINATE', id: confirm.player.id })
          setConfirm(null)
        }}
      />

      {/* Confirm: revive */}
      <ConfirmSheet
        open={confirm?.type === 'revive'}
        player={confirm?.player}
        title={`Revive ${confirm?.player?.name}?`}
        detail="The Doctor can do this only once."
        confirmLabel="Yes, bring them back"
        confirmVariant="triage"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          dispatch({ type: 'REVIVE', id: confirm.player.id })
          setConfirm(null)
          setReviveMode(false)
        }}
      />

      {/* Confirm: Detective investigation */}
      <ConfirmSheet
        open={confirm?.type === 'investigate'}
        player={confirm?.player}
        title={`Detective accuses ${confirm?.player?.name}?`}
        detail="One investigation, and this is it. A wrong call is wasted."
        confirmLabel="Investigate"
        confirmVariant="sleuth"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          dispatch({ type: 'INVESTIGATE', id: confirm.player.id })
          setConfirm(null)
          setInvestigateMode(false)
        }}
      />

      {/* Confirm: end game */}
      <ConfirmSheet
        open={confirmEnd}
        title="End the round?"
        detail="Everyone sees the roles. No winner is declared."
        confirmLabel="End game & reveal"
        confirmVariant="breach"
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          dispatch({ type: 'END_GAME' })
          setConfirmEnd(false)
        }}
      />

      {/* Result: a wrong Detective guess (a correct one routes to the Out screen) */}
      <AnimatePresence>
        {investigation && investigation.correct === false && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-xs rounded-2xl border border-sleuth/40 bg-hull p-6 text-center"
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
            >
              <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-sleuth/15 text-3xl">
                🔍
              </div>
              <p className="font-display text-2xl text-vapor">
                {investigation.targetName} is not the Werewolf.
              </p>
              <p className="mt-2 text-sm text-vapor/55">
                The trail goes cold. The Detective's investigation is spent — play on.
              </p>
              <div className="mt-5">
                <Button
                  variant="sleuth"
                  full
                  onClick={() => dispatch({ type: 'CLEAR_INVESTIGATION' })}
                >
                  Back to the game
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Host-only who's-who peek */}
      {showPeek && (
        <HostPeekOverlay players={players} onClose={() => setShowPeek(false)} />
      )}
    </div>
  )
}
