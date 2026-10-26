import { Link } from 'wouter'
import { PLACES } from '../lib'
import { notFound } from '../copy'

export function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20">
      <h1 className="font-display text-4xl text-ink">{notFound.title}</h1>
      <p className="mt-3 text-muted">{notFound.body}</p>
      <ul className="rule-t mt-8">
        {PLACES.map((p) => (
          <li key={p.id} className="rule-b">
            <Link
              href={`/${p.id}`}
              className="flex min-h-11 items-center justify-between py-3 text-ink outline-offset-2 hover:text-teal focus-visible:outline-2 focus-visible:outline-teal"
            >
              <span className="font-serif text-xl">{p.label}</span>
              {p.data === 'dummy' && <span className="chapter-marker">Dummy</span>}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="a mt-8 inline-flex min-h-11 items-center">
        ← Home
      </Link>
    </div>
  )
}
