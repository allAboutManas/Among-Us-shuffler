import { nextColor } from '../lib/colors.js'
import { assignRoles } from '../lib/assign.js'
import { checkWinner } from '../lib/winCheck.js'
import { cryptoId, loadRoster, saveRoster } from '../lib/persistence.js'

// ─────────────────────────────────────────────────────────────
// Constants — the rules, in one place.
// ─────────────────────────────────────────────────────────────
export const MIN_PLAYERS = 4
export const MAX_PLAYERS = 15
export const SECOND_IMPOSTOR_THRESHOLD = 10
export const MEETING_MS = 120_000

// ─────────────────────────────────────────────────────────────
// Initial state — rehydrate roster + prefs from storage, never roles/alive.
// ─────────────────────────────────────────────────────────────
export function makeInitialState() {
  const saved = loadRoster()
  const players = (saved?.players ?? []).slice(0, MAX_PLAYERS).map((p) => ({
    id: p.id || cryptoId(),
    name: p.name,
    color: p.color,
    role: null,
    alive: true,
    hasSeenRole: false,
  }))
  // Repair colors for any legacy/missing entries.
  const used = []
  for (const p of players) {
    if (!p.color) p.color = nextColor(used)
    used.push(p.color)
  }

  const twoImpostors =
    !!saved?.settings?.twoImpostors && players.length >= SECOND_IMPOSTOR_THRESHOLD

  return {
    phase: 'lobby', // lobby|assigning|reveal|inGame|meeting|out|gameOver
    players,
    settings: {
      twoImpostors,
      muted: !!saved?.settings?.muted,
      revealRoleOnOut: !!saved?.settings?.revealRoleOnOut,
    },
    revealIndex: 0,
    meeting: { endsAt: null, pausedRemainingMs: null },
    doctorReviveUsed: false,
    lastOut: null, // player id, for the Out screen
    previousPhase: 'inGame', // where to return after the Out screen
    winner: null, // null | 'impostors' | 'crew' | 'abandoned'
    partner: {}, // impostor id → partner name (two-Impostor game)
    error: null, // transient lobby validation message
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const normalize = (name) => name.trim().replace(/\s+/g, ' ')
const key = (name) => normalize(name).toLowerCase()

function withPersist(state) {
  // Persist the safe subset after every reducer transition that could change it.
  saveRoster(state.players, state.settings)
  return state
}

// Second-Impostor availability is a pure function of roster size.
function clampSecondImpostor(state) {
  if (state.players.length < SECOND_IMPOSTOR_THRESHOLD && state.settings.twoImpostors) {
    return { ...state, settings: { ...state.settings, twoImpostors: false } }
  }
  return state
}

// ─────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────
export function reducer(state, action) {
  switch (action.type) {
    // ── Lobby ──────────────────────────────────────────────
    case 'ADD_PLAYER': {
      const name = normalize(action.name)
      if (!name) return { ...state, error: 'Type a name first.' }
      if (state.players.length >= MAX_PLAYERS)
        return { ...state, error: "15 is the limit. The room's full." }
      if (state.players.some((p) => key(p.name) === key(name)))
        return {
          ...state,
          error: `${name} is already on the crew. Try adding a last initial.`,
        }

      const used = state.players.map((p) => p.color)
      const player = {
        id: cryptoId(),
        name,
        color: nextColor(used),
        role: null,
        alive: true,
        hasSeenRole: false,
      }
      return withPersist(
        clampSecondImpostor({
          ...state,
          players: [...state.players, player],
          error: null,
        }),
      )
    }

    case 'RENAME_PLAYER': {
      const name = normalize(action.name)
      if (!name) return state // ignore empty rename, keep old name
      if (
        state.players.some((p) => p.id !== action.id && key(p.name) === key(name))
      ) {
        return {
          ...state,
          error: `${name} is already on the crew. Try adding a last initial.`,
        }
      }
      return withPersist({
        ...state,
        players: state.players.map((p) =>
          p.id === action.id ? { ...p, name } : p,
        ),
        error: null,
      })
    }

    case 'DELETE_PLAYER': {
      return withPersist(
        clampSecondImpostor({
          ...state,
          players: state.players.filter((p) => p.id !== action.id),
          error: null,
        }),
      )
    }

    case 'CLEAR_ALL':
      return withPersist({
        ...state,
        players: [],
        settings: { ...state.settings, twoImpostors: false },
        error: null,
      })

    case 'DISMISS_ERROR':
      return state.error ? { ...state, error: null } : state

    case 'SET_SETTING': {
      let settings = { ...state.settings, [action.key]: action.value }
      // Guard: can't enable two impostors below threshold.
      if (
        action.key === 'twoImpostors' &&
        action.value &&
        state.players.length < SECOND_IMPOSTOR_THRESHOLD
      ) {
        settings = { ...state.settings, twoImpostors: false }
      }
      return withPersist({ ...state, settings })
    }

    // ── Assigning ──────────────────────────────────────────
    case 'START_GAME': {
      if (state.players.length < MIN_PLAYERS) return state
      const { roles, partner } = assignRoles(
        state.players,
        state.settings.twoImpostors,
      )
      const players = state.players.map((p) => ({
        ...p,
        role: roles.get(p.id),
        alive: true,
        hasSeenRole: false,
      }))
      return {
        ...state,
        players,
        partner: Object.fromEntries(partner),
        phase: 'assigning',
        revealIndex: 0,
        doctorReviveUsed: false,
        lastOut: null,
        winner: null,
        meeting: { endsAt: null, pausedRemainingMs: null },
        error: null,
      }
    }

    case 'ASSIGN_DONE':
      return { ...state, phase: 'reveal', revealIndex: 0 }

    // ── Reveal (pass-the-phone) ────────────────────────────
    case 'MARK_SEEN':
      return {
        ...state,
        players: state.players.map((p, i) =>
          i === state.revealIndex ? { ...p, hasSeenRole: true } : p,
        ),
      }

    case 'NEXT_REVEAL': {
      const next = state.revealIndex + 1
      if (next >= state.players.length) {
        return { ...state, phase: 'inGame', revealIndex: next }
      }
      return { ...state, revealIndex: next }
    }

    // ── Meeting ────────────────────────────────────────────
    case 'CALL_MEETING':
      return {
        ...state,
        phase: 'meeting',
        meeting: { endsAt: action.now + MEETING_MS, pausedRemainingMs: null },
      }

    case 'PAUSE_MEETING': {
      if (state.meeting.pausedRemainingMs != null) return state
      const remaining = Math.max(0, state.meeting.endsAt - action.now)
      return {
        ...state,
        meeting: { endsAt: null, pausedRemainingMs: remaining },
      }
    }

    case 'RESUME_MEETING': {
      if (state.meeting.pausedRemainingMs == null) return state
      return {
        ...state,
        meeting: {
          endsAt: action.now + state.meeting.pausedRemainingMs,
          pausedRemainingMs: null,
        },
      }
    }

    case 'ADD_30S': {
      // Works whether paused or running.
      if (state.meeting.pausedRemainingMs != null) {
        return {
          ...state,
          meeting: {
            ...state.meeting,
            pausedRemainingMs: state.meeting.pausedRemainingMs + 30_000,
          },
        }
      }
      return {
        ...state,
        meeting: { ...state.meeting, endsAt: state.meeting.endsAt + 30_000 },
      }
    }

    case 'END_MEETING':
      return {
        ...state,
        phase: 'inGame',
        meeting: { endsAt: null, pausedRemainingMs: null },
      }

    // ── Elimination + win check ────────────────────────────
    case 'ELIMINATE': {
      const players = state.players.map((p) =>
        p.id === action.id ? { ...p, alive: false } : p,
      )
      const winner = checkWinner(players)
      return {
        ...state,
        players,
        lastOut: action.id,
        // Remember where we came from so "Out" returns correctly, and so a
        // mid-meeting elimination ends the meeting.
        previousPhase: 'inGame',
        phase: 'out',
        meeting: { endsAt: null, pausedRemainingMs: null },
        winner, // may be null; consumed after the Out animation
      }
    }

    // After the Out animation resolves, route to gameOver or back inGame.
    case 'OUT_DONE': {
      if (state.winner) {
        return { ...state, phase: 'gameOver' }
      }
      return { ...state, phase: 'inGame' }
    }

    case 'REVIVE': {
      if (state.doctorReviveUsed) return state
      const players = state.players.map((p) =>
        p.id === action.id ? { ...p, alive: true } : p,
      )
      const winner = checkWinner(players)
      return {
        ...state,
        players,
        doctorReviveUsed: true,
        winner,
        phase: winner ? 'gameOver' : state.phase,
      }
    }

    // ── End / restart ──────────────────────────────────────
    case 'END_GAME':
      return { ...state, phase: 'gameOver', winner: 'abandoned' }

    case 'PLAY_AGAIN': {
      // Keep roster + settings, reshuffle, back to assigning.
      const { roles, partner } = assignRoles(
        state.players,
        state.settings.twoImpostors,
      )
      const players = state.players.map((p) => ({
        ...p,
        role: roles.get(p.id),
        alive: true,
        hasSeenRole: false,
      }))
      return {
        ...state,
        players,
        partner: Object.fromEntries(partner),
        phase: 'assigning',
        revealIndex: 0,
        doctorReviveUsed: false,
        lastOut: null,
        winner: null,
        meeting: { endsAt: null, pausedRemainingMs: null },
      }
    }

    case 'BACK_TO_LOBBY': {
      // Keep roster, wipe all round state so nothing leaks.
      return {
        ...state,
        phase: 'lobby',
        players: state.players.map((p) => ({
          ...p,
          role: null,
          alive: true,
          hasSeenRole: false,
        })),
        partner: {},
        revealIndex: 0,
        doctorReviveUsed: false,
        lastOut: null,
        winner: null,
        meeting: { endsAt: null, pausedRemainingMs: null },
        error: null,
      }
    }

    default:
      return state
  }
}
