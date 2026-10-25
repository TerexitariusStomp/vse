import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { SIP_KIND_LABEL, storyMap, useResults, type Sip } from '../lib'

/** "Could tip the system" badge → dialog with the SIP's detail (FR-D6). */
export function SipBadge({ sip }: { sip: Sip }) {
  const ref = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button
        onClick={() => ref.current?.showModal()}
        className="min-h-11 rounded-full border border-coral/50 px-3 text-sm text-coral motion-safe-only transition-colors hover:bg-coral/10"
      >
        ★ could tip the system
      </button>
      <dialog
        ref={ref}
        className="w-[min(36rem,92vw)] rounded-xl border border-sand-deep bg-paper p-6 text-ink backdrop:bg-ink/40 dark:bg-[#16262a] dark:text-[#e9e4dc]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-coral">
              {SIP_KIND_LABEL[sip.kind]} · could tip the system
            </p>
            <h3 className="mt-1 font-serif text-xl">{sip.title}</h3>
          </div>
          <form method="dialog">
            <button
              aria-label="Close"
              className="min-h-11 min-w-11 rounded-full px-3 text-lg hover:bg-sand dark:hover:bg-teal-deep"
            >
              ×
            </button>
          </form>
        </div>
        <p className="mt-3">{sip.what_changes}</p>
        <p className="mt-2 text-sm">
          <span className="opacity-70">Time to show:</span> {sip.time_to_show}
        </p>
        <SipEvidence sip={sip} />
      </dialog>
    </>
  )
}

function SipEvidence({ sip }: { sip: Sip }) {
  const results = useResults()
  const stories = storyMap(results)
  const claimById = new Map(results.claims.map((c) => [c.id, c]))
  return (
    <div className="mt-4 border-t border-sand-deep pt-3">
      <p className="text-xs uppercase tracking-wide opacity-70">Evidence</p>
      <ul className="mt-2 space-y-2">
        {sip.evidence_claim_ids.map((cid) => {
          const c = claimById.get(cid)
          if (!c) return null
          const st = stories.get(c.story_id)
          return (
            <li key={cid} className="font-serif text-sm">
              <Link
                to={`/stories/${c.story_id}#${cid}`}
                className="italic underline decoration-sage underline-offset-2"
              >
                “{c.text}”
              </Link>{' '}
              <span className="not-italic opacity-60">— {st?.teller_role}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
