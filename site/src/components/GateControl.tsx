import { GATE_HINT, GATE_LABEL, type Gate, type Signal } from '../lib'
import { useVisitor } from '../lib/store'

const ORDER: Gate[] = ['may_be_priced', 'commons_only', 'not_yet']

/** Visitor-adjustable gate per signal, initialised from the file (FR-D5). */
export function GateControl({ signal }: { signal: Signal }) {
  const { gateOverrides, setGate } = useVisitor()
  const current = gateOverrides[signal.id] ?? signal.verification.gate
  const changed = signal.id in gateOverrides

  return (
    <div className="mt-3">
      <div
        className="inline-flex flex-wrap gap-1 rounded-full border border-sand-deep p-1"
        role="group"
        aria-label={`Gate for ${signal.statement}`}
      >
        {ORDER.map((g) => (
          <button
            key={g}
            onClick={() => setGate(signal.id, g)}
            aria-pressed={current === g}
            className={`min-h-11 rounded-full px-3 text-sm motion-safe-only transition-colors ${
              current === g
                ? g === 'commons_only'
                  ? 'bg-sage text-paper'
                  : g === 'not_yet'
                    ? 'bg-sand-deep text-ink'
                    : 'bg-teal text-paper'
                : 'hover:bg-sand dark:hover:bg-teal-deep'
            }`}
          >
            {GATE_LABEL[g]}
          </button>
        ))}
      </div>
      <p className="mt-1 text-sm opacity-80">
        {GATE_HINT[current]}
        {changed && <span className="ml-2 italic">(your change is local to this view)</span>}
      </p>
    </div>
  )
}
