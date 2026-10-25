import { useRef } from 'react'
import { SIP_KIND_LABEL, storyMap, useResults, useUI, type Sip } from '../lib'

/** "Could tip the system" marker → dialog with the SIP's detail (FR-D6). */
export function SipBadge({ sip }: { sip: Sip }) {
  const ref = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button
        onClick={() => ref.current?.showModal()}
        className="min-h-11 text-left text-xs font-medium uppercase tracking-wide text-coral underline decoration-coral/40 underline-offset-4 motion-safe-only transition-colors hover:decoration-coral"
      >
        ★ could tip the system
      </button>
      <dialog
        ref={ref}
        className="w-[min(36rem,92vw)] rounded-[3px] border border-line bg-surface p-6 text-ink backdrop:bg-ink/50"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="chapter-marker text-coral">
              {SIP_KIND_LABEL[sip.kind]} · could tip the system
            </p>
            <h3 className="font-display mt-2 text-2xl">{sip.title}</h3>
          </div>
          <form method="dialog">
            <button
              aria-label="Close"
              className="min-h-11 min-w-11 rounded-[3px] px-3 text-lg hover:bg-chrome"
            >
              ×
            </button>
          </form>
        </div>
        <p className="mt-4 leading-relaxed">{sip.what_changes}</p>
        <p className="mt-3 text-sm">
          <span className="chapter-marker">Time to show</span>{' '}
          <span className="ml-1">{sip.time_to_show}</span>
        </p>
        <SipEvidence sip={sip} close={() => ref.current?.close()} />
      </dialog>
    </>
  )
}

function SipEvidence({ sip, close }: { sip: Sip; close: () => void }) {
  const results = useResults()
  const { goToClaim } = useUI()
  const stories = storyMap(results)
  const claimById = new Map(results.claims.map((c) => [c.id, c]))
  return (
    <div className="rule-t mt-5 pt-4">
      <p className="chapter-marker">Evidence</p>
      <ul className="mt-3 space-y-3">
        {sip.evidence_claim_ids.map((cid) => {
          const c = claimById.get(cid)
          if (!c) return null
          const st = stories.get(c.story_id)
          return (
            <li key={cid} className="font-serif text-sm">
              <button
                onClick={() => {
                  close()
                  goToClaim(c.story_id, cid)
                }}
                className="text-left italic underline decoration-line underline-offset-4 motion-safe-only transition-colors hover:decoration-teal"
              >
                “{c.text}”
              </button>{' '}
              <span className="not-italic text-muted">— {st?.teller_role}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
