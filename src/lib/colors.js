// Player chip colors — a 12-strong roster, saturated and distinct at a
// glance. Colorblind-checked: no pairing carries meaning by red/green
// alone (roles are never communicated by chip color anyway).
//
// These are deliberately NOT the semantic tokens (--signal/--breach/--triage);
// the warmth of the interface is supposed to come only from the players.

export const CHIP_COLORS = [
  { name: 'Coral', hex: '#FF6B6B' },
  { name: 'Amber', hex: '#FFA94D' },
  { name: 'Gold', hex: '#FFD43B' },
  { name: 'Lime', hex: '#A9E34B' },
  { name: 'Mint', hex: '#38D9A9' },
  { name: 'Aqua', hex: '#3BC9DB' },
  { name: 'Sky', hex: '#4DABF7' },
  { name: 'Indigo', hex: '#748FFC' },
  { name: 'Violet', hex: '#9775FA' },
  { name: 'Orchid', hex: '#DA77F2' },
  { name: 'Rose', hex: '#F783AC' },
  { name: 'Sand', hex: '#D6B48C' },
]

/**
 * Pick the first chip color not already used by a living player.
 * Falls back to cycling if somehow all 12 are taken (>12 players is blocked
 * by the roster cap of 15, but pick deterministically-distinct regardless).
 */
export function nextColor(usedHexes) {
  const free = CHIP_COLORS.find((c) => !usedHexes.includes(c.hex))
  if (free) return free.hex
  return CHIP_COLORS[usedHexes.length % CHIP_COLORS.length].hex
}
