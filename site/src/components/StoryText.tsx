import { Link } from 'react-router-dom'
import { claimsByStory, signalMap, storySegments, type Claim, type Story } from '../lib/results'
import { useResults } from '../lib/store'

/** Renders a story's text with each claim highlighted in place (FR-D3). */
export function StoryText({
  story,
  focusClaimId,
}: {
  story: Story
  focusClaimId?: string
}) {
  const results = useResults()
  const claims = claimsByStory(results).get(story.id) ?? []
  const signals = signalMap(results)
  const segs = storySegments(story, claims)

  return (
    <p className="story-text text-lg">
      {segs.map((seg, i) =>
        seg.claim ? (
          <Excerpt
            key={i}
            claim={seg.claim}
            text={seg.text}
            signalStatement={signals.get(seg.claim.signal_id)?.statement}
            focused={seg.claim.id === focusClaimId}
          />
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </p>
  )
}

function Excerpt({
  claim,
  text,
  signalStatement,
  focused,
}: {
  claim: Claim
  text: string
  signalStatement?: string
  focused?: boolean
}) {
  return (
    <Link
      to={`/signals/${claim.signal_id}`}
      title={signalStatement ? `Feeds: ${signalStatement}` : undefined}
      id={claim.id}
      className={`excerpt motion-safe-only transition-colors ${
        focused ? 'bg-coral/30 dark:bg-coral/40' : ''
      }`}
    >
      {text}
    </Link>
  )
}
