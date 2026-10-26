import { useEffect, useRef, useState } from 'react'
import { Link } from 'wouter'
import NumberFlow from '@number-flow/react'
import { LayoutGroup, m, useInView, useReducedMotion } from 'motion/react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { loadIndex, PLACES, type PlaceId, type PlacesIndex } from '../lib'
import { landing } from '../copy'
import { Globe } from '../components/Globe'
import { InView } from '../components/InView'
import { Term } from '../components/Term'
import { ThemeToggle } from '../components/ThemeToggle'
import { Mark } from '../components/Mark'

type PlaceEntry = PlacesIndex['places'][number]

// Which places get a featured verbatim thread on the landing.
const FEATURED = ['thorntree', 'nairobi', 'utopia']

const focusRing = 'outline-offset-2 focus-visible:outline-2 focus-visible:outline-teal'

/** Landing — `/`. What this is, how it works, one followed sentence, every place. */
export function Landing() {
  const [index, setIndex] = useState<PlacesIndex | null>(null)
  const [focus, setFocus] = useState<PlaceId | null>(null)
  const reduced = useReducedMotion()
  const stepsRef = useRef<HTMLOListElement>(null)
  const stepsInView = useInView(stepsRef, { once: true, margin: '-10% 0px' })
  const countUp = stepsInView || !!reduced

  useEffect(() => {
    loadIndex().then(setIndex).catch(() => setIndex(null))
    const hash = window.location.hash.slice(1)
    if (hash)
      requestAnimationFrame(() =>
        document.getElementById(hash)?.scrollIntoView({ behavior: 'instant' }),
      )
  }, [])

  const totals = index?.places.reduce(
    (t, p) => ({
      stories: t.stories + p.counts.stories,
      claims: t.claims + p.counts.claims,
      signals: t.signals + p.counts.signals,
      interventions: t.interventions + p.counts.interventions,
    }),
    { stories: 0, claims: 0, signals: 0, interventions: 0 },
  )
  const threads = FEATURED.map((id) => index?.places.find((p) => p.id === id)).filter(
    (p): p is PlaceEntry => !!p?.thread,
  )

  const steps = [
    {
      n: 1,
      step: 'People tell their stories',
      value: totals?.stories,
      detail: (
        <>
          <Term k="story">stories</Term> so far, in their own words
        </>
      ),
    },
    {
      n: 2,
      step: 'The exact words are kept',
      value: totals?.claims,
      detail: (
        <>
          <Term k="verbatim">word-for-word</Term> <Term k="excerpt">excerpts</Term>, never
          reworded
        </>
      ),
    },
    {
      n: 3,
      step: 'The place checks',
      value: totals?.signals,
      detail: (
        <>
          <Term k="signal">signals</Term>. Nothing counts until the people who told the
          stories <Term k="peopleCheck">say so</Term>
        </>
      ),
    },
    {
      n: 4,
      step: 'It guides decisions',
      value: totals?.interventions,
      detail: (
        <>
          <Term k="intervention">interventions</Term> that trace back to real sentences
        </>
      ),
    },
  ]

  return (
    <div className="min-h-screen">
      <header className="rule-b sticky top-0 z-20 bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
          <span className="flex items-center gap-2 font-display text-lg text-teal">
            <Mark size={20} />
            <span className="text-ink">VSE</span>
          </span>
          <ThemeToggle className="ml-auto" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24">
        <section className="pt-8 md:pt-10">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12">
            <InView>
              <p className="chapter-marker">
                <span className="text-teal">00</span> · {landing.marker}
              </p>
              <h1 className="font-display mt-4 text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.98] text-ink">
                {landing.headline}
              </h1>
              <p className="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-muted md:text-xl">
                {landing.sub}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                <Link
                  href="/thorntree"
                  className={`inline-flex min-h-11 items-center gap-2 rounded-[3px] bg-coral px-7 py-2.5 font-medium text-paper hover:opacity-90 ${focusRing}`}
                >
                  {landing.cta}
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <a href="#how" className={`a inline-flex min-h-11 items-center gap-1.5 ${focusRing}`}>
                  {landing.secondary}
                  <ArrowDown size={14} aria-hidden />
                </a>
              </div>
            </InView>
            <InView delay={80}>
              <div className="mx-auto w-full min-w-0 max-w-md lg:max-w-none">
                <Globe focus={focus} legend={false} />
              </div>
            </InView>
          </div>

          <InView delay={120}>
            <div className="rule-t mt-8 pt-4">
              <p className="chapter-marker">{landing.globeNote}</p>
              <ul className="mt-3 grid sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-5">
                {PLACES.map((p) => (
                  <li key={p.id} className="rule-b">
                    <Link
                      href={`/${p.id}`}
                      onMouseEnter={() => setFocus(p.id)}
                      onFocus={() => setFocus(p.id)}
                      className={`flex min-h-11 items-center justify-between py-2 text-ink hover:text-teal ${focusRing}`}
                    >
                      <span className="font-serif text-lg">{p.label}</span>
                      {p.data === 'dummy' && <span className="chapter-marker">Dummy</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </InView>
        </section>

        <section id="how" className="scroll-mt-20 pt-16">
          <InView>
            <p className="chapter-marker">
              <span className="text-teal">—</span> · {landing.howTitle}
            </p>
            <p className="font-display mt-3 max-w-3xl text-[clamp(1.6rem,3.5vw,2.4rem)] leading-tight text-ink">
              {landing.why}
            </p>
            <ol ref={stepsRef} className="rule-t mt-6 grid grid-cols-2 gap-x-6 md:grid-cols-4">
              {steps.map((s) => (
                <li key={s.n} className="rule-b py-5">
                  <p className="chapter-marker">Step {s.n}</p>
                  <p className="font-display mt-1 text-4xl tabular-nums leading-none text-teal">
                    <NumberFlow
                      value={countUp ? (s.value ?? 0) : 0}
                      animated={!reduced}
                      transformTiming={{ duration: 1200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                      spinTiming={{ duration: 1200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                    />
                  </p>
                  <p className="mt-2 text-sm font-medium text-ink">{s.step}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{s.detail}</p>
                </li>
              ))}
            </ol>
          </InView>
        </section>

        <section id="thread" className="scroll-mt-20 pt-16">
          <InView>
            <p className="chapter-marker">
              <span className="text-teal">—</span> · {landing.threadTitle}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
              {landing.threadIntro}
            </p>
          </InView>
          <ul className="mt-6">
            {threads.map((p) => (
              <Thread key={p.id} place={p} />
            ))}
          </ul>
        </section>

        <section className="pt-16">
          <InView>
            <p className="chapter-marker">
              <span className="text-teal">—</span> · {landing.galleryTitle}
            </p>
          </InView>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            {(index?.places ?? []).map((p) => (
              <li
                key={p.id}
                className={p.id === 'thorntree' ? 'col-span-2 md:row-span-2' : undefined}
              >
                <Link
                  href={`/${p.id}`}
                  className={`group block rule-t pt-3 ${focusRing}`}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}previews/${p.id}.webp`}
                    alt={`Illustrated model of ${p.name}`}
                    loading="lazy"
                    width={800}
                    height={600}
                    className="aspect-[4/3] w-full bg-sand object-cover"
                  />
                  <p
                    className={`mt-3 font-display text-ink group-hover:text-teal ${
                      p.id === 'thorntree' ? 'text-4xl' : 'text-xl'
                    }`}
                  >
                    {p.name}
                  </p>
                  <p className="chapter-marker mt-1">
                    {p.data === 'dummy' ? landing.dummyLabel : landing.realLabel}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-muted">
                    {p.counts.stories} {landing.storiesLabel} · {p.counts.signals}{' '}
                    {landing.signalsLabel}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="pt-16">
          <InView>
            <div className="rule-t pt-6">
              <p className="max-w-2xl text-sm leading-relaxed text-muted">
                Nine places are real — assembled from field records and clearly
                attributed public posts. <Term k="dummyData">Utopia</Term> is a fictional
                example, labelled dummy data wherever it appears. Nothing is{' '}
                <Term k="priced">priced</Term> against a community’s say; signals marked for
                the <Term k="commons">commons</Term> stay in the commons.
              </p>
            </div>
          </InView>
        </section>
      </main>

      <footer className="rule-t px-5 py-8 text-center">
        <p className="chapter-marker">Value Structuring Engine · {landing.footer}</p>
        <p className="mt-2 text-xs text-muted">
          {landing.oss} ·{' '}
          <a
            href={landing.ossUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="a"
          >
            Source on GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}

const ease = [0.22, 1, 0.36, 1] as const

/** One sentence followed end to end: excerpt → signal chip → intervention. */
function Thread({ place: p }: { place: PlaceEntry }) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLLIElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const [step, setStep] = useState(0)
  const beat = reduced ? 3 : step
  const t = p.thread!

  useEffect(() => {
    if (reduced || !inView) return
    const s = window.setTimeout(() => setStep(1), 0)
    const a = window.setTimeout(() => setStep(2), 1100)
    const b = window.setTimeout(() => setStep(3), 2200)
    return () => {
      clearTimeout(s)
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [inView, reduced])

  const chip = (
    <m.span
      layoutId={reduced ? undefined : `chip-${p.id}`}
      transition={{ duration: 0.7, ease }}
      className="chapter-marker inline-block rounded-[3px] bg-teal px-2 py-1 !text-teal-ink"
    >
      {landing.threadSignal}
    </m.span>
  )

  return (
    <li ref={ref} className="rule-t py-6">
      <p className="chapter-marker">{p.name}</p>
      <LayoutGroup>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <m.div
            animate={{ opacity: beat >= 1 ? 1 : 0.15 }}
            transition={{ duration: reduced ? 0 : 0.6 }}
          >
            <Link
              href={`/${p.id}#stories`}
              className={`group block font-serif text-lg italic leading-snug text-ink no-underline hover:underline focus-visible:underline ${focusRing}`}
            >
              <span className="chapter-marker mb-1.5 block not-italic">{landing.threadQuote}</span>“
              <span
                className={
                  beat >= 1
                    ? 'excerpt !no-underline group-hover:!underline group-focus-visible:!underline'
                    : undefined
                }
              >{t.excerpt}</span>”
              <span className="mt-1 block font-sans text-xs not-italic text-muted">
                — {t.teller}, {t.channel}
              </span>
            </Link>
            <div className="mt-2 min-h-7">{beat === 1 && chip}</div>
          </m.div>
          <m.div
            className="border-l border-line pl-4"
            animate={{ opacity: beat >= 2 ? 1 : 0.15 }}
            transition={{ duration: reduced ? 0 : 0.6 }}
          >
            <div className="min-h-7">{beat >= 2 && chip}</div>
            <Link
              href={`/${p.id}#signals`}
              className={`a mt-2 block text-sm leading-snug text-ink ${focusRing}`}
            >
              {t.signal}
            </Link>
          </m.div>
          <m.div
            className="relative border-l border-line pl-4"
            animate={{ opacity: beat >= 3 ? 1 : 0.15 }}
            transition={{ duration: reduced ? 0 : 0.6 }}
          >
            <m.span
              aria-hidden
              className="absolute left-0 top-3 hidden h-px w-4 origin-left bg-teal md:block"
              animate={{ scaleX: beat >= 3 ? 1 : 0 }}
              transition={{ duration: reduced ? 0 : 0.5 }}
            />
            <p className="chapter-marker min-h-7 text-teal">{landing.threadIntervention}</p>
            <Link
              href={`/${p.id}#capital`}
              className={`a mt-2 block text-sm leading-snug text-ink ${focusRing}`}
            >
              {t.intervention ?? landing.threadOpen}
            </Link>
          </m.div>
        </div>
      </LayoutGroup>
    </li>
  )
}
