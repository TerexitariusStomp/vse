import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Link } from 'wouter'
import { ChevronDown } from 'lucide-react'
import { PLACES } from '../lib'
import { STEPS, stepBar } from '../copy'

/**
 * Place switcher — the header's place name is the trigger, opening a ruled
 * menu of every place the engine has heard. Radix supplies focus trap, Esc,
 * and arrow-key navigation; styling follows the editorial idiom (hairlines,
 * chapter markers, no chrome).
 */
export function PlacesMenu({ current }: { current: string }) {
  const meta = PLACES.find((p) => p.id === current)
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="group flex min-h-11 items-center gap-1.5 rounded-[3px] font-display text-lg text-ink outline-offset-2 motion-safe-only transition-colors focus-visible:outline-2 focus-visible:outline-teal data-[state=open]:text-teal"
        aria-label={`Places — currently ${meta?.label ?? current}`}
      >
        {meta?.label}
        <ChevronDown
          size={12}
          aria-hidden
          className="mt-1 text-muted motion-safe-only transition-transform group-data-[state=open]:rotate-180"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-56 rounded-[3px] border border-line bg-surface py-1 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]"
        >
          <DropdownMenu.Item asChild>
            <Link
              href="/"
              className="mx-1 flex min-h-11 items-baseline justify-between gap-3 rounded-[3px] px-3 py-2.5 text-sm text-muted outline-none motion-safe-only transition-colors data-[highlighted]:bg-paper"
            >
              <span>What this is</span>
              <span className="chapter-marker shrink-0">Home</span>
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Label className="chapter-marker px-4 pb-1.5 pt-2.5">
            Places heard
          </DropdownMenu.Label>
          {PLACES.map((p) => (
            <DropdownMenu.Item key={p.id} asChild>
              <Link
                href={`/${p.id}`}
                aria-current={p.id === current ? 'true' : undefined}
                className={`rule-t mx-1 flex min-h-11 items-baseline justify-between gap-3 px-3 py-2.5 text-sm outline-none motion-safe-only transition-colors first:border-t-0 data-[highlighted]:bg-paper ${
                  p.id === current ? 'font-medium text-ink' : 'text-muted'
                }`}
              >
                <span>{p.label}</span>
                <span className="chapter-marker shrink-0">
                  {[p.id === current ? 'Now' : '', p.data === 'dummy' ? 'Dummy' : '']
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/** Step jump menu — the centre of the compact mobile step bar. */
export function ChaptersMenu({ active }: { active: string }) {
  const idx = Math.max(0, STEPS.findIndex((c) => c.id === active))
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="chapter-marker flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[3px] px-2 py-2 outline-offset-2 motion-safe-only transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-teal"
      >
        <span className="text-teal tabular-nums">{idx + 1} / {STEPS.length}</span> · {STEPS[idx].label}
        <span className="sr-only">{stepBar.jump}</span>
        <ChevronDown
          size={12}
          aria-hidden
          className="motion-safe-only transition-transform [[data-state=open]>&]:rotate-180"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="center"
          sideOffset={6}
          className="z-50 min-w-44 rounded-[3px] border border-line bg-surface py-1 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]"
        >
          {STEPS.map((c) => (
            <DropdownMenu.Item key={c.id} asChild>
              <a
                href={`#${c.id}`}
                aria-current={c.id === active ? 'step' : undefined}
                className={`mx-1 flex min-h-11 items-baseline gap-3 px-3 py-2.5 text-sm outline-none motion-safe-only transition-colors data-[highlighted]:bg-paper ${
                  c.id === active ? 'font-medium text-ink' : 'text-muted'
                }`}
              >
                <span className="chapter-marker shrink-0">{c.n}</span>
                <span>{c.label}</span>
              </a>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
