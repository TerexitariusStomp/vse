import { useEffect } from 'react'
import { claimsByStory, useResults, useUI } from '../lib'
import { Chapter } from '../components/Chapter'
import { Reveal } from '../components/Reveal'
import { StoryText } from '../components/StoryText'

const smooth = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? 'instant'
    : ('smooth' as ScrollBehavior)

/** Chapter 02 — stories as a ruled ledger; expand to read (FR-D3). */
export function Stories() {
  const r = useResults()
  const { openStory, focusClaim, claimNonce, toggleStory } = useUI()
  const counts = claimsByStory(r)

  useEffect(() => {
    if (!focusClaim || !openStory) return
    document
      .getElementById(focusClaim)
      ?.scrollIntoView({ block: 'center', behavior: smooth() })
  }, [focusClaim, openStory, claimNonce])

  return (
    <Chapter
      n="02"
      id="stories"
      title="The stories"
      intro="Told in their own words — people are named by role only. Highlighted
      passages are the exact excerpts that feed signals; tap one to see where
      it lands."
    >
      <ol className="rule-t mt-8">
        {r.stories.map((s, idx) => {
          const open = openStory === s.id
          return (
            <li key={s.id} id={`story-${s.id}`} className="rule-b scroll-mt-28">
              <button
                onClick={() => toggleStory(s.id)}
                aria-expanded={open}
                className="flex min-h-11 w-full items-baseline gap-4 py-4 text-left"
              >
                <span className="chapter-marker w-6 shrink-0 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">
                  <span className="font-serif text-xl">{s.teller_role}</span>
                  <span className="ml-3 text-sm text-muted">told by {s.channel}</span>
                </span>
                <span className="chapter-marker shrink-0">
                  {counts.get(s.id)?.length ?? 0} excerpts
                  <span aria-hidden className="ml-2">{open ? '−' : '+'}</span>
                </span>
              </button>
              {open && (
                <div className="pb-6 pl-10 pr-2">
                  <div className="measure">
                    <StoryText story={s} focusClaimId={focusClaim ?? undefined} />
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <Reveal>
        <p className="mt-4 text-sm text-muted">
          Eight voices — a whole valley, in their own sentences.
        </p>
      </Reveal>
    </Chapter>
  )
}
