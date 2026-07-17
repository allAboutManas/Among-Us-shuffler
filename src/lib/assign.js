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
 * @returns {Map<id, 'impostor'|'doctor'|'crewmate'>} plus partner map
 */
export function assignRoles(players, twoImpostors) {
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

  const doctor = shuffled[impostorCount]
  roles.set(doctor.id, 'doctor')

  shuffled.slice(impostorCount + 1).forEach((p) => roles.set(p.id, 'crewmate'))

  return { roles, partner }
}

// Copy shown by the reveal card and the final roster, per role.
export const ROLE_META = {
  impostor: {
    label: 'Impostor',
    icon: '▲',
    color: 'var(--breach)',
    blurb: "You're the Impostor. Blend in. Eliminate the crew before they figure you out.",
  },
  doctor: {
    label: 'Doctor',
    icon: '✚',
    color: 'var(--triage)',
    blurb: "You're the Doctor. You can revive one eliminated player, once per game.",
  },
  crewmate: {
    label: 'Crewmate',
    icon: '●',
    color: 'var(--signal)',
    blurb: "You're a Crewmate. Finish your tasks and find the Impostor.",
  },
}
