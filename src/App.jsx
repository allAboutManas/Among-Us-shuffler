import { useReducer } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { reducer, makeInitialState } from './state/reducer.js'
import { AppShell, Backdrop } from './components/ui.jsx'
import Airlock from './components/Airlock.jsx'
import Lobby from './components/screens/Lobby.jsx'
import Assigning from './components/screens/Assigning.jsx'
import Reveal from './components/screens/Reveal.jsx'
import InGame from './components/screens/InGame.jsx'
import Meeting from './components/screens/Meeting.jsx'
import Out from './components/screens/Out.jsx'
import GameOver from './components/screens/GameOver.jsx'

// Which phases open with the signature airlock, and in what tone.
const AIRLOCK = {
  assigning: 'signal',
  out: 'breach',
  gameOver: 'signal', // overridden to breach on an Impostor win below
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState)

  const screen = (() => {
    switch (state.phase) {
      case 'lobby':
        return <Lobby state={state} dispatch={dispatch} />
      case 'assigning':
        return (
          <Assigning
            players={state.players}
            onDone={() => dispatch({ type: 'ASSIGN_DONE' })}
          />
        )
      case 'reveal':
        return <Reveal state={state} dispatch={dispatch} />
      case 'inGame':
        return <InGame state={state} dispatch={dispatch} />
      case 'meeting':
        return <Meeting state={state} dispatch={dispatch} />
      case 'out':
        return <Out state={state} dispatch={dispatch} />
      case 'gameOver':
        return <GameOver state={state} dispatch={dispatch} />
      default:
        return null
    }
  })()

  const airlockTone =
    state.phase === 'gameOver'
      ? state.winner === 'impostors'
        ? 'breach'
        : state.winner === 'crew'
          ? 'signal'
          : 'strut'
      : AIRLOCK[state.phase]

  const usesAirlock = state.phase in AIRLOCK

  return (
    <>
      <Backdrop />
      <AppShell>
        <AnimatePresence mode="wait">
          <motion.div
            key={state.phase}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {usesAirlock ? (
              <Airlock tone={airlockTone}>{screen}</Airlock>
            ) : (
              screen
            )}
          </motion.div>
        </AnimatePresence>
      </AppShell>
    </>
  )
}
