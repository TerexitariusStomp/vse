import { useEffect, useMemo, useRef, useState } from 'react'
import createGlobe from 'cobe'
import { Link, useLocation } from 'wouter'
import { type PlaceId } from '../lib'

// cobe globe — same idiom as springforth's GlobeView / living-resources
// Globe.astro: auto-rotate, drag to spin, markers per place. Editorial
// palette: ink landmass on paper, teal markers.

interface Mark {
  id: PlaceId
  label: string
  lat: number
  lon: number
  fictional?: boolean
}

// Coords come from each place's published artifact (place.geo). Utopia is a
// fictional Welsh-flavoured valley — drawn dimmer and tagged in the legend.
const MARKS: Mark[] = [
  { id: 'thorntree', label: 'Thorntree', lat: 54.55, lon: -1.208 },
  { id: 'kenya-coast', label: 'Kenya coast', lat: -4.18, lon: 39.46 },
  { id: 'mida-creek', label: 'Mida Creek', lat: -3.349, lon: 39.986 },
  { id: 'hebden-bridge', label: 'Hebden Bridge', lat: 53.7433, lon: -2.0136 },
  { id: 'dar-es-salaam', label: 'Dar es Salaam', lat: -6.865, lon: 39.32 },
  { id: 'puerto-la-cruz', label: 'Puerto la Cruz', lat: 10.2136, lon: -64.6333 },
  { id: 'minneapolis', label: 'Minneapolis', lat: 44.9778, lon: -93.265 },
  { id: 'nairobi', label: 'Nairobi', lat: -1.2921, lon: 36.8219 },
  { id: 'detroit', label: 'Detroit', lat: 42.3314, lon: -83.0458 },
  { id: 'utopia', label: 'Utopia', lat: 52.5, lon: -3.7, fictional: true },
]

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function cssVar(n: string, fb: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb
}

// Orthographic projection matching cobe's phi/theta so markers can be
// hit-tested for clicks and highlighted when their place is active.
function project(lat: number, lon: number, phi: number, theta: number, w: number) {
  const la = (lat * Math.PI) / 180
  const lo = (lon * Math.PI) / 180 + phi
  const x = Math.cos(la) * Math.sin(lo)
  const y0 = Math.sin(la)
  const z = Math.cos(la) * Math.cos(lo)
  const y = y0 * Math.cos(theta) - z * Math.sin(theta)
  const zr = y0 * Math.sin(theta) + z * Math.cos(theta)
  return { x: (x * w) / 2 + w / 2, y: (-y * w) / 2 + w / 2, front: zr > 0 }
}

export function Globe({
  active,
  focus,
  legend = true,
}: {
  active?: PlaceId
  focus?: PlaceId | null
  legend?: boolean
}) {
  const [, navigate] = useLocation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null)
  const phi = useRef(Math.PI) // start facing the Atlantic-ish
  const target = useRef<number | null>(null)
  const movement = useRef(0)
  const interacting = useRef<number | null>(null)
  const [themeTick, setThemeTick] = useState(0)
  const reduced = useRef(
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  )
  const dark = document.documentElement.classList.contains('dark')

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // Ease the globe to face the active place's longitude, then resume.
  useEffect(() => {
    const m = MARKS.find((m) => m.id === (focus ?? active))
    if (!m) return
    const want = -((m.lon * Math.PI) / 180)
    let d = want - ((phi.current + movement.current) % (Math.PI * 2))
    d = ((d + Math.PI) % (Math.PI * 2)) - Math.PI
    target.current = phi.current + movement.current + d
    movement.current = 0
  }, [active, focus])

  // Editorial palette: light theme = muted-grey dotted earth on paper;
  // dark theme = pale dots on the dark sphere (springforth's dark=1 idiom).
  const land = useMemo(
    () => hexToRgb(cssVar('--color-muted', dark ? '#B8B0A4' : '#544F4A')),
    [themeTick], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const teal = useMemo(() => hexToRgb(cssVar('--color-teal', '#006F84')), [themeTick]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: canvas.offsetWidth * 2 || 600,
      height: canvas.offsetWidth * 2 || 600,
      phi: phi.current,
      theta: 0.25,
      dark: dark ? 1 : 0,
      diffuse: 1.4,
      mapSamples: 20000,
      mapBrightness: dark ? 5 : 3.2,
      baseColor: land,
      markerColor: teal,
      glowColor: dark ? [0.37, 0.71, 0.78] : [0.78, 0.9, 0.9],
      markers: MARKS.map((m) => ({
        location: [m.lat, m.lon],
        size: m.id === active ? 0.07 : m.fictional ? 0.03 : 0.045,
      })),
    })
    globeRef.current = globe
    let raf = 0
    const tick = () => {
      const w = canvas.offsetWidth
      // ease toward the target bearing, else slow auto-rotate
      if (target.current !== null && !reduced.current) {
        const d = target.current - phi.current
        phi.current += d * 0.06
        if (Math.abs(d) < 0.01) target.current = null
      } else if (!reduced.current && interacting.current === null) {
        phi.current += 0.0022
      }
      globe.update({
        phi: phi.current + movement.current,
        width: w * 2,
        height: w * 2,
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      globe.destroy()
      globeRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeTick])

  useEffect(() => {
    globeRef.current?.update({
      markers: MARKS.map((m) => ({
        location: [m.lat, m.lon],
        size: m.id === active ? 0.07 : m.fictional ? 0.03 : 0.045,
      })),
    })
  }, [active])

  function hitTest(e: React.MouseEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
    const w = r.width
    const px = e.clientX - r.left
    const py = e.clientY - r.top
    const theta = 0.25
    for (const m of MARKS) {
      const p = project(m.lat, m.lon, phi.current + movement.current, theta, w)
      if (!p.front) continue
      if (Math.hypot(p.x - px, p.y - py) < 14) {
        navigate(`/${m.id}`)
        return
      }
    }
  }

  const downPos = useRef<[number, number] | null>(null)
  return (
    <div>
      <div
        className="relative aspect-square w-full select-none"
        role="img"
        aria-label="Globe showing every place the engine has heard"
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => {
            interacting.current = e.clientX - movement.current * 1400
            downPos.current = [e.clientX, e.clientY]
          }}
          onPointerUp={(e) => {
            const moved = downPos.current
              ? Math.hypot(e.clientX - downPos.current[0], e.clientY - downPos.current[1])
              : 99
            interacting.current = null
            downPos.current = null
            if (moved < 6) hitTest(e)
          }}
          onPointerOut={() => (interacting.current = null)}
          onPointerMove={(e) => {
            if (interacting.current !== null)
              movement.current = (e.clientX - interacting.current) / 1400
          }}
        />
      </div>
      <p className="chapter-marker mt-2 text-muted">Where in the world — drag or click a marker</p>
      {legend && <ul className="mt-3 columns-2 gap-4">
        {MARKS.map((m) => (
          <li key={m.id}>
            <Link
              href={`/${m.id}`}
              aria-current={m.id === active ? 'true' : undefined}
              className={`inline-flex min-h-11 items-center text-xs underline-offset-2 motion-safe-only transition-colors hover:text-ink ${
                m.id === active ? 'font-medium text-teal underline' : 'text-muted'
              }`}
            >
              {m.label}
              {m.fictional ? ' · fictional' : ''}
            </Link>
          </li>
        ))}
      </ul>}
    </div>
  )
}
