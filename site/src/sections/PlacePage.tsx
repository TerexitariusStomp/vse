import { useEffect, useState } from 'react'
import {
  loadResults,
  placeMeta,
  ResultsProvider,
  UIProvider,
  VisitorProvider,
  type Results,
} from '../lib'
import { Layout } from '../components/Layout'
import { NotFound } from './NotFound'
import { Place } from './Place'
import { Stories } from './Stories'
import { Signals } from './Signals'
import { Check } from './Check'
import { Capital } from './Capital'
import { Priorities } from './Priorities'

const TITLE = 'VSE'

export function PlacePage({ placeId }: { placeId: string }) {
  if (!placeMeta(placeId)) return <NotFound />
  return <PlaceLoader key={placeId} placeId={placeId} />
}

function PlaceLoader({ placeId }: { placeId: string }) {
  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadResults(placeId)
      .then(setResults)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [placeId])

  useEffect(() => {
    if (!results) return
    document.title = `${results.place.name} · ${TITLE}`
    const hash = window.location.hash.slice(1)
    if (hash) requestAnimationFrame(() =>
        document.getElementById(hash)?.scrollIntoView({ behavior: 'instant' }),
      )
    return () => {
      document.title = TITLE
    }
  }, [results])

  if (error)
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <h1 className="font-serif text-2xl font-semibold text-coral">
          The results file did not load
        </h1>
        <p className="mt-3 text-sm">
          This site is a pure reader of <code>*_results.json</code> files in{' '}
          <code>data/</code>. Fix the file and refresh — nothing is sent
          anywhere.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-sand p-4 text-xs whitespace-pre-wrap dark:bg-teal-deep">
          {error}
        </pre>
      </div>
    )
  if (!results) return <p className="px-4 py-20 text-center opacity-70">Loading…</p>

  return (
    <ResultsProvider results={results}>
      <VisitorProvider>
        <UIProvider>
          <Layout>
            <Place />
            <Stories />
            <Signals />
            <Check />
            <Capital />
            <Priorities />
          </Layout>
        </UIProvider>
      </VisitorProvider>
    </ResultsProvider>
  )
}
