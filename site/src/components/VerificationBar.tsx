import type { Signal } from '../lib'
import { useVisitor, type Vote } from '../lib/store'

const COLORS: Record<Vote, string> = {
  endorse: 'bg-sage',
  amend: 'bg-warn',
  contest: 'bg-coral',
}

/** Stacked endorse/amend/contest band + visitor vote (FR-D5). */
export function VerificationBar({ signal }: { signal: Signal }) {
  const v = signal.verification
  const { votes, vote } = useVisitor()
  const myVote = votes[signal.id]
  const tally: Record<Vote, number> = {
    endorse: v.endorse + (myVote === 'endorse' ? 1 : 0),
    amend: v.amend + (myVote === 'amend' ? 1 : 0),
    contest: v.contest + (myVote === 'contest' ? 1 : 0),
  }
  const total = v.participants + (myVote ? 1 : 0)

  return (
    <div>
      <div
        className="flex h-2 w-full overflow-hidden rounded-[2px] bg-chrome"
        role="img"
        aria-label={`${tally.endorse} endorse, ${tally.amend} amend, ${tally.contest} contest of ${total}`}
      >
        {(['endorse', 'amend', 'contest'] as Vote[]).map((k) =>
          tally[k] ? (
            <div
              key={k}
              className={`${COLORS[k]} motion-safe-only transition-[width]`}
              style={{ width: `${(tally[k] / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <span className="text-sage">
          <strong className="tabular-nums">{tally.endorse}</strong> endorse
        </span>
        <span className="text-warn">
          <strong className="tabular-nums">{tally.amend}</strong> amend
        </span>
        <span className="text-coral">
          <strong className="tabular-nums">{tally.contest}</strong> contest
        </span>
        <span className="text-muted">of {total}</span>
        <span className="ml-auto flex gap-1.5" role="group" aria-label="Your response">
          {(['endorse', 'amend', 'contest'] as Vote[]).map((k) => (
            <button
              key={k}
              onClick={() => vote(signal.id, k)}
              aria-pressed={myVote === k}
              className={`min-h-11 rounded-[3px] border px-3 text-sm motion-safe-only transition-colors ${
                myVote === k
                  ? 'border-teal bg-teal text-teal-ink'
                  : 'border-line text-muted hover:border-teal hover:text-ink'
              }`}
            >
              {k}
            </button>
          ))}
        </span>
      </div>
      {v.amendments.map((a, i) => (
        <blockquote
          key={i}
          className="mt-3 border-l-2 border-line pl-3 font-serif italic text-muted"
        >
          “{a}”
        </blockquote>
      ))}
      {myVote && (
        <p className="mt-1.5 text-xs text-muted">
          Your “{myVote}” is counted in this view only — nothing is sent anywhere.
        </p>
      )}
    </div>
  )
}
