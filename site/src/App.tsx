import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import {
  loadResults,
  ResultsProvider,
  VisitorProvider,
  type Results,
} from './lib'
import { Layout } from './components/Layout'
import { Place } from './routes/Place'
import { Stories, StoryDetail } from './routes/Stories'
import { Signals, SignalDetail } from './routes/Signals'
import { Check } from './routes/Check'
import { Capital } from './routes/Capital'
import { Priorities } from './routes/Priorities'

export default function App() {
  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadResults()
      .then(setResults)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  if (error)
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <h1 className="font-serif text-2xl font-semibold text-coral">
          The results file did not load
        </h1>
        <p className="mt-3 text-sm">
          This site is a pure reader of <code>utopia_results.json</code>. Fix
          the file and refresh — nothing is sent anywhere.
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
        {/* HashRouter: the site must run on any static host with no rewrite
            rules, and deep links keep working offline (PRD FR-D1). */}
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Place />} />
              <Route path="/stories" element={<Stories />} />
              <Route path="/stories/:storyId" element={<StoryDetail />} />
              <Route path="/signals" element={<Signals />} />
              <Route path="/signals/:signalId" element={<SignalDetail />} />
              <Route path="/check" element={<Check />} />
              <Route path="/capital" element={<Capital />} />
              <Route path="/priorities" element={<Priorities />} />
              <Route path="*" element={<p>Page not found.</p>} />
            </Routes>
          </Layout>
        </HashRouter>
      </VisitorProvider>
    </ResultsProvider>
  )
}
