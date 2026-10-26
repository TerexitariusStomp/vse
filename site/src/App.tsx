import { useEffect, useState } from 'react'
import {
  currentPlace,
  loadResults,
  ResultsProvider,
  UIProvider,
  VisitorProvider,
  type Results,
} from './lib'
import { Layout } from './components/Layout'
import { Landing } from './sections/Landing'
import { Place } from './sections/Place'
import { Stories } from './sections/Stories'
import { Signals } from './sections/Signals'
import { Check } from './sections/Check'
import { Capital } from './sections/Capital'
import { Priorities } from './sections/Priorities'

export default function App() {
  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState<string | null>(null)
  // `?place=<id>` enters the demonstrator; bare `/` is the landing page.
  const placeParam = new URLSearchParams(window.location.search).get('place')

  useEffect(() => {
    if (!placeParam) return
    const place = currentPlace()
    localStorage.setItem('vse-place', place)
    loadResults(place)
      .then(setResults)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [placeParam])

  if (!placeParam) return <Landing />

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
