import { HostRolesReveal } from '../HostRoles.jsx'

// Sits between Reveal and In Game. Once every player has privately seen their
// own card, the phone comes back to the host, who can hold to reveal a private
// who's-who briefing — so they never lose track of the Doctor or Impostor(s)
// while running the round. Hosts who are also players can skip it.
export default function HostReveal({ state, dispatch }) {
  const begin = () => dispatch({ type: 'START_ROUND' })
  return (
    <div className="flex h-full flex-col">
      <header className="safe-top px-4 pb-1 pt-3 text-center">
        <p className="text-sm uppercase tracking-widest text-vapor/40">
          Host briefing
        </p>
      </header>
      <div className="min-h-0 flex-1">
        <HostRolesReveal
          players={state.players}
          continueLabel="Start the round"
          onContinue={begin}
          onCancel={begin}
          cancelLabel="Skip — start the round"
        />
      </div>
    </div>
  )
}
