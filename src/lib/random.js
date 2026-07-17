// Cryptographically-seeded Fisher-Yates.
//
// NOT Math.random() (predictable, low entropy) and NEVER
// array.sort(() => Math.random() - 0.5) — that's measurably biased.
// This is the fairness guarantee behind acceptance criterion A3.

/**
 * Return an unbiased random integer in [0, max) using rejection sampling
 * on crypto.getRandomValues, avoiding the modulo bias you'd get from
 * `getRandomValues % max`.
 */
export function randInt(max) {
  if (max <= 0) return 0
  const uint32 = new Uint32Array(1)
  const ceiling = Math.floor(0xffffffff / max) * max
  let x
  do {
    crypto.getRandomValues(uint32)
    x = uint32[0]
  } while (x >= ceiling)
  return x % max
}

/**
 * Return a NEW array that is a uniformly-random permutation of `input`.
 * Does not mutate the input.
 */
export function fisherYates(input) {
  const a = input.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
