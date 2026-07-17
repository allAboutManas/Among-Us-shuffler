// localStorage for the ROSTER and the twoImpostors preference ONLY.
//
// NEVER persist roles or alive flags. A mid-game refresh must END the game,
// not resume it with the Impostor exposed in devtools (A18).

const KEY = 'crewcall.v1'

/**
 * Persist only the safe subset: player identities (no roles, no alive) and
 * the round-option preferences.
 */
export function saveRoster(players, settings) {
  try {
    const safe = {
      players: players.map((p) => ({ id: p.id, name: p.name, color: p.color })),
      settings: {
        twoImpostors: !!settings.twoImpostors,
        muted: !!settings.muted,
        revealRoleOnOut: !!settings.revealRoleOnOut,
      },
    }
    localStorage.setItem(KEY, JSON.stringify(safe))
  } catch {
    // Private mode / quota / disabled storage — degrade silently.
  }
}

export function loadRoster() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.players)) return null
    return {
      players: parsed.players
        .filter((p) => p && typeof p.name === 'string')
        .map((p) => ({
          id: p.id || cryptoId(),
          name: p.name,
          color: p.color,
        })),
      settings: {
        twoImpostors: !!parsed.settings?.twoImpostors,
        muted: !!parsed.settings?.muted,
        revealRoleOnOut: !!parsed.settings?.revealRoleOnOut,
      },
    }
  } catch {
    return null
  }
}

export function clearRoster() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

// Small crypto id helper reused by the reducer too.
export function cryptoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'p_' + Math.abs(Date.now() ^ (Math.random() * 1e9)).toString(36)
}
