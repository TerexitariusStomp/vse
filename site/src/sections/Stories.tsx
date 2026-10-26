import { useEffect } from 'react'
import { claimsByStory, useResults, useUI } from '../lib'
import { storiesAnswer } from '../lib/answers'
import { HOW, QUESTIONS, STEPS, answers } from '../copy'
import { Chapter } from '../components/Chapter'
import { InView } from '../components/InView'
import { StoryText } from '../components/StoryText'

const smooth = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? 'instant'
    : ('smooth' as ScrollBehavior)

/** Public social posts carry a provenance URL as their source — derive the
 *  network label and link it so anyone can check the original post. */
const socialNet = (src?: string) =>
  src?.includes('bsky.app') ? 'bsky'
    : src?.includes('njump.me') ? 'nostr'
    : src?.includes('hive.blog') ? 'hive' : 'social'
const host = (src: string) => {
  try { return new URL(src).hostname.replace(/^www\./, '') } catch { return src }
}

/** Chapter 02 — stories as a ruled ledger; expand to read (FR-D3). */
export function Stories() {
  const r = useResults()
  const { openStory, focusClaim, claimNonce, toggleStory } = useUI()
  const counts = claimsByStory(r)
  const a = storiesAnswer(r)

  useEffect(() => {
    if (!focusClaim || !openStory) return
    document
      .getElementById(focusClaim)
      ?.scrollIntoView({ block: 'center', behavior: smooth() })
  }, [focusClaim, openStory, claimNonce])

  return (
    <Chapter
      n={STEPS[1].n}
      id="stories"
      title={STEPS[1].label}
      question={QUESTIONS.stories}
      answer={`${answers.stories(a.stories)}${a.roles.length ? `, including ${answers.roles(a.roles)}` : ''}.`}
      how={HOW.stories}
    >
      <ol className="rule-t mt-8">
        {r.stories.map((s, idx) => {
          const open = openStory === s.id
          return (
            <li key={s.id} id={`story-${s.id}`} className="rule-b scroll-mt-28">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleStory(s.id)}
                  aria-expanded={open}
                  className="flex min-h-11 flex-1 items-baseline gap-4 py-4 text-left"
                >
                  <span className="chapter-marker w-6 shrink-0 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1">
                    <span className="font-serif text-xl">{s.teller_role}</span>
                    <span className="ml-3 text-sm text-muted">told by {s.channel}</span>
                    {s.channel === 'social' && (
                      <span className="chapter-marker ml-3 rounded-[3px] bg-accent/10 px-1.5 py-0.5 text-accent">
                        public post
                      </span>
                    )}
                  </span>
                  {s.source && !(s.channel === 'social' && s.source.startsWith('http')) && (
                    <span className="chapter-marker hidden shrink-0 rounded-[3px] border border-line px-2 py-1 sm:inline">
                      {s.source}
                    </span>
                  )}
                  <span className="chapter-marker shrink-0">
                    {counts.get(s.id)?.length ?? 0} excerpts
                    <span aria-hidden className="ml-2">{open ? '−' : '+'}</span>
                  </span>
                </button>
                {s.source && s.channel === 'social' && s.source.startsWith('http') && (
                  <a
                    href={s.source}
                    target="_blank"
                    rel="noreferrer"
                    className="chapter-marker hidden min-h-11 shrink-0 items-center rounded-[3px] border border-line px-2 underline decoration-dotted sm:inline-flex"
                  >
                    {socialNet(s.source)} · {host(s.source)}
                  </a>
                )}
              </div>
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
      <InView>
        <p className="mt-4 text-sm text-muted">
          {r.stories.length} real records — vouchers, hub posts, cards and plan
          documents, in their own words.
        </p>
      </InView>
    </Chapter>
  )
}
