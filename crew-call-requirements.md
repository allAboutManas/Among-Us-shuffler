# Crew Call — Requirements Document

**A role-assignment, meeting-timer, and elimination-tracker companion app for playing social deduction games in real life.**

Version 1.2 · Draft · Owner: *[you]*

**Changes in this version:**
- The in-app vote screen is **gone**. The host marks a player out with a tap + confirmation popup. The group still votes out loud, exactly as they do now.
- The app now **tracks eliminations and declares the winner automatically** — including the endgame moment where two players remain and one of them is the Impostor.
- **Second Impostor option**: when the roster reaches 10+ players, the app asks whether you want two Impostors this round.

---

## 1. Product summary

Crew Call is a single-device React web app that replaces the paper slips, hat-drawing, and phone stopwatch that people currently use when playing Among Us-style social deduction games in person.

One person (the **host**) holds the phone. Everyone types their name in. The app secretly assigns the Impostor(s), one Doctor, and makes everyone else a Crewmate. Players pass the phone around to privately peek at their own role. When someone calls an emergency meeting, the host starts a 2-minute timer everyone can see. Whenever a player is out — voted out by the group, or eliminated by the Impostor — the host taps their name and confirms it in a popup. The app tracks who's left and calls the game the instant it's decided.

**What this app is not:** it is not the game. It doesn't track tasks, kill cooldowns, or sabotage, and it doesn't run votes. The group argues and decides out loud. The app does the three jobs that are annoying to do by hand — secret role assignment, meeting timing, and knowing exactly when the game is over.

### Naming note (read this before you ship)

"Among Us" is a trademarked game by Innersloth, and its character shapes, colors, and typography are their protected assets. Building a companion tool with the same *mechanics* is fine — game mechanics aren't copyrightable — but shipping something called "Among Us IRL" with the bean-shaped crewmate is asking for a takedown. This document uses the working name **Crew Call** and specifies an original visual identity that evokes the genre without copying it. Adjust as you see fit, but decide deliberately.

---

## 2. Goals and non-goals

### Goals

| # | Goal |
|---|---|
| G1 | Assign roles randomly, secretly, and fairly in under 30 seconds |
| G2 | Let each player see their own role without anyone else seeing it |
| G3 | Run a 2-minute meeting timer that is visible and audible across a noisy room |
| G4 | Let the host mark a player out in two taps — and never by accident |
| G5 | Detect and announce the winner automatically, the instant the game is decided |
| G6 | Support a second Impostor for big groups (10+), chosen by the host per round |
| G7 | Work on one phone, offline, with no accounts and no backend |

### Non-goals (v1)

- Multi-device / networked play — no server, no rooms, no sync
- **In-app voting.** No ballots, no tallies, no vote screens. The group votes out loud; the host records the outcome with a single tap.
- Task tracking, kill cooldowns, sabotage, or score history
- More than two Impostors, or more than one Doctor
- User accounts, persistence across sessions, or analytics

---

## 3. Roles and rules

| Role | Count | Description shown to player |
|---|---|---|
| **Impostor** | 1 (or 2, host's choice at 10+ players) | You're the Impostor. Blend in. Eliminate the crew before they figure you out. |
| **Doctor** | Exactly 1 | You're the Doctor. You can revive one eliminated player, once per game. |
| **Crewmate** | Everyone else | You're a Crewmate. Finish your tasks and find the Impostor. |

If there are two Impostors, each Impostor's role card also names their partner: *"Your fellow Impostor is Priya."* Impostors knowing each other is what makes a two-Impostor game work.

### Rules

- **R1** — Minimum 4 players. Below that, 1 Impostor + 1 Doctor leaves fewer than 2 Crewmates and the game is trivial. Block Start with an explanatory message.
- **R2** — Maximum 15 players. Soft cap for the layout; enforce it.
- **R3** — Names must be non-empty after trimming and unique (case-insensitive). "Rohan" and "rohan" are the same person.
- **R4** — Assignment is uniformly random. Every player has an equal chance of every role, every round. No memory of previous rounds.
- **R5** — Roles are hidden by default. The full role list is never displayed before Game Over.
- **R6** — **Second Impostor**: available only when the roster has **10 or more players**. It is a per-round choice, asked at Start (see §5.1), defaulting to **off**. If players are deleted back below 10 before Start, the choice silently resets to one Impostor.

### Win conditions — the app decides these, not the host

After **every** confirmed elimination, and after the Doctor's revive, the app runs the win check:

| # | Condition | Result |
|---|---|---|
| W1 | All Impostors have been marked out | **Crew wins** |
| W2 | Living Impostors ≥ living non-Impostors | **Impostor wins** |
| W3 | Otherwise | Game continues |

W2 is the general form of your "two players left and one is the Impostor" moment: with one Impostor, it triggers exactly when 2 players remain and one of them is the Impostor (1 ≥ 1). With two Impostors, it triggers at 2-Impostors-vs-2 (or an earlier equivalent), because at that point the crew can no longer win a vote. The app doesn't wait for the host to notice — the instant the confirming tap lands, the game ends itself.

- **Impostor win banner:** the Impostor name(s), roles revealed, and the message — verbatim, this exact string — **"Winner Winner Alhua Dinner"** 🍗
- **Crew win banner:** *"The crew survives."* with the ejected Impostor(s) revealed.

---

## 4. User flow

```
┌──────────────┐
│ 1. LOBBY     │  Add / edit / delete player names.
└──────┬───────┘  At 10+ players: "Second Impostor?" toggle appears.
       │  [Start game] — enabled at ≥4 names
       ▼
┌──────────────┐
│ 2. ASSIGNING │  Shuffle animation, ~2.5s, non-skippable
└──────┬───────┘
       ▼
┌──────────────┐
│ 3. REVEAL    │  Pass-the-phone. One sealed card per player.
└──────┬───────┘
       │  [Everyone's ready]
       ▼
┌──────────────┐
│ 4. IN GAME   │◄────────────────────────────┐
└──┬────────┬──┘  Living roster + ghosts.    │
   │        │     [Call meeting].            │
   │        │                                │
   │        │ [Call meeting]                 │
   │        ▼                                │
   │  ┌──────────────┐                       │
   │  │ 5. MEETING   │  2:00 countdown.      │
   │  └──────┬───────┘  Pause / +30s.        │
   │         │  0:00 alarm, or [End meeting] │
   │         └───────────────────────────────┤
   │                                         │
   │  host taps a living player's name       │
   ▼                                         │
┌──────────────┐                             │
│ 6. CONFIRM   │  "Rohan is out?"            │
└──────┬───────┘  [Cancel]  [Yes, they're    │
       │                     out]            │
       ▼                                     │
┌──────────────┐                             │
│ 7. OUT       │  Name drifts into the void  │
└──────┬───────┘                             │
       ▼                                     │
   ◇ WIN CHECK ◇ ────── game continues ──────┘
       │
       │  W1 or W2 met  (or host taps [End game])
       ▼
┌──────────────┐
│ 8. GAME OVER │  Winner banner + full role reveal.
└──────────────┘  Impostor win → "Winner Winner Alhua Dinner"
                  [Play again] keeps the roster.
```

Note the timer and eliminations are **independent**: the host can mark someone out during a meeting, between meetings, or without ever starting one. Real games are messy; the app doesn't enforce an order.

---

## 5. Screen-by-screen requirements

### 5.1 Lobby

**Purpose:** collect the roster and set the round options.

- Single text input, always focused, with a **+ Add** button. Enter key also adds.
- Names appear as a vertical list of cards, newest at the bottom, each animating in.
- Each card has: an auto-assigned color chip, the name, and a **✕** delete button.
- Tapping a name makes it editable inline. Blur or Enter commits.
- A live counter that reflects the current settings: "11 players · 2 Impostors · 1 Doctor · 8 Crewmates".
- **Second Impostor control:** the moment the roster hits **10 players**, a toggle card slides in beneath the counter: **"Big crew. Want a second Impostor?"** with Off/On. Default **Off**. It slides back out (and resets to Off) if the roster drops below 10. This is a visible toggle rather than a popup at Start so the group can see and argue about the setting before roles are dealt — a hidden setting the host controls alone invites accusations.
- **Start game** button: disabled below 4 players, with helper text "Add at least 4 players to start." Never a silent disabled button — always say why.
- **Clear all** with a confirmation step.
- Empty state: not "No players yet." Something like "Nobody's here. Add the first name."

**Validation messages** (in the interface's voice, no apologies):
- Empty input → *"Type a name first."*
- Duplicate → *"Rohan is already on the crew. Try adding a last initial."*
- Over 15 → *"15 is the limit. The room's full."*

### 5.2 Assigning

- Full-screen shuffle animation, roughly 2.5 seconds, **not skippable** — a deliberate stall so the host can't be accused of peeking, and it builds tension.
- Suggested treatment: the player name-chips scatter, spin, and slot back into a column. One chip flickers red for a single frame near the end and then resolves. It means nothing. It's a red herring. It's the fun part.
- Roles are computed *before* the animation starts and stored in state; the animation is pure theater.
- Assignment order after the shuffle: first 1–2 shuffled players → Impostor(s), next player → Doctor, rest → Crewmates.

### 5.3 Reveal (pass-the-phone)

This is the screen where the whole design earns its keep. Get it wrong and the game leaks.

- Shows one **sealed card** at a time, in roster order, labelled with only the player's name: *"Pass to Rohan."*
- Rohan taps **Hold to reveal** — a press-and-hold (800ms), not a tap. A tap can fire accidentally when handing the phone over; a hold cannot.
- While held, the card flips to show the role. In a two-Impostor game, an Impostor's card also shows their partner's name. Releasing flips it straight back.
- **"Got it — pass it on"** button advances to the next player.
- **No back button.** Once a card is confirmed, it's gone. If someone mis-taps, that's a re-roll of the whole game, and that's the correct behavior.
- A **"Hide screen"** cover appears between players — a tap-to-continue interstitial so no role is ever on screen while the phone is in the air.
- After the last player: **"Everyone's in. Start the round."**

### 5.4 In game

The home screen of the whole game — the host returns here after every meeting and every elimination.

- A **living roster**: every player still in, as a tappable name card with their color chip. Names only, never roles.
- A **ghost list** below it: players who are out, greyed to ~40% opacity, name struck through, not tappable.
- A living count: **"5 still in."**
- A large, unmissable **Call meeting** button in the bottom third, thumb-reachable.
- **Tapping a living player's name** opens the confirm popup (§5.6). This one action covers both cases — voted out by the group, or eliminated by the Impostor between meetings. The app doesn't care which and doesn't ask.
- **Doctor's revive** — a small **"Revive a player"** action, usable **once per game**, that lets the host move one ghost back to the living roster (with its own confirmation). After use it's gone. Reviving re-runs the win check.
- **End game** in the corner, with confirmation — for when the round falls apart and everyone just wants to see the roles.

The host is holding this screen in a dark room while six people yell. Tap targets are minimum 48px tall with real spacing between them.

### 5.5 Meeting timer

- **Duration: 120 seconds**, counting down, displayed as `M:SS` at the largest type size in the app.
- Controls: **Pause**, **+30s**, **End meeting**.
- **Visual escalation** — readable from across a loud room by someone not holding the phone:
  - 120–30s: calm accent color, steady
  - 30–10s: color shifts to warning, subtle pulse begins
  - 10–0s: red, per-second pulse, digits scale up on each tick
- **Audio:** a soft tick at 30s, a distinct beep for the final 5 seconds, and an alarm at 0:00. Mute toggle required; its state persists for the session.
- **Haptics:** `navigator.vibrate()` at 10s and 0s where supported.
- **Screen wake lock:** request `navigator.wakeLock` on meeting start so the phone doesn't sleep mid-argument. Release on meeting end.
- **At 0:00:** full-screen **"Time's up — talk it out and decide."** takeover with the alarm, then a single **Back to crew** button returning to In Game, where the host records whatever the group decided. There is no vote screen. The timer's job is to end the discussion, not to run the vote.
- The living roster stays visible (compact) below the timer during the meeting, still tappable — groups often decide before the clock runs out, and the host shouldn't have to wait for 0:00 to mark someone out. Marking someone out during a meeting ends the meeting.

### 5.6 Confirm popup ("he's out")

The single most consequential tap in the app, so it's guarded — but only once. One confirmation, not two; a host doing this eight times a game will riot at double confirms.

- Triggered by tapping a living player's name, anywhere it appears.
- A bottom sheet slides up, dimming everything behind it:
  - The player's color chip and name, large.
  - **"Rohan is out?"**
  - Two buttons: **Cancel** (quiet) and **Yes, they're out** (loud, full-width, styled in `--breach` red).
- Tapping the dimmed backdrop = Cancel. The destructive action is never the easy accident.
- The popup does **not** reveal the player's role, and does not ask *how* they went out. Both would leak information or slow the game down.
- On confirm → Out animation (§5.7) → win check.

### 5.7 Out

- A brief full-screen moment (~2.5s, skippable by tap): *"Rohan is out."* — the player's chip drifts off-screen into the void, slow ease-in.
- **It does not say whether they were the Impostor.** The win check says it for you: if the game keeps going after an ejection, the room learns the crew guessed wrong. That silence *is* the reveal mechanic.
- Optional host-only lobby setting: **"Reveal role when someone's out"** — default **off**.
- Auto-returns to In Game (or straight into Game Over if the win check fired).

### 5.8 Game over

Two ways in: the win check fires, or the host taps **End game**.

- **Impostor victory:** the airlock slams shut, then opens on a `--breach`-red screen. The Impostor name(s) and chip(s), the word **IMPOSTOR** in the display face, and the banner — exactly this string — **"Winner Winner Alhua Dinner"** 🍗 with a suitably dramatic animation (confetti in red, chips strutting, whatever lands — this is the screen to over-animate).
- **Crew victory:** `--signal`-green screen, *"The crew survives."*, the ejected Impostor(s) revealed with their chips floating off into the void.
- **Host-ended game:** neutral treatment, *"Round abandoned."*, straight to the reveal.
- Below the banner in all cases: the **full role reveal** — every player and their role, Impostors first.
- **Play again** — keeps the roster and settings, reshuffles roles, returns to Assigning.
- **Back to lobby** — keeps the roster, lets you edit it.

---

## 6. Design direction

The brief asks for "creative, animated, Among Us-based." Here's a direction that gets the feeling without borrowing the assets.

### Concept: *Cold Vacuum*

Not the candy-colored cartoon read. This leans into the actual premise — a small crew, a long way from anywhere, and one of them is lying. The interface is the ship's terminal: cold, industrial, slightly hostile. The warmth comes only from the players' own name-chips, which is thematically the point.

### Tokens

**Color**

| Token | Hex | Use |
|---|---|---|
| `--void` | `#0A0E14` | Background |
| `--hull` | `#161C26` | Cards, panels |
| `--strut` | `#2B3646` | Borders, dividers |
| `--vapor` | `#E8EDF2` | Primary text |
| `--signal` | `#4DFFC3` | Primary accent — buttons, crew win |
| `--breach` | `#FF3B5C` | Impostor, "out" confirm, final 10s, Impostor win |
| `--triage` | `#FFB84D` | Doctor, warning state |

Player chips draw from a separate 12-color roster — saturated, distinct at a glance, colorblind-checked (no red/green-only pairing carrying meaning).

**Type**

- **Display:** a condensed industrial face — *Oswald*, *Archivo Narrow*, or *Bebas Neue*. Used for the timer, role reveals, and the winner banner only, at large sizes. Restraint is what makes it land.
- **Body/UI:** *Inter* or *Space Grotesk*. Sentence case throughout.
- **Numerics:** the timer must use **tabular figures** (`font-variant-numeric: tabular-nums`) or the digits will jitter every second and it will drive you insane.

**Layout**

Mobile-first, single column, max-width 480px, centered on desktop. Primary actions in the bottom third, thumb-reachable.

### Signature element: the airlock

Screen transitions aren't fades. They're a **two-panel airlock door** that slides shut across the screen, with a thin `--signal` seam of light down the middle, then parts to reveal the next screen. Used for exactly four moments: entering Assigning, each reveal card flip, the "Out" moment, and Game Over. Everywhere else, transitions are quiet. Spend the boldness in one place.

### Motion inventory

| Element | Motion |
|---|---|
| Name card add | Slide up + fade, 200ms, ease-out |
| Name card delete | Collapse height + fade, 150ms |
| Second-Impostor toggle appears | Slide in at 10 players, 250ms |
| Shuffle | Chips scatter → orbit → snap to column, 2500ms total |
| Card flip | 3D `rotateY`, 400ms, spring easing |
| Timer final 10s | Scale 1 → 1.08 → 1 per tick, red glow pulse |
| Confirm sheet | Slide up 250ms; "Yes" button has a pressed state you can feel |
| Out | Chip drifts off-screen into the void, 1200ms, slow ease-in |
| Impostor win | Airlock slam → red flood → banner drop, ~2s sequence |
| Airlock | Two panels, 350ms each direction, seam glow |

### Accessibility floor

Non-negotiable, and don't announce it in the UI — just do it:

- `prefers-reduced-motion` respected: airlock → 120ms crossfade, shuffle → static 800ms "Assigning…" state, timer pulse → color change only, win sequence → static banner.
- Visible keyboard focus rings on every interactive element.
- Contrast ≥ 4.5:1 for all text.
- Role is never communicated by color alone — always color + icon + text label.
- The timer alarm is audio *and* visual *and* haptic.

---

## 7. Technical requirements

### Stack

- **React 18+**, functional components and hooks
- **Vite** for the build
- **Tailwind CSS**, with the tokens above as CSS custom properties
- **Framer Motion** for the airlock, card flips, shuffle, and win sequence
- **No backend. No database. No network calls.** Fully client-side, works in airplane mode.

### Randomization

Fisher-Yates shuffle seeded from `crypto.getRandomValues()` — not `Math.random()`, and never `array.sort(() => Math.random() - 0.5)`, which is measurably biased.

```
shuffled = fisherYates(players)
impostors = shuffled.slice(0, settings.twoImpostors ? 2 : 1)
doctor    = shuffled[impostors.length]
crewmates = the rest
```

### State

A single reducer at the app root. No Redux/Zustand needed at this scale.

```js
{
  phase: 'lobby' | 'assigning' | 'reveal' | 'inGame' | 'meeting' | 'out' | 'gameOver',
  players: [{ id, name, color, role: null|'impostor'|'doctor'|'crewmate', alive: true, hasSeenRole: false }],
  settings: { twoImpostors: false, muted: false, revealRoleOnOut: false },
  revealIndex: 0,
  meeting: { endsAt: null, pausedRemainingMs: null },
  doctorReviveUsed: false,
  lastOut: null,          // player id, for the Out screen
  winner: null            // null | 'impostors' | 'crew' | 'abandoned'
}
```

### Win check (pure function, unit-test this first)

```js
function checkWinner(players) {
  const living = players.filter(p => p.alive);
  const livingImpostors = living.filter(p => p.role === 'impostor').length;
  if (livingImpostors === 0) return 'crew';
  if (livingImpostors >= living.length - livingImpostors) return 'impostors';
  return null;
}
```

Called after every elimination **and** after every revive. This is the highest-stakes logic in the app — a wrong answer here ruins a round — so it ships with unit tests covering: 1-Impostor endgame (2 left), 2-Impostor endgame, crew win with one Impostor remaining ejected, revive that un-ends a would-be endgame, and the degenerate all-but-Impostor-eliminated case.

### Timer implementation

Do **not** use a naive `setInterval` decrement — it drifts, and browsers throttle intervals in background tabs. Store an absolute `endsAt = Date.now() + 120000`; derive `secondsLeft = Math.ceil((endsAt - Date.now()) / 1000)` on a 250ms tick. On pause, store `pausedRemainingMs`; on resume, recompute `endsAt`. Re-sync on `visibilitychange`.

### Persistence

`localStorage` for the roster and the `twoImpostors` preference only. **Never persist roles or the `alive` flags** — a mid-game refresh should end the game, not resume it with the Impostor exposed in devtools.

### Browser support

Modern mobile Safari and Chrome. Test on a real phone, held by a real person, in a real room with the lights off — that's the actual deployment environment.

---

## 8. Acceptance criteria

| # | Criterion |
|---|---|
| A1 | Start is blocked below 4 players, with a visible reason |
| A2 | Duplicate names (case-insensitive) are rejected at input |
| A3 | Over 200 simulated rounds with 6 players, each player is Impostor within 16.7% ± 3% |
| A4 | Exactly one Doctor exists every round; Impostor count matches the toggle (1, or 2 when enabled) |
| A5 | The second-Impostor toggle only appears at 10+ players, and resets to off if the roster drops below 10 |
| A6 | In a two-Impostor game, each Impostor's reveal card names their partner |
| A7 | No screen ever displays two players' roles simultaneously before Game Over |
| A8 | Reveal requires an 800ms hold, not a tap |
| A9 | Marking a player out always requires the confirmation popup; backdrop tap cancels |
| A10 | With 1 Impostor: eliminating players down to 2 living, one of them the Impostor, immediately shows the Impostor win screen with the exact text "Winner Winner Alhua Dinner" |
| A11 | Eliminating the last living Impostor immediately shows the crew win screen |
| A12 | The Doctor's revive works once, is then unavailable, and re-runs the win check |
| A13 | Timer reads within 1s of true elapsed time after 2 minutes backgrounded |
| A14 | Timer hitting 0:00 shows the time's-up takeover with alarm; no vote screen exists anywhere |
| A15 | Marking a player out does not reveal their role unless the lobby setting is on |
| A16 | Full flow completes on a 375px viewport without horizontal scroll |
| A17 | `prefers-reduced-motion: reduce` removes all non-essential motion |
| A18 | A page refresh mid-game does not leak roles |

---

