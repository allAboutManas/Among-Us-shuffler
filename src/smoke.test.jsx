// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'

// jsdom lacks a few browser APIs our components touch. Polyfill them so a
// render doesn't crash. These are also the real-device features that degrade
// gracefully in production (matchMedia, vibrate, wakeLock, AudioContext).
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    })
  }
})
afterEach(cleanup)

import App from './App.jsx'
import Intro from './components/screens/Intro.jsx'
import Lobby from './components/screens/Lobby.jsx'
import Reveal from './components/screens/Reveal.jsx'
import HostReveal from './components/screens/HostReveal.jsx'
import InGame from './components/screens/InGame.jsx'
import Meeting from './components/screens/Meeting.jsx'
import Out from './components/screens/Out.jsx'
import GameOver from './components/screens/GameOver.jsx'
import { reducer, makeInitialState } from './state/reducer.js'

const noop = () => {}

// Build a realistic in-progress game state (roles assigned, everyone revealed).
function gameState() {
  let s = makeInitialState()
  s = reducer(s, { type: 'CLEAR_ALL' })
  for (const n of ['Rohan', 'Priya', 'Sam', 'Mia', 'Leo', 'Ada'])
    s = reducer(s, { type: 'ADD_PLAYER', name: n })
  s = reducer(s, { type: 'SET_SETTING', key: 'detective', value: true })
  s = reducer(s, { type: 'START_GAME' })
  s = reducer(s, { type: 'ASSIGN_DONE' })
  for (let i = 0; i < 6; i++) s = reducer(s, { type: 'NEXT_REVEAL' })
  s = reducer(s, { type: 'START_ROUND' })
  return s
}

describe('render smoke — no screen crashes on mount', () => {
  it('App mounts on the intro screen', () => {
    render(<App />)
    expect(screen.getByText('CREW CALL')).toBeTruthy()
    expect(screen.getByText(/gather the village/)).toBeTruthy()
  })

  it('Intro renders the rules including the Detective role', () => {
    render(<Intro dispatch={noop} />)
    expect(screen.getByText(/A social deduction game/)).toBeTruthy()
    expect(screen.getByText('Detective')).toBeTruthy()
  })

  it('Lobby renders the empty state', () => {
    let s = makeInitialState()
    s = reducer(s, { type: 'CLEAR_ALL' })
    render(<Lobby state={s} dispatch={noop} />)
    expect(screen.getByText(/Nobody's here/)).toBeTruthy()
  })

  it('Reveal renders the pass interstitial', () => {
    const s = { ...gameState(), phase: 'reveal', revealIndex: 0 }
    render(<Reveal state={s} dispatch={noop} />)
    expect(screen.getByText(/Pass the phone to/)).toBeTruthy()
  })

  it('HostReveal gates the roles behind the hand-over cover', () => {
    const s = { ...gameState(), phase: 'hostReveal' }
    render(<HostReveal state={s} dispatch={noop} />)
    // The cover is shown; roles are NOT visible until the host holds to reveal.
    expect(screen.getByText(/Pass it back to the host/)).toBeTruthy()
    expect(screen.queryByText(/Who's who/)).toBeNull()
  })

  it('InGame renders the roster, count, host peek, and Detective action', () => {
    render(<InGame state={gameState()} dispatch={noop} />)
    expect(screen.getByText(/6 still in/)).toBeTruthy()
    expect(screen.getByText(/🔒 Roles/)).toBeTruthy()
    expect(screen.getByText(/Detective investigates/)).toBeTruthy()
  })

  it('Meeting renders the running clock', () => {
    const s = { ...gameState(), phase: 'meeting', meeting: { endsAt: Date.now() + 120000, pausedRemainingMs: null } }
    render(<Meeting state={s} dispatch={noop} />)
    expect(screen.getByText(/Emergency meeting/)).toBeTruthy()
  })

  it('Out renders the ejection moment', () => {
    const base = gameState()
    const victim = base.players[0]
    const s = { ...base, phase: 'out', lastOut: victim.id }
    render(<Out state={s} dispatch={noop} />)
    expect(screen.getByText(new RegExp(`${victim.name} is out`))).toBeTruthy()
  })

  it('GameOver renders the Impostor victory banner verbatim', () => {
    const base = gameState()
    const s = { ...base, phase: 'gameOver', winner: 'impostors' }
    render(<GameOver state={s} dispatch={noop} />)
    // The exact required string (rendered across a line break).
    expect(screen.getByText(/Winner Winner/)).toBeTruthy()
    expect(screen.getByText(/Alhua Dinner/)).toBeTruthy()
  })

  it('GameOver renders the village victory banner', () => {
    const base = gameState()
    const s = { ...base, phase: 'gameOver', winner: 'crew' }
    render(<GameOver state={s} dispatch={noop} />)
    expect(screen.getByText(/The village survives/)).toBeTruthy()
  })
})
