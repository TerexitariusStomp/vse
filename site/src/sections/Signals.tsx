import { useEffect } from 'react'
import {
  GATE_LABEL,
  claimsBySignal,
  storyMap,
  useResults,
  useUI,
  type Gate,
  type Signal,
} from '../lib'
import { Chapter } from '../components/Chapter'
import { Reveal } from '../components/Reveal'

const smooth = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? 'instant'
    : ('smooth' as ScrollBehavior)

const GATE_DOT: Record<Gate, string> = {
  may_be_priced: 'bg-teal',
  commons_only: 'bg-sage',
  not_yet: 'bg-warn',
}

/** Chapter 03 — signals as pull-quote statements; expand for the exact words. */
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
    <Chapter
      n="03"
      id="signals"
      title="What the place is saying"
      intro={`${r.signals.length} signals, consolidated from ${r.claims.length}
      excerpts. Every one traces back to the exact words in the record —
      nothing is invented here.`}
    >
      <ol className="rule-t mt-6">
        {r.signals.map((s) => (
          <SignalRow
            key={s.id}
            signal={s}
            open={openSignal === s.id}
            onToggle={() => toggleSignal(s.id)}
          />
        ))}
      </ol>
    </Chapter>
  )
}

function SignalRow({
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
    <li id={`signal-${signal.id}`} className="rule-b scroll-mt-28">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-11 w-full flex-wrap items-baseline gap-x-6 gap-y-1 py-6 text-left"
      >
        <h2 className={`font-display flex-1 basis-80 text-2xl leading-snug md:text-[1.7rem] ${
          open ? 'text-teal' : 'text-ink'
        }`}>
          {signal.statement}
        </h2>
        <span className="chapter-marker shrink-0">
          {signal.voices} voices · {signal.recurrence} excerpts
        </span>
        <span className="chapter-marker flex shrink-0 items-center gap-1.5">
          <span className={`inline-block h-2 w-2 rounded-full ${GATE_DOT[signal.verification.gate]}`} />
          {GATE_LABEL[signal.verification.gate]}
          <span aria-hidden className="ml-1">{open ? '−' : '+'}</span>
        </span>
      </button>
      {open && (
        <div className="pb-8 md:pl-10">
          <p className="chapter-marker">
            The exact words behind it — tap one to see it in place
          </p>
          <ul className="mt-4 space-y-4">
            {claims.map((c) => (
              <Reveal as="li" key={c.id}>
                <figure className="max-w-3xl">
                  <blockquote className="font-serif text-lg italic leading-relaxed text-ink">
                    <button
                      onClick={() => goToClaim(c.story_id, c.id)}
                      className="text-left underline decoration-line decoration-2 underline-offset-4 motion-safe-only transition-colors hover:decoration-teal"
                    >
                      “{c.text}”
                    </button>
                  </blockquote>
                  <figcaption className="mt-1 text-sm text-muted">
                    — {stories.get(c.story_id)?.teller_role}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </ul>
          <p className="mt-5 text-sm text-muted">
            Checked by {signal.verification.participants} participants —{' '}
            <a href="#check" className="a">see the people check below</a>.
          </p>
        </div>
      )}
    </li>
  )
}
