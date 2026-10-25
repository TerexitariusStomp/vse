import { useEffect, useState, type ReactNode } from 'react'
import { useResults } from '../lib'

const NAV = [
  { to: '#place', label: 'The place' },
  { to: '#stories', label: 'Stories' },
  { to: '#signals', label: 'What the place is saying' },
  { to: '#check', label: 'People check' },
  { to: '#capital', label: 'Where capital goes' },
  { to: '#priorities', label: 'Most needed' },
]

export function Layout({ children }: { children: ReactNode }) {
  const results = useResults()
  const [dark, setDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-sand-deep/60 bg-paper/95 backdrop-blur dark:bg-[#101a1c]/95">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <a href="#place" className="font-serif text-lg font-semibold text-teal dark:text-sand">
            {results.place.name}
          </a>
          <nav className="flex flex-1 flex-wrap gap-1" aria-label="Sections">
            {NAV.map((n) => (
              <a
                key={n.to}
                href={n.to}
                className="min-h-11 rounded-full px-3 py-2 text-sm motion-safe-only transition-colors hover:bg-sand dark:hover:bg-teal-deep"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark theme"
            className="min-h-11 min-w-11 rounded-full border border-sand-deep px-2 motion-safe-only transition-colors hover:border-teal"
          >
            {dark ? '☀' : '☾'}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-16 px-4 py-8">{children}</main>
      <footer className="border-t border-sand-deep/60 px-4 py-6 text-center text-sm opacity-70">
        <p>{results._about}</p>
        <p className="mt-1">Value Structuring Engine · Apache-2.0</p>
      </footer>
    </div>
  )
}
