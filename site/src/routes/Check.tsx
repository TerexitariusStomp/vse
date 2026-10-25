import { useResults } from '../lib'
import { GateControl } from '../components/GateControl'
import { VerificationBar } from '../components/VerificationBar'

/** Screen 4 — people check: verification bars, amendments, votes, gates (FR-D5). */
export function Check() {
  const r = useResults()
  return (
    <section>
      <h1 className="font-serif text-3xl font-semibold text-teal dark:text-sand">
        People check
      </h1>
      <p className="mt-2 max-w-2xl opacity-80">
        Nothing guides capital until the people who told the stories have
        checked it. This is what they said — and how you would respond.
      </p>
      <ul className="mt-6 space-y-4">
        {r.signals.map((s) => (
          <li
            key={s.id}
            className="rounded-xl border border-sand-deep/60 p-4"
          >
            <h2 className="font-serif text-xl font-medium">{s.statement}</h2>
            <div className="mt-3">
              <VerificationBar signal={s} />
            </div>
            <GateControl signal={s} />
          </li>
        ))}
      </ul>
    </section>
  )
}
