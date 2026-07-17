import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Chip } from '../ui.jsx'
import RulesContent from '../Rules.jsx'
import {
  MIN_PLAYERS,
  MAX_PLAYERS,
  SECOND_IMPOSTOR_THRESHOLD,
} from '../../state/reducer.js'

// Optional irregular plural (e.g. Werewolf → Werewolves); defaults to +s.
const plural = (n, w, p) => `${n} ${n === 1 ? w : p || w + 's'}`

// One roster row. Tap the name to edit it inline; blur or Enter commits.
function PlayerRow({ player, onRename, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(player.name)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    setEditing(false)
    const next = draft.trim()
    if (next && next !== player.name) onRename(player.id, next)
    else setDraft(player.name)
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="mb-2"
    >
      <div className="flex items-center gap-3 rounded-xl border border-strut bg-hull px-3 py-2.5">
        <Chip color={player.color} size={32} />
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(player.name)
                setEditing(false)
              }
            }}
            maxLength={24}
            className="min-w-0 flex-1 rounded-md bg-void px-2 py-1 text-vapor outline-none ring-1 ring-strut focus:ring-signal"
            aria-label={`Edit name for ${player.name}`}
          />
        ) : (
          <button
            onClick={() => {
              setDraft(player.name)
              setEditing(true)
            }}
            className="min-w-0 flex-1 truncate py-1 text-left text-lg"
          >
            {player.name}
          </button>
        )}
        <button
          onClick={() => onDelete(player.id)}
          aria-label={`Remove ${player.name}`}
          className="grid h-9 w-9 place-items-center rounded-lg text-xl text-vapor/50 transition-colors hover:bg-breach/15 hover:text-breach"
        >
          ✕
        </button>
      </div>
    </motion.li>
  )
}

function Toggle({ on, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={[
        'relative h-7 w-12 shrink-0 rounded-full transition-colors',
        on ? 'bg-signal' : 'bg-strut',
      ].join(' ')}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 34 }}
        className="absolute top-0.5 h-6 w-6 rounded-full bg-void shadow"
        style={{ left: on ? 22 : 2 }}
      />
    </button>
  )
}

export default function Lobby({ state, dispatch }) {
  const { players, settings, error } = state
  const [value, setValue] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const inputRef = useRef(null)

  const count = players.length
  const canStart = count >= MIN_PLAYERS
  const showSecond = count >= SECOND_IMPOSTOR_THRESHOLD
  const impostors = settings.twoImpostors && showSecond ? 2 : 1
  const hasDetective = !!settings.detective
  const crewmates = Math.max(0, count - impostors - 1 - (hasDetective ? 1 : 0))

  const add = () => {
    const name = value.trim()
    if (!name) {
      dispatch({ type: 'ADD_PLAYER', name: '' }) // triggers "Type a name first."
      return
    }
    dispatch({ type: 'ADD_PLAYER', name })
    setValue('')
    inputRef.current?.focus()
  }

  // Clear the transient validation error whenever the user resumes typing.
  useEffect(() => {
    if (error && value) dispatch({ type: 'DISMISS_ERROR' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="safe-top flex items-start justify-between px-4 pb-2 pt-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-vapor">
            CREW CALL
          </h1>
          <p className="text-sm text-vapor/50">
            Secret roles · meeting timer · auto win-check
          </p>
        </div>
        <button
          onClick={() => setShowRules(true)}
          className="min-h-tap shrink-0 rounded-lg border border-strut px-3 text-sm text-vapor/70 hover:border-signal/60 hover:text-signal"
        >
          ? How to play
        </button>
      </header>

      {/* Add input */}
      <div className="px-4 pb-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Add a player…"
            maxLength={24}
            enterKeyHint="done"
            className="min-h-tap min-w-0 flex-1 rounded-xl border border-strut bg-hull px-4 text-lg text-vapor placeholder:text-vapor/35 outline-none focus:border-signal"
            aria-label="Player name"
          />
          <Button onClick={add} aria-label="Add player">
            + Add
          </Button>
        </div>
        <div className="min-h-5 pt-1.5">
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key={error}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-breach"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Roster (scrolls) */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {count === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div className="px-6">
              <div className="mb-4 flex items-end justify-center gap-1 opacity-25">
                <Chip color="#4DABF7" size={44} />
                <Chip color="#F783AC" size={56} />
                <Chip color="#A9E34B" size={44} />
              </div>
              <p className="text-lg text-vapor/60">Nobody's here.</p>
              <p className="text-vapor/40">Add the first name.</p>
            </div>
          </div>
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {players.map((p) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  onRename={(id, name) =>
                    dispatch({ type: 'RENAME_PLAYER', id, name })
                  }
                  onDelete={(id) => dispatch({ type: 'DELETE_PLAYER', id })}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Footer: counter, second-impostor toggle, options, start */}
      <div className="safe-bottom border-t border-strut bg-void/80 px-4 pt-3 backdrop-blur">
        {/* Live counter */}
        <p className="mb-2 text-center text-sm text-vapor/70">
          {count === 0 ? (
            'Add at least 4 players to start.'
          ) : (
            <>
              <span className="text-vapor">{plural(count, 'player')}</span>
              <span className="text-vapor/40"> · </span>
              {plural(impostors, 'Werewolf', 'Werewolves')}
              <span className="text-vapor/40"> · </span>1 Doctor
              {hasDetective && (
                <>
                  <span className="text-vapor/40"> · </span>1 Detective
                </>
              )}
              <span className="text-vapor/40"> · </span>
              {plural(crewmates, 'Villager')}
            </>
          )}
        </p>

        {/* Second-Impostor toggle — slides in at 10+ */}
        <AnimatePresence>
          {showSecond && (
            <motion.div
              key="second"
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mb-2 flex items-center gap-3 rounded-xl border border-triage/40 bg-triage/10 px-3 py-2.5">
                <span className="text-xl">🐺</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-vapor">
                    Big village. Want a second Werewolf?
                  </p>
                  <p className="text-xs text-vapor/50">
                    The whole group can see this setting.
                  </p>
                </div>
                <Toggle
                  on={settings.twoImpostors}
                  onChange={(v) =>
                    dispatch({
                      type: 'SET_SETTING',
                      key: 'twoImpostors',
                      value: v,
                    })
                  }
                  label="Second Werewolf"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detective toggle */}
        {count > 0 && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-sleuth/40 bg-sleuth/10 px-3 py-2.5">
            <span className="text-xl">🔍</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-vapor">Add a Detective?</p>
              <p className="text-xs text-vapor/50">
                One investigation per game — a correct call catches a Werewolf.
              </p>
            </div>
            <Toggle
              on={hasDetective}
              onChange={(v) =>
                dispatch({ type: 'SET_SETTING', key: 'detective', value: v })
              }
              label="Detective"
            />
          </div>
        )}

        {/* Reveal-role-on-out option */}
        {count > 0 && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-strut bg-hull px-3 py-2">
            <div className="flex-1">
              <p className="text-sm text-vapor/90">Reveal role when someone's out</p>
              <p className="text-xs text-vapor/45">Default off — silence is the reveal.</p>
            </div>
            <Toggle
              on={settings.revealRoleOnOut}
              onChange={(v) =>
                dispatch({ type: 'SET_SETTING', key: 'revealRoleOnOut', value: v })
              }
              label="Reveal role when someone is out"
            />
          </div>
        )}

        {/* Start + Clear */}
        <div className="flex flex-col gap-2 pb-1">
          <Button
            variant="signal"
            full
            disabled={!canStart}
            onClick={() => dispatch({ type: 'START_GAME' })}
            className="text-lg"
          >
            {canStart ? 'Start game' : `Add ${MIN_PLAYERS - count} more to start`}
          </Button>

          {count > 0 &&
            (confirmClear ? (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  full
                  onClick={() => setConfirmClear(false)}
                >
                  Keep them
                </Button>
                <Button
                  variant="breach"
                  full
                  onClick={() => {
                    dispatch({ type: 'CLEAR_ALL' })
                    setConfirmClear(false)
                  }}
                >
                  Clear all
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="min-h-tap text-sm text-vapor/45 hover:text-breach"
              >
                Clear all
              </button>
            ))}
        </div>
      </div>

      {/* How-to-play overlay */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            className="fixed inset-0 z-50 bg-void"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto flex h-full w-full max-w-app flex-col">
              <header className="safe-top flex items-center justify-between px-5 pb-2 pt-4">
                <h2 className="font-display text-2xl tracking-wide text-vapor">
                  How to play
                </h2>
                <button
                  onClick={() => setShowRules(false)}
                  aria-label="Close rules"
                  className="grid h-10 w-10 place-items-center rounded-lg text-2xl text-vapor/60 hover:text-vapor"
                >
                  ✕
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-5">
                <RulesContent />
              </div>
              <div className="safe-bottom px-5 pt-2">
                <Button variant="signal" full onClick={() => setShowRules(false)}>
                  Got it
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
