import { ROLE_META } from '../lib/assign.js'

// Single source of truth for the rules copy. Add to these arrays as new rules
// land — both the intro screen and the in-lobby "How to play" sheet render this.

const ROLES = [
  {
    ...ROLE_META.impostor,
    detail: 'One (or two in big groups). Pick off the village without being caught.',
  },
  {
    ...ROLE_META.doctor,
    detail: 'Exactly one. Can revive a fallen player once per game.',
  },
  {
    ...ROLE_META.detective,
    detail:
      'One per game (optional). Investigates once — a correct call catches that Werewolf.',
  },
  {
    ...ROLE_META.crewmate,
    detail: 'Everyone else. Find the Werewolf before they pick you off.',
  },
]

const STEPS = [
  ['Gather the village', 'Type everyone in — 4 to 15 players. Pick your options.'],
  ['Deal roles', 'The app secretly assigns roles. Pass the phone around so each player privately peeks at their own.'],
  ['Play it out', "Argue, accuse, and vote out loud — the app doesn't run the vote."],
  ['Mark people out', 'The host taps whoever is out (voted or picked off) and confirms it.'],
  ['Call meetings', 'Hit a 2-minute timer whenever someone calls an emergency meeting.'],
]

const WINS = [
  ['Village wins', 'Every Werewolf has been marked out.', 'var(--signal)'],
  ['Werewolves win', 'Werewolves reach parity with the village (e.g. 2 players left, one is the Werewolf).', 'var(--breach)'],
]

function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 font-display text-lg tracking-wide text-vapor/90">
        {title}
      </h3>
      {children}
    </section>
  )
}

export default function RulesContent() {
  return (
    <div className="text-[15px] leading-relaxed">
      <Section title="The idea">
        <p className="text-vapor/70">
          One of you is secretly the Werewolf. Everyone else is trying to figure
          out who — before the Werewolf picks the village off one by one. The app
          deals the secret roles, times your meetings, and calls the winner the
          moment it's decided. The arguing and voting happens out loud, the way
          it always has.
        </p>
      </Section>

      <Section title="Roles">
        <ul className="space-y-2">
          {ROLES.map((r) => (
            <li
              key={r.label}
              className="flex items-start gap-3 rounded-xl border px-3 py-2.5"
              style={{ borderColor: `${r.color}44`, background: `${r.color}10` }}
            >
              <span
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-sm"
                style={{ background: r.color, color: 'var(--void)' }}
              >
                {r.icon}
              </span>
              <span>
                <span className="font-medium" style={{ color: r.color }}>
                  {r.label}
                </span>
                <span className="text-vapor/70"> — {r.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="How a round goes">
        <ol className="space-y-2">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-strut font-display text-sm text-vapor">
                {i + 1}
              </span>
              <span>
                <span className="text-vapor">{t}.</span>{' '}
                <span className="text-vapor/70">{d}</span>
              </span>
            </li>
          ))}
        </ol>

        {/* The one rule that keeps roles from leaking. */}
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-triage/40 bg-triage/10 px-3.5 py-3">
          <span className="text-xl leading-none">🕵️</span>
          <p className="text-sm text-triage">
            <span className="font-semibold">The peeking rule:</span> when it's
            your turn to see your role, stand up to look. Everyone else stays
            seated — nobody can see a standing player's screen.
          </p>
        </div>
      </Section>

      <Section title="How it ends">
        <ul className="space-y-2">
          {WINS.map(([t, d, c]) => (
            <li key={t} className="rounded-xl border border-strut bg-hull px-3 py-2.5">
              <span className="font-medium" style={{ color: c }}>
                {t}
              </span>
              <span className="text-vapor/70"> — {d}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-vapor/50">
          The app checks after every elimination and revive, and ends the game
          itself the instant it's decided. More rules coming soon.
        </p>
      </Section>
    </div>
  )
}
