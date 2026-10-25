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

/** Screen 5 — where capital goes: toggle, network, averages, gaps (FR-D6). */
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
    <section id="capital" className="scroll-mt-6">
      <h1 className="font-serif text-3xl font-semibold text-teal dark:text-sand">
        Where capital goes
      </h1>
      <p className="mt-2 max-w-2xl opacity-80">
        The same signals, structured two ways. One place can be funded as a
        list of separate projects — or as a place.
      </p>

      <div
        className="mt-5 inline-flex rounded-full border border-sand-deep p-1"
        role="group"
        aria-label="View"
      >
        {(['from_plans', 'from_place'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`min-h-11 rounded-full px-4 text-sm font-medium motion-safe-only transition-colors ${
              view === v ? 'bg-teal text-paper' : 'hover:bg-sand dark:hover:bg-teal-deep'
            }`}
          >
            {VIEW_LABEL[v]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm opacity-70">{VIEW_HINT[view]}</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-sand-deep/60 p-4">
        <div className="mb-2 flex justify-between text-xs uppercase tracking-wide opacity-60">
          <span>What the place is saying</span>
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

      <p className="mt-4 text-sm">
        Needs answered per intervention: <strong>{avg.toFixed(1)}</strong> on
        average —{' '}
        {view === 'from_plans'
          ? 'each plan reaches exactly one signal.'
          : 'each intervention answers several.'}
      </p>
      {missing.length > 0 && (
        <p className="mt-2 border-l-4 border-coral pl-3 text-sm">
          This view never reaches:{' '}
          {missing.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ' · '}
              <button
                onClick={() => goToSignal(s.id)}
                className="font-serif italic underline decoration-coral/60 underline-offset-2"
              >
                {s.statement}
              </button>
            </span>
          ))}
        </p>
      )}

      <ul className="mt-6 grid items-start gap-3 sm:grid-cols-2">
        {list.map((i) => (
          <li
            key={i.id}
            ref={open?.id === i.id ? detailRef : undefined}
            className={`rounded-xl border p-4 motion-safe-only transition-colors ${
              open?.id === i.id ? 'border-teal bg-sand/40 dark:bg-teal-deep/30' : 'border-sand-deep/60'
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-medium">{i.name}</h2>
              <span className="text-sm text-sage">
                {i.signal_ids.length} need{i.signal_ids.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="mt-1 text-sm opacity-80">{i.note}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {i.signal_ids.map((sid) => (
                <button
                  key={sid}
                  onClick={() => goToSignal(sid)}
                  className="rounded-full bg-sand px-2 py-0.5 text-xs underline-offset-2 hover:underline dark:bg-teal-deep"
                >
                  {signals.get(sid)?.statement ?? sid}
                </button>
              ))}
              {(i.counter_signal_ids ?? []).map((sid) => (
                <button
                  key={sid}
                  onClick={() => goToSignal(sid)}
                  title="Counter-evidence: this intervention harms this signal"
                  className="rounded-full border border-coral/50 px-2 py-0.5 text-xs text-coral underline-offset-2 hover:underline"
                >
                  ⚠ {signals.get(sid)?.statement ?? sid}
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
      </ul>
    </section>
  )
}
