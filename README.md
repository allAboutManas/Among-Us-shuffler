# Crew Call

A single-device companion app for playing Among Us-style social deduction games **in person**. It does the three annoying-by-hand jobs — secret role assignment, meeting timing, and knowing exactly when the game is over — and nothing else. The group still argues and votes out loud.

One phone. No accounts. No backend. Works in airplane mode.

> **Naming / trademark:** "Among Us" and its bean crewmate are Innersloth's protected assets. Game *mechanics* aren't copyrightable, so this ships under the working name **Crew Call** with an original visual identity (*Cold Vacuum*). Rename deliberately before you publish anything.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173  (also exposed on your LAN)
```

Open the Network URL on a real phone on the same Wi-Fi to test it where it actually lives: in a dark room, held by one person, with six people yelling.

```bash
npm run build    # production bundle in dist/  (~95 kB gzipped)
npm run preview  # serve the built bundle
npm test         # unit + integration + DOM smoke tests
```

## How a round goes

1. **Lobby** — type everyone in (4–15 players). At 10+, a toggle offers a second Werewolf.
2. **Assigning** — a ~2.5s shuffle. Roles are already decided; the animation is pure theater (watch for the red-herring flicker).
3. **Reveal** — pass the phone. Each player **presses and holds** their sealed card to peek. A cover screen hides everything between hand-offs, so nothing leaks.
4. **In game** — living roster + ghosts. Tap a name to mark them out (one confirm). Call a 2-minute meeting whenever.
5. **Game over** — the app runs the win check after every elimination and revive, and calls the game the instant it's decided.

Roles: **1 Werewolf** (or 2 at 10+ players), **exactly 1 Doctor** (one revive per game), an optional **Detective** (one investigation per game), everyone else a **Villager**. *(The internal role keys stay `impostor`/`crewmate` — only the player-facing theme changed, so the game logic is untouched.)*

## Architecture

- **React 18 + Vite + Tailwind + Framer Motion.** Fully client-side.
- **State:** one reducer at the app root (`src/state/reducer.js`). No Redux/Zustand.
- **Fairness:** Fisher-Yates seeded from `crypto.getRandomValues()` with rejection sampling — never `Math.random()`, never `sort(() => Math.random()-0.5)` (`src/lib/random.js`).
- **Win check:** a pure function, unit-tested first (`src/lib/winCheck.js`). The village wins when all Werewolves are out; the Werewolves win when they reach parity with the village.
- **Timer:** drift-free. Stores an absolute `endsAt` and derives the remaining time from the wall clock on a 250ms tick, re-syncing on `visibilitychange` — so it stays accurate even when the tab is backgrounded (`src/hooks/useTimer.js`).
- **Persistence:** `localStorage` holds only the roster and preferences. **Roles and alive-flags are never persisted** — a mid-game refresh ends the game rather than leaking who the Werewolf is.

## Design — *Cold Vacuum*

A cold, industrial ship's terminal. The only warmth is the players' own color chips. Tokens live as CSS custom properties in `src/index.css`:

| Token | Use |
|---|---|
| `--void` / `--hull` / `--strut` | background / cards / borders |
| `--signal` (mint) | primary accent, crew win |
| `--breach` (red) | Werewolf, "out", final 10s, Werewolf win |
| `--triage` (amber) | Doctor, timer warning |
| `--sleuth` (blue) | Detective |

The signature transition is the **airlock**: two blast-door panels part with a seam of light, used sparingly for entering Assigning, the "Out" moment, and Game Over.

### Accessibility

- `prefers-reduced-motion` is honored throughout (airlock → crossfade, shuffle → static state, timer pulse → color only).
- Roles are never communicated by color alone — always color **+ icon + text**.
- The timer alarm is audio **and** visual **and** haptic.
- 48px minimum tap targets; visible keyboard focus rings; ≥4.5:1 text contrast.

## Tests

```bash
npm test
```

- `winCheck.test.js` — every endgame shape (1- and 2-Impostor parity, crew win, revive un-ending an endgame, degenerate cases).
- `assign.test.js` — exactly one Doctor and the right Impostor count every round; uniform distribution (each of 6 players is Impostor ~1/6 across 6000 rounds).
- `reducer.test.js` — full game driven through the state machine (duplicate rejection, 4-player floor, 15 cap, second-Impostor reset, mid-meeting elimination, all win paths).
- `smoke.test.jsx` — every screen mounts in jsdom without crashing.
