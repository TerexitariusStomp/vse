import { useEffect, useRef, useState } from 'react'
import { placeMeta } from '../lib'

// FR-E5 — the public story-intake form. Posts verbatim text to the engine's
// listening channel; consent is required or the story lands 'pending' and
// never reaches extraction or publication. Turnstile renders only when the
// deployment sets VITE_TURNSTILE_SITEKEY — unset means facilitated mode.
const ENGINE = import.meta.env.VITE_ENGINE_URL ?? 'https://vse-engine.delta-git.workers.dev'
const TURNSTILE_SITEKEY: string | undefined = import.meta.env.VITE_TURNSTILE_SITEKEY

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => void }
  }
}

export function Share({ placeId }: { placeId: string }) {
  const meta = placeMeta(placeId)
  const [role, setRole] = useState('')
  const [text, setText] = useState('')
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const widgetRef = useRef<HTMLDivElement>(null)
  const tokenRef = useRef<string>('')

  useEffect(() => {
    if (!TURNSTILE_SITEKEY || !widgetRef.current || window.turnstile) return
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    s.async = true
    s.onload = () =>
      window.turnstile?.render(widgetRef.current!, {
        sitekey: TURNSTILE_SITEKEY,
        callback: (t: string) => (tokenRef.current = t),
      })
    document.head.appendChild(s)
  }, [])

  if (!meta)
    return (
      <main className="mx-auto max-w-xl px-4 py-20">
        <h1 className="font-serif text-2xl font-semibold">Unknown place</h1>
      </main>
    )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setError('')
    const res = await fetch(`${ENGINE}/api/places/${placeId}/stories`, {
      method: 'POST',
      signal: AbortSignal.timeout(20_000),
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        teller_role: role.trim(),
        channel: 'web',
        text: text.trim(),
        consent,
        turnstile_token: tokenRef.current || undefined,
      }),
    }).catch(() => null)
    if (!res) {
      setState('error')
      setError('Could not reach the listening engine. Try again later.')
      return
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setState('error')
      setError(body?.error ? JSON.stringify(body.error) : `Submit failed (${res.status})`)
      return
    }
    setState('done')
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">Tell your story</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold">{meta.label}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Your words are kept exactly as you wrote them — the engine only lifts
        verbatim excerpts, and the people who spoke check what it found before
        anything can guide capital. You are identified by role, never by name.
      </p>

      {state === 'done' ? (
        <div className="mt-8 rounded-lg border border-line bg-surface p-6">
          <h2 className="font-serif text-xl">Heard.</h2>
          <p className="mt-2 text-sm text-muted">
            Your story is in the record. An analyst reviews the excerpts the
            engine draws from it, then your place checks the signals.
          </p>
          <a href={`/${placeId}`} className="mt-4 inline-block text-sm underline">
            See {meta.label}'s published record →
          </a>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Your role (e.g. fishmonger, teacher, nurse)
            </span>
            <input
              required
              maxLength={120}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-[3px] border border-line bg-surface px-3 py-2 text-ink"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Your story, in your own words
            </span>
            <textarea
              required
              maxLength={20000}
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 w-full rounded-[3px] border border-line bg-surface px-3 py-2 text-ink"
            />
          </label>
          <label className="flex items-start gap-3">
            <input
              required
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-muted">
              I agree that my words (kept under my role, never my name) may be
              processed and published in {meta.label}'s results record. I can
              withdraw my story at any time.
            </span>
          </label>
          {TURNSTILE_SITEKEY && <div ref={widgetRef} />}
          {state === 'error' && (
            <p role="alert" className="text-sm text-coral">{error}</p>
          )}
          <button
            type="submit"
            disabled={state === 'sending'}
            className="rounded-[3px] bg-teal px-5 py-2.5 text-sm font-medium text-teal-ink disabled:opacity-50"
          >
            {state === 'sending' ? 'Sending…' : 'Share your story'}
          </button>
        </form>
      )}
    </main>
  )
}
