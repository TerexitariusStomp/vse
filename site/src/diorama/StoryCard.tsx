import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { claimsByStory, signalMap, storySegments, useUI, type Results } from '../lib'

const socialNet = (src?: string) =>
  src?.includes('bsky.app')
    ? 'bsky'
    : src?.includes('njump.me')
      ? 'nostr'
      : src?.includes('hive.blog')
        ? 'hive'
        : 'social'
const host = (src: string) => {
  try {
    return new URL(src).hostname.replace(/^www\./, '')
  } catch {
    return src
  }
}

/** Modal story card opened from the diorama — the artifact's popup,
 *  restyled to the editorial idiom and driven by live results data. */
export function StoryCard({
  storyId,
  label,
  results,
  audio,
  onClose,
}: {
  storyId: string | null
  label: string | null
  results: Results
  audio?: string
  onClose: () => void
}) {
  const { goToSignal, openStory: currentOpen, toggleStory } = useUI()
  const [listening, setListening] = useState(false)
  const aud = useRef<HTMLAudioElement | null>(null)

  const story = storyId ? results.stories.find((s) => s.id === storyId) : undefined
  const claims = storyId ? (claimsByStory(results).get(storyId!) ?? []) : []
  const signals = signalMap(results)
  const fed = [...new Set(claims.map((c) => c.signal_id))]
    .map((id) => signals.get(id))
    .filter((s): s is NonNullable<typeof s> => !!s)

  useEffect(() => {
    return () => {
      aud.current?.pause()
      aud.current = null
    }
  }, [storyId])

  function stop() {
    aud.current?.pause()
    aud.current = null
    setListening(false)
  }
  function listen() {
    if (listening) return stop()
    try {
      const a = new Audio(`${import.meta.env.BASE_URL}${audio}`)
      a.onended = a.onerror = () => setListening(false)
      void a.play().catch(() => setListening(false))
      aud.current = a
      setListening(true)
    } catch {
      /* audio unavailable */
    }
  }

  return (
    <Dialog.Root
      open={!!story}
      onOpenChange={(o) => {
        if (!o) {
          stop()
          onClose()
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(92vw,42rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-line bg-paper p-6 shadow-xl focus:outline-none">
          {story && (
            <>
              <Dialog.Title className="font-display text-2xl leading-tight text-ink">
                {story.teller_role}
              </Dialog.Title>
              <Dialog.Description className="chapter-marker mt-1.5">
                Told by {story.channel} · {claims.length} excerpt
                {claims.length === 1 ? '' : 's'} highlighted
                {label ? ` · ${label}` : ''}
              </Dialog.Description>
              <p className="story-text mt-5 text-lg leading-relaxed">
                {storySegments(story, claims).map((seg, i) =>
                  seg.claim ? (
                    <mark key={i} className="excerpt">
                      {seg.text}
                    </mark>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  ),
                )}
              </p>
              {fed.length > 0 && (
                <div className="mt-5">
                  <p className="chapter-marker mb-2">Feeds</p>
                  <div className="flex flex-wrap gap-1.5">
                    {fed.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          stop()
                          onClose()
                          goToSignal(s.id)
                        }}
                        className="rounded-[3px] border border-line px-2.5 py-1.5 text-xs text-muted motion-safe-only transition-colors hover:border-teal hover:text-ink"
                      >
                        {s.statement}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {audio && (
                  <button
                    onClick={listen}
                    className="min-h-11 rounded-[3px] bg-teal px-5 py-2 font-medium text-teal-ink motion-safe-only transition-colors hover:bg-teal-deep"
                  >
                    {listening ? 'Stop' : 'Listen'}
                  </button>
                )}
                {story.source && (
                  <a
                    href={story.source}
                    target="_blank"
                    rel="noreferrer"
                    className="chapter-marker rounded-[3px] border border-line px-2.5 py-2 underline decoration-dotted"
                  >
                    {socialNet(story.source)} · {host(story.source)}
                  </a>
                )}
                <Dialog.Close asChild>
                  <button className="ml-auto min-h-11 rounded-[3px] border border-line px-5 py-2 text-sm text-muted motion-safe-only transition-colors hover:border-teal hover:text-ink">
                    Close
                  </button>
                </Dialog.Close>
              </div>
              <button
                onClick={() => {
                  stop()
                  onClose()
                  if (currentOpen !== story.id) toggleStory(story.id)
                  document
                    .getElementById(`story-${story.id}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
                className="mt-3 text-xs text-muted underline decoration-dotted underline-offset-2 hover:text-ink"
              >
                See it in the stories ↓
              </button>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
