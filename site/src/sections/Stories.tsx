import { useEffect } from 'react'
import { claimsByStory, useResults, useUI } from '../lib'
import { StoryText } from '../components/StoryText'

const smooth = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? 'instant'
    : ('smooth' as ScrollBehavior)

/** Screen 2 — stories as expandable passages (FR-D3). */
export function Stories() {
  const r = useResults()
  const { openStory, focusClaim, claimNonce, toggleStory } = useUI()
  const counts = claimsByStory(r)

  // Trace landed on a claim: its story is open by now — scroll to the words.
  useEffect(() => {
    if (!focusClaim || !openStory) return
    document
      .getElementById(focusClaim)
      ?.scrollIntoView({ block: 'center', behavior: smooth() })
  }, [focusClaim, openStory, claimNonce])

  return (
    <section id="stories" className="scroll-mt-6">
      <h1 className="font-serif text-3xl font-semibold text-teal dark:text-sand">Stories</h1>
      <p className="mt-2 opacity-80">
        Told in their own words. People are named by role only. Highlighted
        passages are the exact excerpts that feed signals — tap one to see
        where it lands.
      </p>
      <ul className="mt-6 space-y-3">
        {r.stories.map((s) => {
          const open = openStory === s.id
          return (
            <li
              key={s.id}
              id={`story-${s.id}`}
              className={`rounded-xl border scroll-mt-24 motion-safe-only transition-colors ${
                open ? 'border-teal' : 'border-sand-deep/60'
              }`}
            >
              <button
                onClick={() => toggleStory(s.id)}
                aria-expanded={open}
                className="flex min-h-11 w-full flex-wrap items-baseline justify-between gap-2 p-4 text-left"
              >
                <h2 className="font-medium">{s.teller_role}</h2>
                <span className="text-sm opacity-70">
                  told by {s.channel} · {counts.get(s.id)?.length ?? 0} excerpts{' '}
                  <span aria-hidden>{open ? '▴' : '▾'}</span>
                </span>
              </button>
              {open && (
                <div className="border-t border-sand-deep/50 p-4">
                  <StoryText story={s} focusClaimId={focusClaim ?? undefined} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
