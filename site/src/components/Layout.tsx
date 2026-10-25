import { useEffect, useState, type ReactNode } from 'react'
import { PLACES, useResults } from '../lib'

export const CHAPTERS = [
  { id: 'place', n: '01', label: 'Place' },
  { id: 'stories', n: '02', label: 'Stories' },
  { id: 'signals', n: '03', label: 'Signals' },
  { id: 'check', n: '04', label: 'Check' },
  { id: 'capital', n: '05', label: 'Capital' },
  { id: 'priorities', n: '06', label: 'Priorities' },
]

export function Layout({ children }: { children: ReactNode }) {
  const results = useResults()
  const [dark, setDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )
  const [active, setActive] = useState('place')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Chapter spy: which frame is on screen (sequential-story's "visible place").
  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    CHAPTERS.forEach((c) => {
      const el = document.getElementById(c.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 rule-b bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
          <a href="#place" className="font-display text-lg text-ink">
            {results.place.name}
          </a>
          <nav className="flex items-center gap-1" aria-label="Places">
            {PLACES.map((p) => (
              <a
                key={p.id}
                href={`?place=${p.id}`}
                aria-current={results.place.id === p.id ? 'true' : undefined}
                className={`min-h-11 rounded-[3px] px-3 py-2 text-xs font-medium tracking-wide motion-safe-only transition-colors ${
                  results.place.id === p.id
                    ? 'bg-teal text-teal-ink'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {p.label}
              </a>
            ))}
          </nav>
          <nav className="ml-auto hidden items-center gap-5 md:flex" aria-label="Chapters">
            {CHAPTERS.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                aria-current={active === c.id ? 'true' : undefined}
                className={`chapter-marker py-2 motion-safe-only transition-colors hover:text-ink ${
                  active === c.id ? 'text-ink' : ''
                }`}
              >
                {c.label}
              </a>
            ))}
          </nav>
          <button
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="ml-auto flex min-h-11 min-w-11 items-center justify-center rounded-[3px] border border-line motion-safe-only transition-colors hover:border-teal md:ml-4"
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

      {/* chapter rail — signature move; desktop only */}
      <nav
        aria-label="Progress"
        className="fixed left-5 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-start gap-3 lg:flex"
      >
        {CHAPTERS.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="group flex min-h-11 items-center gap-2"
            aria-current={active === c.id ? 'true' : undefined}
          >
            <span className={`rail-dot ${active === c.id ? 'active' : ''}`} />
            <span
              className={`chapter-marker opacity-0 motion-safe-only transition-opacity group-hover:opacity-100 ${
                active === c.id ? 'opacity-100' : ''
              }`}
            >
              {c.n}
            </span>
          </a>
        ))}
      </nav>

      <main className="mx-auto max-w-5xl px-5 pb-24">{children}</main>

      <footer className="rule-t px-5 py-8 text-center">
        <p className="chapter-marker">{results.place.name} · assembled from real records</p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{results._about}</p>
        <p className="mt-2 text-xs text-muted">Value Structuring Engine · Apache-2.0</p>
      </footer>
    </div>
  )
}
