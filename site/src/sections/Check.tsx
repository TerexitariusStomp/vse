import { useResults } from '../lib'
import { checkAnswer } from '../lib/answers'
import { answers, HOW, QUESTIONS, STEPS } from '../copy'
import { Term } from '../components/Term'
import { Chapter } from '../components/Chapter'
import { GateControl } from '../components/GateControl'
import { VerificationBar } from '../components/VerificationBar'

/** Chapter 04 — the constitutional gate, made visible (FR-D5). */
export function Check() {
  const r = useResults()
  const a = checkAnswer(r)
  return (
    <Chapter
      n={STEPS[3].n}
      id="check"
      title={STEPS[3].label}
      question={QUESTIONS.check}
      answer={
        a.signals ? (
          <>
            {a.backed} of {a.signals} signals were <Term k="endorse">backed</Term> by most
            people who checked; {a.contested} {a.contested === 1 ? 'was' : 'were'}{' '}
            <Term k="contest">challenged</Term>.
          </>
        ) : (
          answers.checkEmpty
        )
      }
      how={HOW.check}
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
