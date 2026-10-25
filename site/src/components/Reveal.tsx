import { useEffect, useRef, type ReactNode } from 'react'

/** Silk scroll-reveal: rises into place when the frame enters view. */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'li' | 'section'
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Above the fold: play on mount — the headline must never wait on an
    // observer tick. Below the fold: reveal on approach.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      const raf = requestAnimationFrame(() => el.classList.add('in'))
      return () => cancelAnimationFrame(raf)
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('in')
          obs.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
