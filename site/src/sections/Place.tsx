import { lazy, Suspense, useRef, useState } from 'react'
import { placeMeta, useResults, type PlaceId } from '../lib'
import { Reveal } from '../components/Reveal'
import { Globe } from '../components/Globe'
import { DIORAMAS } from '../diorama/specs'

// three + r3f are ~600 kB — keep them out of the initial chunk.
const Diorama = lazy(() => import('../diorama').then((m) => ({ default: m.Diorama })))

/** Chapter 01 — the place + Run animation over the four stages (FR-D2). */
export function Place() {
  const r = useResults()
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [running, setRunning] = useState(false)
  const [stageIdx, setStageIdx] = useState(-1)
  const [counts, setCounts] = useState<number[]>(r.pipeline.map(() => 0))
  const [done, setDone] = useState(false)
  const timers = useRef<number[]>([])

  function run() {
    timers.current.forEach(clearTimeout)
    if (reduced) {
      setCounts(r.pipeline.map((p) => p.count))
      setStageIdx(r.pipeline.length - 1)
      setDone(true)
      return
    }
    setRunning(true)
    setDone(false)
    setCounts(r.pipeline.map(() => 0))
    r.pipeline.forEach((p, idx) => {
      const startAt = idx * 900
      const steps = 24
      for (let s = 1; s <= steps; s++) {
        timers.current.push(
          window.setTimeout(() => {
            setStageIdx(idx)
            setCounts((c) => {
              const next = [...c]
              next[idx] = Math.round((p.count * s) / steps)
              return next
            })
            if (idx === r.pipeline.length - 1 && s === steps) {
              setDone(true)
              setRunning(false)
            }
          }, startAt + (s * 800) / steps),
        )
      }
    })
  }

  return (
    <section id="place" className="scroll-mt-20 pt-14">
      <Reveal>
        <p className="chapter-marker">
          <span className="text-teal">01</span> · Geographical Area + Info ·{' '}
          {placeMeta(r.place.id)?.data === 'dummy' ? 'Dummy data' : 'Real data'}
        </p>
        {/* the one display-type moment the editorial profile allows */}
        <h1 className="font-display mt-4 text-[clamp(3.4rem,11vw,8.5rem)] leading-[0.95] text-ink">
          {r.place.name}
        </h1>
      </Reveal>

      {/* the official record — what the plans already know about this place */}
      {r.place.readings?.length ? (
        <Reveal delay={60}>
          <dl className="rule-t mt-8 grid grid-cols-2 gap-x-6 md:grid-cols-4">
            {r.place.readings.map((rd) => (
              <div key={rd.label} className="rule-b py-4">
                <dt className="chapter-marker">{rd.label}</dt>
                <dd className="font-display mt-1.5 text-2xl tabular-nums leading-tight text-ink">
                  {rd.value}
                </dd>
                <dd className="mt-1 text-xs text-muted">{rd.source}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      ) : null}

      {/* the place itself — where it sits, what it looks like */}
      <Reveal delay={100}>
        <div className="rule-t mt-10 grid gap-8 pt-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Globe active={r.place.id as PlaceId} />
          <Suspense fallback={<div className="aspect-[4/3] w-full" aria-hidden />}>
            <Diorama spec={DIORAMAS[r.place.id as PlaceId]} results={r} />
          </Suspense>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <button
          onClick={run}
          disabled={running}
          className="mt-8 min-h-11 rounded-[3px] bg-teal px-7 py-2.5 font-medium text-teal-ink motion-safe-only transition-colors hover:bg-teal-deep disabled:opacity-50"
        >
          {done ? 'Run it again' : 'Run the engine'}
        </button>
      </Reveal>

      {/* pipeline: ruled stat strip — numbers are the drama */}
      <Reveal delay={200}>
        <ol className="rule-t mt-10 grid grid-cols-2 gap-x-6 md:grid-cols-4">
          {r.pipeline.map((p, i) => (
            <li
              key={p.stage}
              className={`rule-b py-5 motion-safe-only transition-opacity duration-500 ${
                i <= stageIdx ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <p className="chapter-marker">{p.stage}</p>
              <p
                className={`font-display mt-2 text-5xl tabular-nums leading-none ${
                  i <= stageIdx ? 'text-teal' : 'text-ink'
                }`}
              >
                {counts[i]}
                <span className="ml-1.5 font-sans text-xs font-normal uppercase tracking-wide text-muted">
                  {p.unit}
                </span>
              </p>
              <p className="mt-2 text-sm text-muted">{p.detail}</p>
            </li>
          ))}
        </ol>
      </Reveal>

      {done && r.scale_note && (
        <Reveal>
          <blockquote className="rule-b mt-8 pb-8">
            <p className="font-serif text-xl italic leading-relaxed text-ink">
              “{r.scale_note}”
            </p>
          </blockquote>
        </Reveal>
      )}

      <Reveal>
        <p className="mt-8 text-sm text-muted">
          Scroll — or jump:{' '}
          <a href="#stories" className="a">the stories</a>
          {' · '}
          <a href="#signals" className="a">what the place is saying</a>
        </p>
      </Reveal>
    </section>
  )
}
