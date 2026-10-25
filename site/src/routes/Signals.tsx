import { Link, useParams } from 'react-router-dom'
import {
  GATE_LABEL,
  claimsBySignal,
  storyMap,
  useResults,
} from '../lib'
import { GateControl } from '../components/GateControl'
import { VerificationBar } from '../components/VerificationBar'

/** Screen 3 — the signals as cards (FR-D4). */
export function Signals() {
  const r = useResults()
  return (
    <section>
      <h1 className="font-serif text-3xl font-semibold text-teal dark:text-sand">
        What the place is saying
      </h1>
      <p className="mt-2 opacity-80">
        Every signal traces back to the exact words people used.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {r.signals.map((s) => (
          <li key={s.id}>
            <Link
              to={`/signals/${s.id}`}
              className="block h-full rounded-xl border border-sand-deep/60 p-4 motion-safe-only transition-colors hover:border-teal hover:bg-sand/40 dark:hover:bg-teal-deep/30"
            >
              <h2 className="font-serif text-xl font-medium">{s.statement}</h2>
              <p className="mt-2 text-sm opacity-80">
                {s.voices} voices · {s.recurrence} excerpts
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-sage">
                {GATE_LABEL[s.verification.gate]}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SignalDetail() {
  const r = useResults()
  const { signalId } = useParams()
  const signal = r.signals.find((s) => s.id === signalId)
  if (!signal) return <p>Signal not found.</p>
  const claims = claimsBySignal(r).get(signal.id) ?? []
  const stories = storyMap(r)

  return (
    <section>
      <p className="text-sm opacity-70">
        <Link to="/signals" className="underline underline-offset-2">← all signals</Link>
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-teal dark:text-sand">
        {signal.statement}
      </h1>
      <p className="mt-1 text-sm opacity-70">
        {signal.voices} voices · {signal.recurrence} excerpts · checked by{' '}
        {signal.verification.participants} participants
      </p>

      <VerificationBar signal={signal} />
      <GateControl signal={signal} />

      <h2 className="mt-8 text-sm uppercase tracking-wide opacity-70">
        The exact words behind it
      </h2>
      <ul className="mt-3 space-y-3">
        {claims.map((c) => (
          <li key={c.id} className="font-serif">
            <Link
              to={`/stories/${c.story_id}#${c.id}`}
              className="italic underline decoration-sage underline-offset-2 hover:decoration-teal"
            >
              “{c.text}”
            </Link>{' '}
            <span className="text-sm not-italic opacity-60">
              — {stories.get(c.story_id)?.teller_role}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
