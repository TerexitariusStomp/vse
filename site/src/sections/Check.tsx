import { useResults } from '../lib'
import { Chapter } from '../components/Chapter'
import { GateControl } from '../components/GateControl'
import { VerificationBar } from '../components/VerificationBar'

/** Chapter 04 — the constitutional gate, made visible (FR-D5). */
export function Check() {
  const r = useResults()
  return (
    <Chapter
      n="04"
      id="check"
      title="People check"
      intro="Nothing guides capital until the people who told the stories have
      checked it. This is what they said — and how you would respond."
    >
      <ol className="rule-t mt-6">
        {r.signals.map((s) => (
          <li key={s.id} className="rule-b py-6">
            <h2 className="font-serif text-xl leading-snug">{s.statement}</h2>
            <div className="mt-4 max-w-2xl">
              <VerificationBar signal={s} />
            </div>
            <GateControl signal={s} />
          </li>
        ))}
      </ol>
    </Chapter>
  )
}
