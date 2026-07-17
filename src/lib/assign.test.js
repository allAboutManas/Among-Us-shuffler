import { describe, it, expect } from 'vitest'
import { assignRoles } from './assign.js'

const makeCrew = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}` }))

describe('assignRoles', () => {
  it('always produces exactly one Doctor and the right Impostor count (A4)', () => {
    const players = makeCrew(6)
    for (let r = 0; r < 500; r++) {
      const { roles } = assignRoles(players, false)
      const vals = players.map((p) => roles.get(p.id))
      expect(vals.filter((v) => v === 'doctor').length).toBe(1)
      expect(vals.filter((v) => v === 'impostor').length).toBe(1)
      expect(vals.filter((v) => v === 'crewmate').length).toBe(4)
    }
  })

  it('produces two Impostors when enabled, still exactly one Doctor (A4)', () => {
    const players = makeCrew(11)
    for (let r = 0; r < 300; r++) {
      const { roles, partner } = assignRoles(players, true)
      const vals = players.map((p) => roles.get(p.id))
      expect(vals.filter((v) => v === 'impostor').length).toBe(2)
      expect(vals.filter((v) => v === 'doctor').length).toBe(1)
      // Each Impostor knows their partner (A6).
      const impostors = players.filter((p) => roles.get(p.id) === 'impostor')
      expect(partner.get(impostors[0].id)).toBe(impostors[1].name)
      expect(partner.get(impostors[1].id)).toBe(impostors[0].name)
    }
  })

  it('is uniformly random — every player is Impostor ~1/6 of the time (A3)', () => {
    const players = makeCrew(6)
    const rounds = 6000
    const impostorCounts = Object.fromEntries(players.map((p) => [p.id, 0]))
    for (let r = 0; r < rounds; r++) {
      const { roles } = assignRoles(players, false)
      for (const p of players) {
        if (roles.get(p.id) === 'impostor') impostorCounts[p.id]++
      }
    }
    const expected = 1 / 6
    for (const p of players) {
      const rate = impostorCounts[p.id] / rounds
      // Well within the ±3% acceptance band with a comfortable sample size.
      expect(Math.abs(rate - expected)).toBeLessThan(0.03)
    }
  })
})
