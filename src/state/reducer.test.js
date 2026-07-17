import { describe, it, expect } from 'vitest'
import { reducer, makeInitialState } from './reducer.js'

// Drive the whole state machine as the app would, minus React. localStorage is
// absent in node; the reducer's persistence layer swallows that safely.

function setup(names, { twoImpostors = false, detective = true } = {}) {
  let s = makeInitialState()
  // Start from a clean roster regardless of any persisted state.
  s = reducer(s, { type: 'CLEAR_ALL' })
  for (const name of names) s = reducer(s, { type: 'ADD_PLAYER', name })
  if (twoImpostors) s = reducer(s, { type: 'SET_SETTING', key: 'twoImpostors', value: true })
  // Set explicitly so persisted settings can't leak between tests.
  s = reducer(s, { type: 'SET_SETTING', key: 'detective', value: detective })
  // These tests operate from the lobby; step past the intro.
  s = reducer(s, { type: 'INTRO_DONE' })
  return s
}

const SIX = ['Rohan', 'Priya', 'Sam', 'Mia', 'Leo', 'Ada']

describe('reducer — intro', () => {
  it('the app opens on the intro screen', () => {
    expect(makeInitialState().phase).toBe('intro')
  })
  it('INTRO_DONE advances to the lobby', () => {
    const s = reducer(makeInitialState(), { type: 'INTRO_DONE' })
    expect(s.phase).toBe('lobby')
  })
})

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
    // After the last card the phone returns to the host for the who's-who
    // briefing, then the host begins the round.
    expect(s.phase).toBe('hostReveal')
    s = reducer(s, { type: 'START_ROUND' })
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

  // ── Detective ──────────────────────────────────────────
  const play2 = (names, opts) => {
    let s = setup(names, opts)
    s = reducer(s, { type: 'START_GAME' })
    s = reducer(s, { type: 'ASSIGN_DONE' })
    for (let i = 0; i < names.length; i++) s = reducer(s, { type: 'NEXT_REVEAL' })
    return reducer(s, { type: 'START_ROUND' })
  }

  it('assigns exactly one Detective when the toggle is on', () => {
    const s = play2(SIX, { detective: true })
    expect(s.players.filter((p) => p.role === 'detective')).toHaveLength(1)
  })

  it('assigns no Detective when the toggle is off', () => {
    const s = play2(SIX, { detective: false })
    expect(s.players.filter((p) => p.role === 'detective')).toHaveLength(0)
  })

  it('a correct call on the lone Impostor ends the game — crew wins', () => {
    let s = play2(SIX, { detective: true })
    const impostor = s.players.find((p) => p.role === 'impostor')
    s = reducer(s, { type: 'INVESTIGATE', id: impostor.id })
    expect(s.phase).toBe('out')
    expect(s.outReason).toBe('detective')
    expect(s.detectiveUsed).toBe(true)
    expect(s.winner).toBe('crew')
    s = reducer(s, { type: 'OUT_DONE' })
    expect(s.phase).toBe('gameOver')
  })

  it('a correct call with two Impostors ejects one and the game continues', () => {
    const TEN = Array.from({ length: 10 }, (_, i) => `P${i}`)
    let s = play2(TEN, { twoImpostors: true, detective: true })
    const impostor = s.players.find((p) => p.role === 'impostor')
    s = reducer(s, { type: 'INVESTIGATE', id: impostor.id })
    expect(s.phase).toBe('out')
    expect(s.winner).toBe(null)
    s = reducer(s, { type: 'OUT_DONE' })
    expect(s.phase).toBe('inGame')
    expect(s.players.filter((p) => p.role === 'impostor' && p.alive)).toHaveLength(1)
  })

  it('a wrong call ejects no one, is spent, and leaves the board unchanged', () => {
    let s = play2(SIX, { detective: true })
    const crewmate = s.players.find((p) => p.role === 'crewmate')
    s = reducer(s, { type: 'INVESTIGATE', id: crewmate.id })
    expect(s.phase).toBe('inGame')
    expect(s.detectiveUsed).toBe(true)
    expect(s.investigation).toEqual({ targetName: crewmate.name, correct: false })
    expect(s.players.filter((p) => p.alive)).toHaveLength(6)

    // Spent — a second investigation (even a correct one) is a no-op.
    const impostor = s.players.find((p) => p.role === 'impostor')
    s = reducer(s, { type: 'INVESTIGATE', id: impostor.id })
    expect(s.phase).toBe('inGame')
    expect(s.players.filter((p) => p.alive)).toHaveLength(6)

    s = reducer(s, { type: 'CLEAR_INVESTIGATION' })
    expect(s.investigation).toBe(null)
  })
})
