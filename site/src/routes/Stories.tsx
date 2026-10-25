import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { claimsByStory, useResults } from '../lib'
import { StoryText } from '../components/StoryText'

/** Screen 2 — stories list; tellers by role + channel only (FR-D3). */
export function Stories() {
  const r = useResults()
  const counts = claimsByStory(r)
  return (
    <section>
      <h1 className="font-serif text-3xl font-semibold text-teal dark:text-sand">Stories</h1>
      <p className="mt-2 opacity-80">
        Told in their own words. People are named by role only.
      </p>
      <ul className="mt-6 grid gap-3">
        {r.stories.map((s) => (
          <li key={s.id}>
            <Link
              to={`/stories/${s.id}`}
              className="block rounded-xl border border-sand-deep/60 p-4 motion-safe-only transition-colors hover:border-teal hover:bg-sand/40 dark:hover:bg-teal-deep/30"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-medium">{s.teller_role}</h2>
                <span className="text-sm opacity-70">
                  told by {s.channel} · {counts.get(s.id)?.length ?? 0} excerpts
                </span>
              </div>
              <p className="mt-1 line-clamp-2 font-serif opacity-80">{s.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function StoryDetail() {
  const r = useResults()
  const { storyId } = useParams()
  const focus = useLocation().hash.slice(1)
  const story = r.stories.find((s) => s.id === storyId)

  // Scroll the traced claim into view (deep link from a signal detail).
  useEffect(() => {
    if (focus) document.getElementById(focus)?.scrollIntoView({ block: 'center' })
  }, [focus, storyId])

  if (!story) return <p>Story not found.</p>

  return (
    <section>
      <p className="text-sm opacity-70">
        <Link to="/stories" className="underline underline-offset-2">← all stories</Link>
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-teal dark:text-sand">
        {story.teller_role}
      </h1>
      <p className="mt-1 text-sm opacity-70">told by {story.channel}</p>
      <div className="mt-6 rounded-xl border border-sand-deep/60 p-6">
        <StoryText story={story} focusClaimId={focus || undefined} />
      </div>
      <p className="mt-3 text-sm opacity-70">
        Highlighted passages are the exact excerpts that feed signals — tap one to
        see where it lands.
      </p>
    </section>
  )
}
