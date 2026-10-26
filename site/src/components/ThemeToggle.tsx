import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark') ||
    (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false),
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  const Icon = dark ? Sun : Moon
  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`flex min-h-11 min-w-11 items-center justify-center rounded-[3px] border border-line outline-offset-2 motion-safe-only transition-colors hover:border-teal focus-visible:outline-2 focus-visible:outline-teal ${className}`}
    >
      <Icon size={16} aria-hidden />
    </button>
  )
}
