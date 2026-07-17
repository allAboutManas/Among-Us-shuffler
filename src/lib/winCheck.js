// The highest-stakes logic in the app. A wrong answer here ruins a round.
// Pure, no side-effects, unit-tested first (see winCheck.test.js).
//
// Called after EVERY confirmed elimination AND after every revive.

/**
 * @param {Array<{role: string, alive: boolean}>} players
 * @returns {'crew' | 'impostors' | null}
 *   'crew'      — all impostors are out (W1)
 *   'impostors' — living impostors >= living non-impostors (W2)
 *   null        — game continues (W3)
 */
export function checkWinner(players) {
  const living = players.filter((p) => p.alive)
  const livingImpostors = living.filter((p) => p.role === 'impostor').length

  // W1 — all Impostors marked out.
  if (livingImpostors === 0) return 'crew'

  // W2 — living Impostors >= living non-Impostors.
  // General form of "two left, one is the Impostor": at that point the
  // crew can no longer win a vote, so the game is already decided.
  const livingNonImpostors = living.length - livingImpostors
  if (livingImpostors >= livingNonImpostors) return 'impostors'

  // W3 — game continues.
  return null
}
