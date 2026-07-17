import { describe, it, expect } from 'vitest'
import { checkWinner } from './winCheck.js'

// Small helpers so the test cases read like the game state, not like data.
const imp = (alive = true) => ({ role: 'impostor', alive })
const doc = (alive = true) => ({ role: 'doctor', alive })
const crew = (alive = true) => ({ role: 'crewmate', alive })

describe('checkWinner', () => {
  it('game continues at the start of a normal round', () => {
    expect(checkWinner([imp(), doc(), crew(), crew()])).toBe(null)
  })

  it('1-Impostor endgame: 2 left and one is the Impostor → impostors win (1 >= 1)', () => {
    // Down to the Impostor + one Crewmate.
    expect(checkWinner([imp(true), doc(false), crew(false), crew(true)])).toBe(
      'impostors',
    )
  })

  it('crew win: the single Impostor is ejected while others live', () => {
    expect(checkWinner([imp(false), doc(true), crew(true), crew(true)])).toBe(
      'crew',
    )
  })

  it('2-Impostor endgame: 2 impostors vs 2 non-impostors → impostors win (2 >= 2)', () => {
    expect(
      checkWinner([imp(true), imp(true), doc(true), crew(true), crew(false), crew(false)]),
    ).toBe('impostors')
  })

  it('2-Impostor game continues while crew still outnumbers them', () => {
    // 2 impostors vs 3 non-impostors → 2 >= 3 is false → continues.
    expect(
      checkWinner([imp(true), imp(true), doc(true), crew(true), crew(true)]),
    ).toBe(null)
  })

  it('2-Impostor crew win: both impostors ejected', () => {
    expect(
      checkWinner([imp(false), imp(false), doc(true), crew(true), crew(true)]),
    ).toBe('crew')
  })

  it('revive un-ends a would-be endgame', () => {
    // The endgame state: impostor wins.
    const endgame = [imp(true), doc(false), crew(true)]
    expect(checkWinner(endgame)).toBe('impostors')
    // Doctor revives a crewmate → now 1 impostor vs 2 non-impostors → continues.
    const revived = [imp(true), doc(false), crew(true), crew(true)]
    expect(checkWinner(revived)).toBe(null)
  })

  it('degenerate case: everyone but the Impostor eliminated → impostors win', () => {
    expect(checkWinner([imp(true), doc(false), crew(false), crew(false)])).toBe(
      'impostors',
    )
  })

  it('crew wins the instant the last living impostor is ejected, even with many crew out', () => {
    expect(
      checkWinner([imp(false), imp(false), doc(false), crew(true), crew(false)]),
    ).toBe('crew')
  })
})
