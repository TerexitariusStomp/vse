import { useResults } from '../lib'
import { Link } from 'wouter'
import { ArrowRight } from 'lucide-react'
import { PLACES } from '../lib'
import { answers, journey, QUESTIONS, STEPS } from '../copy'
import { Chapter } from '../components/Chapter'
import { InView } from '../components/InView'

/** Chapter 06 — the close; a designed empty state (FR-D7). */
export function Priorities() {
  const r = useResults()
  const p = r.priorities
  const idx = PLACES.findIndex((x) => x.id === r.place.id)
  const next = PLACES[(idx + 1) % PLACES.length]
  return (
    <Chapter
      n={STEPS[5].n}
      id="priorities"
      title={STEPS[5].label}
      question={QUESTIONS.priorities}
      answer={p.items.length ? answers.priorities(p.items.length) : answers.prioritiesEmpty}
      how={p.intro}
    >
      {p.items.length === 0 ? (
        <InView>
          <div className="rule-b mt-10 pb-14 text-center">
            <p className="font-display mx-auto max-w-xl text-3xl leading-snug text-ink">
              Written last — after the place has been heard.
            </p>
            <p className="chapter-marker mt-4">
              The VSE team fills this in at publication
            </p>
          </div>
        </InView>
      ) : (
        <ol className="rule-t mt-8">
          {p.items.map((item, i) => (
            <li key={i} className="rule-b py-6">
              <h2 className="font-serif text-2xl">{item.heading}</h2>
              <p className="measure mt-2 text-muted">{item.text}</p>
            </li>
          ))}
        </ol>
      )}
      <nav aria-label="Next" className="rule-t mt-14 grid gap-4 pt-8 sm:grid-cols-[1fr_auto] sm:items-center">
        <Link
          href={`/${next.id}`}
          className="group flex min-h-11 items-center justify-between gap-4 rounded-[3px] border border-line px-5 py-4 outline-offset-2 hover:border-teal focus-visible:outline-2 focus-visible:outline-teal"
        >
          <span>
            <span className="chapter-marker block">{journey.next}</span>
            <span className="font-display text-2xl text-ink">{next.label}</span>
          </span>
          <ArrowRight aria-hidden className="text-teal motion-safe-only transition-transform group-hover:translate-x-1" />
        </Link>
        <Link href="/" className="a flex min-h-11 items-center">
          ← {journey.all}
        </Link>
      </nav>
    </Chapter>
  )
}
