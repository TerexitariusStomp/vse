import type { ReactNode } from 'react'
import { Link } from 'wouter'
import { useResults } from '../lib'
import { landing } from '../copy'
import { PlacesMenu } from './PlacesMenu'
import { StepBar } from './StepBar'
import { ThemeToggle } from './ThemeToggle'

export function Layout({ children }: { children: ReactNode }) {
  const results = useResults()

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20">
        <header className="rule-b bg-paper/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
            <Link
              href="/"
              className="font-display flex min-h-11 items-center text-lg text-ink outline-offset-2 focus-visible:outline-2 focus-visible:outline-teal"
            >
              VSE
            </Link>
            <PlacesMenu current={results.place.id} />
            <ThemeToggle className="ml-auto" />
          </div>
        </header>
        <StepBar />
      </div>

      <main className="mx-auto max-w-5xl px-5 pb-24">{children}</main>

      <footer className="rule-t px-5 py-8 text-center">
        <p className="chapter-marker">{results.place.name} · assembled from real records</p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{results._about}</p>
        <p className="mt-2 text-xs text-muted">
          Value Structuring Engine · Apache-2.0 ·{' '}
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
