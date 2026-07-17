import { describe, it, expect } from 'vitest'
import { reducer, makeInitialState } from './reducer.js'

// Drive the whole state machine as the app would, minus React. localStorage is
// absent in node; the reducer's persistence layer swallows that safely.

function setup(names, { twoImpostors = false } = {}) {
  let s = makeInitialState()
  // Start from a clean roster regardless of any persisted state.
  s = reducer(s, { type: 'CLEAR_ALL' })
  for (const name of names) s = reducer(s, { type: 'ADD_PLAYER', name })
  if (twoImpostors) s = reducer(s, { type: 'SET_SETTING', key: 'twoImpostors', value: true })
  return s
}

const SIX = ['Rohan', 'Priya', 'Sam', 'Mia', 'Leo', 'Ada']

describe('reducer — lobby', () => {
  it('rejects duplicates case-insensitively (A2)', () => {
    let s = setup(['Rohan'])
    s = reducer(s, { type: 'ADD_PLAYER', name: 'rohan' })
    expect(s.players).toHaveLength(1)
    expect(s.error).toMatch(/already on the crew/)
  })

  it('caps the roster at 15 (R2)', () => {
    let s = setup(Array.from({ length: 15 }, (_, i) => `P${i}`))
    s = reducer(s, { type: 'ADD_PLAYER', name: 'P15' })
    expect(s.players).toHaveLength(15)
    expect(s.error).toMatch(/limit/)
  })

  it('will not start below 4 players (A1/R1)', () => {
    let s = setup(['A', 'B', 'C'])
    s = reducer(s, { type: 'START_GAME' })
    expect(s.phase).toBe('lobby')
  })

  it('second-Impostor toggle resets when roster drops below 10 (A5)', () => {
    let s = setup(Array.from({ length: 10 }, (_, i) => `P${i}`), { twoImpostors: true })
    expect(s.settings.twoImpostors).toBe(true)
    s = reducer(s, { type: 'DELETE_PLAYER', id: s.players[0].id })
    expect(s.settings.twoImpostors).toBe(false)
  })
})

describe('reducer — full game', () => {
  const play = (names, opts) => {
    let s = setup(names, opts)
    s = reducer(s, { type: 'START_GAME' })
    expect(s.phase).toBe('assigning')
    s = reducer(s, { type: 'ASSIGN_DONE' })
    // Walk every reveal card.
    for (let i = 0; i < names.length; i++) s = reducer(s, { type: 'NEXT_REVEAL' })
    expect(s.phase).toBe('inGame')
    return s
  }

  // Helper: run ELIMINATE and immediately resolve the Out screen.
  const out = (s, id) => {
    s = reducer(s, { type: 'ELIMINATE', id })
    expect(s.phase).toBe('out')
    return reducer(s, { type: 'OUT_DONE' })
  }

  it('crew wins the instant the last Impostor is ejected (A11)', () => {
    let s = play(SIX)
    const impostor = s.players.find((p) => p.role === 'impostor')
    s = out(s, impostor.id)
    expect(s.winner).toBe('crew')
    expect(s.phase).toBe('gameOver')
  })

  it('impostor wins when 2 remain and one is the Impostor (A10)', () => {
    let s = play(SIX)
    const crew = s.players.filter((p) => p.role !== 'impostor') // 5 non-impostors
    // 6 → 3 living. Still going (1 impostor vs 2 non-impostors).
    s = out(s, crew[0].id)
    s = out(s, crew[1].id)
    s = out(s, crew[2].id)
    expect(s.phase).toBe('inGame')
    // One more non-impostor out → 2 living, one is the Impostor → W2.
    s = out(s, crew[3].id)
    expect(s.winner).toBe('impostors')
    expect(s.phase).toBe('gameOver')
  })

  it('the Doctor revive works once, then is gone, and re-runs the win check (A12)', () => {
    let s = play(SIX)
    const crew = s.players.filter((p) => p.role !== 'impostor')
    // Two non-impostors out → 4 living, game continues.
    s = out(s, crew[0].id)
    s = out(s, crew[1].id)
    expect(s.phase).toBe('inGame')

    // Revive one of them → back to 5 living; win check re-runs and stays open.
    s = reducer(s, { type: 'REVIVE', id: crew[0].id })
    expect(s.doctorReviveUsed).toBe(true)
    expect(s.winner).toBe(null)
    expect(s.players.filter((p) => p.alive)).toHaveLength(5)

    // Revive is now spent — a second attempt is a no-op.
    const before = s.players.filter((p) => p.alive).length
    s = reducer(s, { type: 'REVIVE', id: crew[1].id })
    expect(s.players.filter((p) => p.alive).length).toBe(before)
  })

  it('a mid-meeting elimination ends the meeting (§4)', () => {
    let s = play(SIX)
    s = reducer(s, { type: 'CALL_MEETING', now: 1_000 })
    expect(s.phase).toBe('meeting')
    const victim = s.players.find((p) => p.alive)
    s = reducer(s, { type: 'ELIMINATE', id: victim.id })
    expect(s.phase).toBe('out')
    expect(s.meeting.endsAt).toBe(null)
  })

  it('two-Impostor endgame triggers at 2-v-2 (A6 partner + W2)', () => {
    const TEN = Array.from({ length: 10 }, (_, i) => `P${i}`)
    let s = play(TEN, { twoImpostors: true })
    const impostors = s.players.filter((p) => p.role === 'impostor')
    expect(impostors).toHaveLength(2)
    expect(s.partner[impostors[0].id]).toBe(impostors[1].name)
    const crew = s.players.filter((p) => p.role !== 'impostor') // 8 of them
    // Eliminate crew until 2 impostors vs 2 non-impostors.
    for (let i = 0; i < 6; i++) s = out(s, crew[i].id)
    expect(s.winner).toBe('impostors')
  })
})
