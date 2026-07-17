import { fisherYates } from './random.js'

// Role assignment. Uniformly random every round, no memory of previous
// rounds (R4). The shuffle here is the real one — the Assigning screen's
// animation is pure theater over this result.
//
//   shuffled  = fisherYates(players)
//   impostors = shuffled.slice(0, twoImpostors ? 2 : 1)
//   doctor    = shuffled[impostors.length]
//   crewmates = the rest

/**
 * @param {Array} players  roster entries (need at least { id })
 * @param {boolean} twoImpostors
 * @param {boolean} [detective=false]  assign one Detective after the Doctor
 * @returns {{ roles: Map, partner: Map }}
 */
export function assignRoles(players, twoImpostors, detective = false) {
  const shuffled = fisherYates(players)
  const impostorCount = twoImpostors ? 2 : 1

  const roles = new Map()
  const partner = new Map() // impostor id → partner's name

  const impostors = shuffled.slice(0, impostorCount)
  impostors.forEach((p) => roles.set(p.id, 'impostor'))

  // In a two-Impostor game each Impostor is told their partner's name.
  if (impostors.length === 2) {
    partner.set(impostors[0].id, impostors[1].name)
    partner.set(impostors[1].id, impostors[0].name)
  }

  // Doctor, then (optionally) Detective, then everyone else Crewmates.
  let cursor = impostorCount
  roles.set(shuffled[cursor].id, 'doctor')
  cursor += 1

  if (detective && shuffled[cursor]) {
    roles.set(shuffled[cursor].id, 'detective')
    cursor += 1
  }

  shuffled.slice(cursor).forEach((p) => roles.set(p.id, 'crewmate'))

  return { roles, partner }
}

// Copy shown by the reveal card and the final roster, per role.
//
// NOTE: the internal role keys stay 'impostor' / 'crewmate' so none of the
// game logic changes — only the player-facing labels/icons are themed. The
// village is under threat from a Werewolf hiding among them.
export const ROLE_META = {
  impostor: {
    label: 'Werewolf',
    icon: '☾',
    color: 'var(--breach)',
    blurb:
      "You're the Werewolf. Blend in with the village. Pick off the villagers before they figure you out.",
  },
  doctor: {
    label: 'Doctor',
    icon: '✚',
    color: 'var(--triage)',
    blurb: "You're the Doctor. You can revive one fallen player, once per game.",
  },
  detective: {
    label: 'Detective',
    icon: '◎',
    color: 'var(--sleuth)',
    blurb:
      "You're the Detective. Once per game you can investigate a player — if they're a Werewolf, they're caught.",
  },
  crewmate: {
    label: 'Villager',
    icon: '⌂',
    color: 'var(--signal)',
    blurb: "You're a Villager. Stay alive and root out the Werewolf.",
  },
}
