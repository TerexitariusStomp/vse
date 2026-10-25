import { GATE_HINT, GATE_LABEL, type Gate, type Signal } from '../lib'
import { useVisitor } from '../lib/store'

const ORDER: Gate[] = ['may_be_priced', 'commons_only', 'not_yet']
const ACTIVE: Record<Gate, string> = {
  may_be_priced: 'bg-teal text-teal-ink border-teal',
  commons_only: 'bg-sage text-teal-ink border-sage',
  not_yet: 'bg-warn text-teal-ink border-warn',
}

/** Visitor-adjustable gate per signal, initialised from the file (FR-D5). */
export function GateControl({ signal }: { signal: Signal }) {
  const { gateOverrides, setGate } = useVisitor()
  const current = gateOverrides[signal.id] ?? signal.verification.gate
  const changed = signal.id in gateOverrides

  return (
    <div className="mt-4">
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={`Gate for ${signal.statement}`}
      >
        {ORDER.map((g) => (
          <button
            key={g}
            onClick={() => setGate(signal.id, g)}
            aria-pressed={current === g}
            className={`min-h-11 rounded-[3px] border px-3 text-xs font-medium uppercase tracking-wide motion-safe-only transition-colors ${
              current === g
                ? ACTIVE[g]
                : 'border-line text-muted hover:border-teal hover:text-ink'
            }`}
          >
            {GATE_LABEL[g]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">
        {GATE_HINT[current]}
        {changed && <span className="ml-2 italic">(your change is local to this view)</span>}
      </p>
    </div>
  )
}
