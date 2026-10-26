import { useEffect, useState } from 'react'
import { loadIndex, type PlacesIndex } from '../lib'
import { Globe } from '../components/Globe'
import { Reveal } from '../components/Reveal'

// Which places get a featured verbatim thread on the landing.
const FEATURED = ['thorntree', 'nairobi', 'utopia']

/**
 * Landing — `/` with no `?place`. Plain-language explainer for everyday
 * visitors: what this is, how it works, then choose a place. Place content
 * lives in the demonstrator at `?place=<id>`.
 */
export function Landing() {
  const [index, setIndex] = useState<PlacesIndex | null>(null)
  const [dark, setDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  useEffect(() => {
    loadIndex().then(setIndex).catch(() => setIndex(null))
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
    (p): p is PlacesIndex['places'][number] => !!p?.thread,
  )

  return (
    <div className="min-h-screen">
      <header className="rule-b sticky top-0 z-20 bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
          <span className="font-display text-lg text-ink">VSE</span>
          <button
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="ml-auto flex min-h-11 min-w-11 items-center justify-center rounded-[3px] border border-line motion-safe-only transition-colors hover:border-teal"
          >
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <circle cx="8" cy="8" r="3.2" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6 13 13M13 3l-1.4 1.4M4.4 11.6 3 13" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M13.5 9.5A5.8 5.8 0 1 1 6.5 2.5a4.6 4.6 0 0 0 7 7Z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24">
        {/* hero — what this is */}
        <section className="pt-14">
          <Reveal>
            <p className="chapter-marker">
              <span className="text-teal">00</span> · The Value Structuring Engine
            </p>
            <h1 className="font-display mt-4 text-[clamp(3rem,9vw,6.5rem)] leading-[0.98] text-ink">
              Every place knows what it needs.
            </h1>
            <p className="mt-6 max-w-2xl font-serif text-xl leading-relaxed text-muted">
              People tell stories about where they live. The engine keeps their
              exact words all the way through — to the signals a place agrees
              on, and to the decisions those signals guide.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="rule-t mt-10 grid gap-8 pt-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <div>
                <p className="chapter-marker text-muted">
                  Ten places have been heard so far — pick one to explore
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  Each dot is a real place: field records from Middlesbrough,
                  West Yorkshire and East Africa, public posts from Minneapolis,
                  Nairobi, Detroit and Puerto la Cruz — and Utopia, a labelled
                  fictional example.
                </p>
              </div>
              <Globe />
            </div>
          </Reveal>
        </section>

        {/* the method — four plain steps with live counts */}
        <section className="pt-16">
          <Reveal>
            <p className="chapter-marker">
              <span className="text-teal">—</span> · How it works
            </p>
            <ol className="rule-t mt-4 grid grid-cols-2 gap-x-6 md:grid-cols-4">
              {[
                {
                  n: '1',
                  step: 'People tell their stories',
                  detail: `${totals?.stories ?? '—'} so far, in their own words`,
                },
                {
                  n: '2',
                  step: 'The exact words are kept',
                  detail: `${totals?.claims ?? '—'} verbatim excerpts — never paraphrased`,
                },
                {
                  n: '3',
                  step: 'The place checks',
                  detail: `${totals?.signals ?? '—'} signals — nothing counts until the people who told them say so`,
                },
                {
                  n: '4',
                  step: 'It guides decisions',
                  detail: `${totals?.interventions ?? '—'} interventions trace back to real sentences`,
                },
              ].map((s) => (
                <li key={s.n} className="rule-b py-5">
                  <p className="font-display text-4xl tabular-nums text-teal">{s.n}</p>
                  <p className="mt-2 text-sm font-medium text-ink">{s.step}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{s.detail}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {/* follow one sentence — verbatim thread */}
        <section className="pt-16">
          <Reveal>
            <p className="chapter-marker">
              <span className="text-teal">—</span> · Follow one sentence
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
              Nothing here is summarised. Every signal keeps the exact words it
              came from, so anyone can check the thread end to end.
            </p>
            <ul className="mt-6">
              {threads.map((p) => (
                <li key={p.id} className="rule-t py-6">
                  <p className="chapter-marker text-muted">{p.name}</p>
                  <div className="mt-3 grid gap-4 md:grid-cols-3">
                    <a
                      href={`?place=${p.id}#stories`}
                      className="a block font-serif text-lg italic leading-snug text-ink"
                    >
                      “{p.thread!.excerpt}”
                      <span className="mt-1 block font-sans text-xs not-italic text-muted">
                        — {p.thread!.teller}, {p.thread!.channel}
                      </span>
                    </a>
                    <a
                      href={`?place=${p.id}#signals`}
                      className="a block border-l border-line pl-4 text-sm leading-snug text-ink"
                    >
                      <span className="chapter-marker block text-teal">the place heard</span>
                      {p.thread!.signal}
                    </a>
                    <a
                      href={`?place=${p.id}#capital`}
                      className="a block border-l border-line pl-4 text-sm leading-snug text-ink"
                    >
                      <span className="chapter-marker block text-teal">it guided</span>
                      {p.thread!.intervention ?? '— still open, no decision attached yet'}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* honesty + choose a place */}
        <section className="pt-16">
          <Reveal>
            <div className="rule-t pt-6">
              <p className="max-w-2xl text-sm leading-relaxed text-muted">
                Nine places are real — assembled from field records and clearly
                attributed public posts. <em className="font-serif">Utopia</em>{' '}
                is a fictional example, labelled dummy data wherever it appears.
                Nothing is priced against a community's say; signals marked for
                the commons stay in the commons.
              </p>
              <p className="chapter-marker mt-8 text-muted">Pick a place</p>
              <ul className="mt-3 columns-2 gap-6 sm:columns-3">
                {(index?.places ?? []).map((p) => (
                  <li key={p.id} className="py-1.5">
                    <a
                      href={`?place=${p.id}`}
                      className="a text-base text-ink motion-safe-only transition-colors hover:text-teal"
                    >
                      {p.name}
                      {p.data === 'dummy' ? ' · fictional' : ''}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="rule-t px-5 py-8 text-center">
        <p className="chapter-marker">Value Structuring Engine · Apache-2.0 · works offline</p>
      </footer>
    </div>
  )
}
