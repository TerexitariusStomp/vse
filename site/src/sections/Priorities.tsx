import { useResults } from '../lib'
import { Chapter } from '../components/Chapter'
import { Reveal } from '../components/Reveal'

/** Chapter 06 — the close; a designed empty state (FR-D7). */
export function Priorities() {
  const r = useResults()
  const p = r.priorities
  return (
    <Chapter n="06" id="priorities" title={p.title} intro={p.intro}>
      {p.items.length === 0 ? (
        <Reveal>
          <div className="rule-b mt-10 pb-14 text-center">
            <p className="font-display mx-auto max-w-xl text-3xl leading-snug text-ink">
              Written last — after the place has been heard.
            </p>
            <p className="chapter-marker mt-4">
              The VSE team fills this in at publication
            </p>
          </div>
        </Reveal>
      ) : (
        <ol className="rule-t mt-8">
          {p.items.map((item, i) => (
            <li key={i} className="rule-b py-6">
              <h2 className="font-serif text-2xl">{item.heading}</h2>
              <p className="measure mt-2 text-muted">{item.text}</p>
            </li>
          ))}
        </ol>
      )}
    </Chapter>
  )
}
