import { useResults } from '../lib'

/** Screen 6 — where capital is most needed; designed empty state (FR-D7). */
export function Priorities() {
  const r = useResults()
  const p = r.priorities
  return (
    <section id="priorities" className="scroll-mt-6">
      <h1 className="font-serif text-3xl font-semibold text-teal dark:text-sand">
        {p.title}
      </h1>
      <p className="mt-2 max-w-2xl opacity-80">{p.intro}</p>
      {p.items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-sand-deep p-8 text-center">
          <p className="font-serif text-lg italic opacity-80">
            Written last — after the place has been heard.
          </p>
          <p className="mt-2 text-sm opacity-60">
            The VSE team fills this in at publication.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {p.items.map((item, i) => (
            <li key={i} className="rounded-xl border border-sand-deep/60 p-5">
              <h2 className="font-serif text-xl font-medium">{item.heading}</h2>
              <p className="mt-2 opacity-85">{item.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
