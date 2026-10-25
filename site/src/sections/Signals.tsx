import { useEffect } from 'react'
import {
  GATE_LABEL,
  claimsBySignal,
  storyMap,
  useResults,
  useUI,
  type Signal,
} from '../lib'

const smooth = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? 'instant'
    : ('smooth' as ScrollBehavior)

/** Screen 3 — signal cards that expand to their exact words (FR-D4). */
export function Signals() {
  const r = useResults()
  const { openSignal, signalNonce, toggleSignal } = useUI()

  useEffect(() => {
    if (!openSignal) return
    document
      .getElementById(`signal-${openSignal}`)
      ?.scrollIntoView({ block: 'nearest', behavior: smooth() })
  }, [openSignal, signalNonce])

  return (
    <section id="signals" className="scroll-mt-6">
      <h1 className="font-serif text-3xl font-semibold text-teal dark:text-sand">
        What the place is saying
      </h1>
      <p className="mt-2 opacity-80">
        Every signal traces back to the exact words people used.
      </p>
      <ul className="mt-6 grid items-start gap-3 sm:grid-cols-2">
        {r.signals.map((s) => (
          <SignalCard key={s.id} signal={s} open={openSignal === s.id} onToggle={() => toggleSignal(s.id)} />
        ))}
      </ul>
    </section>
  )
}

function SignalCard({
  signal,
  open,
  onToggle,
}: {
  signal: Signal
  open: boolean
  onToggle: () => void
}) {
  const r = useResults()
  const { goToClaim } = useUI()
  const claims = claimsBySignal(r).get(signal.id) ?? []
  const stories = storyMap(r)

  return (
    <li
      id={`signal-${signal.id}`}
      className={`rounded-xl border scroll-mt-24 motion-safe-only transition-colors ${
        open ? 'border-teal bg-sand/40 sm:col-span-2 dark:bg-teal-deep/30' : 'border-sand-deep/60'
      }`}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="min-h-11 w-full p-4 text-left"
      >
        <h2 className="font-serif text-xl font-medium">{signal.statement}</h2>
        <p className="mt-2 text-sm opacity-80">
          {signal.voices} voices · {signal.recurrence} excerpts
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-sage">
          {GATE_LABEL[signal.verification.gate]}
        </p>
      </button>
      {open && (
        <div className="border-t border-sand-deep/50 p-4">
          <p className="text-xs uppercase tracking-wide opacity-70">
            The exact words behind it — tap one to see it in place
          </p>
          <ul className="mt-3 space-y-3">
            {claims.map((c) => (
              <li key={c.id} className="font-serif">
                <button
                  onClick={() => goToClaim(c.story_id, c.id)}
                  className="text-left italic underline decoration-sage underline-offset-2 hover:decoration-teal"
                >
                  “{c.text}”
                </button>{' '}
                <span className="text-sm not-italic opacity-60">
                  — {stories.get(c.story_id)?.teller_role}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm opacity-70">
            Checked by {signal.verification.participants} participants —{' '}
            <a href="#check" className="underline underline-offset-2">see the people check below</a>.
          </p>
        </div>
      )}
    </li>
  )
}
