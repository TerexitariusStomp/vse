import { useRef, useState } from 'react'
import { useResults } from '../lib'

/** Screen 1 — the place + Run animation over the four stages (FR-D2). */
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
    <section id="place" className="scroll-mt-6">
      <p className="text-sm uppercase tracking-wide text-sage">{r.place.kind}</p>
      <h1 className="mt-1 font-serif text-4xl font-semibold text-teal dark:text-sand">
        {r.place.name}
      </h1>
      <p className="mt-3 max-w-2xl text-lg">{r.place.summary}</p>

      <button
        onClick={run}
        disabled={running}
        className="mt-6 min-h-11 rounded-full bg-teal px-6 py-2 font-medium text-paper motion-safe-only transition-colors hover:bg-teal-deep disabled:opacity-50"
      >
        {done ? 'Run again' : 'Run'}
      </button>

      <ol className="mt-8 grid gap-3 sm:grid-cols-2">
        {r.pipeline.map((p, i) => (
          <li
            key={p.stage}
            className={`rounded-xl border p-4 motion-safe-only transition-colors ${
              i <= stageIdx
                ? 'border-teal bg-sand/50 dark:bg-teal-deep/40'
                : 'border-sand-deep/50 opacity-70'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-medium">{p.stage}</h2>
              <span className="font-serif text-3xl tabular-nums text-teal dark:text-sand">
                {counts[i]}
                <span className="ml-1 text-sm font-sans opacity-70">{p.unit}</span>
              </span>
            </div>
            <p className="mt-1 text-sm opacity-80">{p.detail}</p>
          </li>
        ))}
      </ol>

      {done && r.scale_note && (
        <p className="mt-6 border-l-4 border-sage pl-4 font-serif italic">
          {r.scale_note}
        </p>
      )}

      <p className="mt-8 text-sm">
        Next: <a href="#stories" className="text-teal underline underline-offset-2 dark:text-sand">hear the stories</a>
        {' → '}<a href="#signals" className="text-teal underline underline-offset-2 dark:text-sand">what the place is saying</a>
      </p>
    </section>
  )
}
