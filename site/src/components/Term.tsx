import type { ReactNode } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { GLOSSARY, type GlossaryKey } from '../lib/glossary'

/** Tap-friendly glossary term: dotted underline opens a plain definition. */
export function Term({ k, children }: { k: GlossaryKey; children?: ReactNode }) {
  const entry = GLOSSARY[k]
  return (
    <Popover.Root>
      <Popover.Trigger
        className="inline cursor-help rounded-[2px] px-0.5 py-3 -my-3 font-[inherit] underline decoration-dotted decoration-2 underline-offset-4 outline-offset-2 hover:text-teal focus-visible:outline-2 focus-visible:outline-teal data-[state=open]:text-teal"
      >
        {children ?? entry.term}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          collisionPadding={12}
          className="z-50 max-w-72 rounded-[3px] border border-line bg-surface p-4 text-sm font-normal normal-case leading-relaxed tracking-normal text-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]"
        >
          <p className="chapter-marker text-teal">{entry.term}</p>
          <p className="mt-1.5">{entry.plain}</p>
          <Popover.Arrow className="fill-line" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
