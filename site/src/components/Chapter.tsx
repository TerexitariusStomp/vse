import type { ReactNode } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { InView } from './InView'
import { HOW } from '../copy'

/** One frame of the sequence: step marker, question, plain answer, collapsed how, body. */
export function Chapter({
  n,
  id,
  title,
  question,
  answer,
  how,
  children,
}: {
  n: string
  id: string
  title: ReactNode
  question: ReactNode
  answer: ReactNode
  how?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-36 pt-16 first:pt-10">
      <InView>
        <p className="chapter-marker">
          <span className="text-teal">{n}</span> · {title}
        </p>
        <h2 className="font-display mt-3 text-[clamp(1.9rem,4.5vw,3rem)] leading-[1.05] text-ink">
          {question}
        </h2>
        <p className="mt-4 max-w-2xl font-sans text-lg font-semibold leading-snug text-ink">
          {answer}
        </p>
        {how && (
          <Accordion.Root type="single" collapsible className="mt-3 max-w-2xl">
            <Accordion.Item value="how">
              <Accordion.Header>
                <Accordion.Trigger className="group flex min-h-11 items-center gap-2 rounded-[3px] text-sm text-muted outline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-teal">
                  {HOW.label}
                  <ChevronDown
                    size={14}
                    aria-hidden
                    className="motion-safe-only transition-transform group-data-[state=open]:rotate-180"
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="pb-2 text-sm leading-relaxed text-muted">
                {how}
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>
        )}
      </InView>
      {children}
    </section>
  )
}
