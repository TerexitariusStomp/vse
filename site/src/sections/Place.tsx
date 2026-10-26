import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import NumberFlow from '@number-flow/react'
import { useInView, useReducedMotion } from 'motion/react'
import { RotateCcw } from 'lucide-react'
import { placeMeta, useResults, type PlaceId } from '../lib'
import { place as copy } from '../copy'
import { InView } from '../components/InView'
import { Globe } from '../components/Globe'
import { DIORAMAS } from '../diorama/specs'

// three + r3f are ~600 kB — keep them out of the initial chunk.
const Diorama = lazy(() => import('../diorama').then((m) => ({ default: m.Diorama })))

/** Chapter 01 — the place + Run animation over the four stages (FR-D2). */
export function Place() {
  const r = useResults()
  const reduced = useReducedMotion()
  const stripRef = useRef<HTMLOListElement>(null)
  const inView = useInView(stripRef, { once: true, margin: '-10% 0px' })
  const [reset, setReset] = useState(false)
  const timer = useRef<number>(0)
  const shown = (inView || !!reduced) && !reset
  useEffect(() => () => window.clearTimeout(timer.current), [])

  function replay() {
    setReset(true)
    timer.current = window.setTimeout(() => setReset(false), 250)
  }

  return (
    <section id="place" className="scroll-mt-36 pt-14">
      <InView>
        <p className="chapter-marker">
          <span className="text-teal">01</span> · Geographical Area + Info ·{' '}
          {placeMeta(r.place.id)?.data === 'dummy' ? 'Dummy data' : 'Real data'}
        </p>
        {/* the one display-type moment the editorial profile allows */}
        <h1 className="font-display mt-4 text-[clamp(3.4rem,11vw,8.5rem)] leading-[0.95] text-ink">
          {r.place.name}
        </h1>
      </InView>

      {/* the official record — what the plans already know about this place */}
      {r.place.readings?.length ? (
        <InView delay={60}>
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
        </InView>
      ) : null}

      {/* the place itself — where it sits, what it looks like */}
      <InView delay={100}>
        <div className="rule-t mt-10 grid gap-8 pt-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Globe active={r.place.id as PlaceId} />
          <Suspense fallback={<div className="aspect-[4/3] w-full" aria-hidden />}>
            <Diorama spec={DIORAMAS[r.place.id as PlaceId]} results={r} />
          </Suspense>
        </div>
      </InView>

      <InView delay={120}>
        <button
          onClick={replay}
          className="mt-8 flex min-h-11 items-center gap-2 rounded-[3px] bg-teal px-7 py-2.5 font-medium text-teal-ink outline-offset-2 motion-safe-only transition-colors hover:bg-teal-deep focus-visible:outline-2 focus-visible:outline-teal"
        >
          <RotateCcw size={16} aria-hidden />
          {copy.replay}
        </button>
      </InView>

      {/* pipeline: ruled stat strip — numbers are the drama */}
      <InView delay={200}>
        <ol ref={stripRef} className="rule-t mt-10 grid grid-cols-2 gap-x-6 md:grid-cols-4">
          {r.pipeline.map((p) => (
            <li key={p.stage} className="rule-b py-5">
              <p className="chapter-marker">{p.stage}</p>
              <p
                className="font-display mt-2 text-5xl tabular-nums leading-none text-teal"
              >
                <NumberFlow
                  value={shown ? p.count : 0}
                  animated={!reduced}
                  transformTiming={{ duration: 1200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                  spinTiming={{ duration: 1200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                />
                <span className="ml-1.5 font-sans text-xs font-normal uppercase tracking-wide text-muted">
                  {p.unit}
                </span>
              </p>
              <p className="mt-2 text-sm text-muted">{p.detail}</p>
            </li>
          ))}
        </ol>
      </InView>

      {shown && r.scale_note && (
        <InView>
          <blockquote className="rule-b mt-8 pb-8">
            <p className="font-serif text-xl italic leading-relaxed text-ink">
              “{r.scale_note}”
            </p>
          </blockquote>
        </InView>
      )}

      <InView>
        <p className="mt-8 text-sm text-muted">
          {copy.jump}{' '}
          <a href="#stories" className="a">{copy.jumpStories}</a>
          {' · '}
          <a href="#signals" className="a">{copy.jumpSignals}</a>
        </p>
      </InView>
    </section>
  )
}
