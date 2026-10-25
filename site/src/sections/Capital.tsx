import { useRef, useState } from 'react'
import {
  avgSignalsPerIntervention,
  signalMap,
  unreachedSignals,
  useResults,
  useUI,
  type Intervention,
  type View,
} from '../lib'
import { Chapter } from '../components/Chapter'
import { BipartiteGraph } from '../components/BipartiteGraph'
import { SipBadge } from '../components/SipBadge'

const VIEW_LABEL: Record<View, string> = {
  from_plans: 'From the plans',
  from_place: 'From the place',
}
const VIEW_HINT: Record<View, string> = {
  from_plans: 'One project per need — the conventional, siloed way.',
  from_place: 'Interventions that answer several needs at once.',
}

/** Chapter 05 — the two-way mirror: same signals, structured two ways. */
export function Capital() {
  const r = useResults()
  const { goToSignal } = useUI()
  const [view, setView] = useState<View>('from_place')
  const [open, setOpen] = useState<Intervention | null>(null)
  const detailRef = useRef<HTMLLIElement>(null)
  const signals = signalMap(r)
  const sipById = new Map(r.sips.map((s) => [s.id, s]))
  const list = r.interventions[view]
  const avg = avgSignalsPerIntervention(list)
  const missing = unreachedSignals(r, view)

  return (
    <Chapter
      n="05"
      id="capital"
      title="Where capital goes"
      intro="The same signals, structured two ways. A place can be funded as a
      list of separate projects — or as a place."
    >
      {/* typographic tab — underline marks the live view */}
      <div className="rule-b mt-6 flex gap-8" role="group" aria-label="View">
        {(['from_plans', 'from_place'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`min-h-11 pb-3 font-serif text-xl motion-safe-only transition-colors ${
              view === v
                ? 'border-b-2 border-teal text-ink -mb-px'
                : 'text-muted hover:text-ink'
            }`}
          >
            {VIEW_LABEL[v]}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">{VIEW_HINT[view]}</p>

      <div className="mt-6 overflow-x-auto border border-line p-4">
        <div className="mb-2 flex justify-between text-[11px] uppercase tracking-[0.18em] text-muted">
          <span>Signals</span>
          <span>Interventions</span>
        </div>
        <BipartiteGraph
          view={view}
          onOpen={(i) => {
            setOpen(i)
            detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <p className="text-sm">
          Needs answered per intervention:{' '}
          <span className="font-display text-2xl tabular-nums text-teal">{avg.toFixed(1)}</span>
        </p>
        <p className="text-sm text-muted">
          {view === 'from_plans'
            ? 'each plan reaches exactly one signal.'
            : 'each intervention answers several at once.'}
        </p>
      </div>
      {missing.length > 0 && (
        <p className="mt-3 border-l-2 border-coral pl-4 text-sm">
          This view never reaches:{' '}
          {missing.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ' · '}
              <button
                onClick={() => goToSignal(s.id)}
                className="font-serif italic underline decoration-coral/50 underline-offset-2 hover:decoration-coral"
              >
                {s.statement}
              </button>
            </span>
          ))}
        </p>
      )}

      <ol className="rule-t mt-8">
        {list.map((i) => (
          <li
            key={i.id}
            ref={open?.id === i.id ? detailRef : undefined}
            className={`rule-b py-5 pl-4 -ml-4 border-l-2 motion-safe-only transition-colors ${
              open?.id === i.id ? 'border-teal bg-chrome/30' : 'border-transparent'
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-xl">{i.name}</h2>
              <span className="chapter-marker text-sage">
                {i.signal_ids.length} need{i.signal_ids.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted">{i.note}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {i.signal_ids.map((sid) => (
                <button
                  key={sid}
                  onClick={() => goToSignal(sid)}
                  className="min-h-11 rounded-[3px] border border-line px-2.5 text-xs text-muted underline-offset-2 motion-safe-only transition-colors hover:border-teal hover:text-ink hover:underline"
                >
                  {signals.get(sid)?.statement ?? sid}
                </button>
              ))}
              {(i.counter_signal_ids ?? []).map((sid) => (
                <button
                  key={sid}
                  onClick={() => goToSignal(sid)}
                  title="Counter-evidence: this intervention harms this signal"
                  className="min-h-11 rounded-[3px] border border-coral/60 px-2.5 text-xs text-coral underline-offset-2 motion-safe-only transition-colors hover:underline"
                >
                  against · {signals.get(sid)?.statement ?? sid}
                </button>
              ))}
            </div>
            {i.sip_id && sipById.get(i.sip_id) && (
              <div className="mt-3">
                <SipBadge sip={sipById.get(i.sip_id)!} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </Chapter>
  )
}
