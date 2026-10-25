import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

/** One frame of the sequence: chapter marker, display heading, intro, body. */
export function Chapter({
  n,
  id,
  title,
  intro,
  children,
}: {
  n: string
  id: string
  title: ReactNode
  intro?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 pt-16 first:pt-10">
      <Reveal>
        <p className="chapter-marker">
          <span className="text-teal">{n}</span> · {title}
        </p>
        {intro && <p className="mt-3 max-w-2xl text-muted">{intro}</p>}
      </Reveal>
      {children}
    </section>
  )
}
