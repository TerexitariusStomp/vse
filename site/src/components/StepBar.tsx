import { useEffect, useState } from 'react'
import { m, useReducedMotion, useScroll } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { STEPS, stepBar } from '../copy'
import { ChaptersMenu } from './PlacesMenu'

/** Sticky step bar: scroll-spy, scroll progress line, compact mobile row. */
export function StepBar() {
  const [active, setActive] = useState<string>(STEPS[0].id)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()

  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    STEPS.forEach((c) => {
      const el = document.getElementById(c.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  const idx = STEPS.findIndex((c) => c.id === active)
  const prev = STEPS[Math.max(0, idx - 1)]
  const next = STEPS[Math.min(STEPS.length - 1, idx + 1)]
  const focusRing =
    'outline-offset-2 focus-visible:outline-2 focus-visible:outline-teal'

  return (
    <div className="rule-b relative bg-paper/95 backdrop-blur-sm">
      <nav aria-label={stepBar.label} className="mx-auto max-w-5xl px-5">
        <ol className="hidden items-center md:flex">
          {STEPS.map((c, i) => (
            <li key={c.id} className="flex-1">
              <a
                href={`#${c.id}`}
                aria-current={active === c.id ? 'step' : undefined}
                className={`chapter-marker flex min-h-11 items-center gap-2 rounded-[3px] py-2 motion-safe-only transition-colors hover:text-ink ${focusRing} ${
                  active === c.id ? 'text-ink' : ''
                }`}
              >
                <span className={`tabular-nums ${i <= idx ? 'text-teal' : ''}`}>{i + 1}</span>
                {c.label}
              </a>
            </li>
          ))}
        </ol>
        <div className="flex items-center md:hidden">
          <a
            href={`#${prev.id}`}
            aria-label={stepBar.prev}
            aria-disabled={idx === 0 || undefined}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-[3px] text-muted hover:text-ink ${focusRing} ${idx === 0 ? 'opacity-40' : ''}`}
          >
            <ChevronLeft size={18} aria-hidden />
          </a>
          <ChaptersMenu active={active} />
          <a
            href={`#${next.id}`}
            aria-label={stepBar.next}
            aria-disabled={idx === STEPS.length - 1 || undefined}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-[3px] text-muted hover:text-ink ${focusRing} ${idx === STEPS.length - 1 ? 'opacity-40' : ''}`}
          >
            <ChevronRight size={18} aria-hidden />
          </a>
        </div>
      </nav>
      <m.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-teal"
        style={{ scaleX: reduced ? 1 : scrollYProgress }}
      />
    </div>
  )
}
