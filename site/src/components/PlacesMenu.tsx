import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { PLACES } from '../lib'

export const CHAPTERS = [
  { id: 'place', n: '01', label: 'Place' },
  { id: 'stories', n: '02', label: 'Stories' },
  { id: 'signals', n: '03', label: 'Signals' },
  { id: 'check', n: '04', label: 'Check' },
  { id: 'capital', n: '05', label: 'Capital' },
  { id: 'priorities', n: '06', label: 'Priorities' },
]

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
        <svg
          width="11"
          height="11"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
          className="mt-1 text-muted motion-safe-only transition-transform group-data-[state=open]:rotate-180"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-56 rounded-[3px] border border-line bg-surface py-1 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]"
        >
          <DropdownMenu.Label className="chapter-marker px-4 pb-1.5 pt-2.5">
            Places heard
          </DropdownMenu.Label>
          {PLACES.map((p) => (
            <DropdownMenu.Item key={p.id} asChild>
              <a
                href={`?place=${p.id}`}
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
              </a>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Chapter jump menu — mobile only. Desktop keeps the inline chapter links and
 * the left progress rail; small screens get the same destinations here.
 */
export function ChaptersMenu({ active }: { active: string }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="chapter-marker flex min-h-11 items-center gap-1.5 rounded-[3px] px-2 py-2 outline-offset-2 motion-safe-only transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-teal"
        aria-label="Jump to a chapter"
      >
        Chapters
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
          className="motion-safe-only transition-transform [[data-state=open]>&]:rotate-180"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-44 rounded-[3px] border border-line bg-surface py-1 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]"
        >
          {CHAPTERS.map((c) => (
            <DropdownMenu.Item key={c.id} asChild>
              <a
                href={`#${c.id}`}
                aria-current={c.id === active ? 'true' : undefined}
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
