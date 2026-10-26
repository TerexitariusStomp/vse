import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { Results } from '../lib'
import { buildCast, buildElement, palette, type PersonParts } from './build'
import type { DioramaSpec } from './types'
import { StoryCard } from './StoryCard'

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

interface SceneContent {
  nodes: { id: string | null; obj: THREE.Object3D }[]
  cast: { id: string; parts: PersonParts; i: number }[]
  plate: THREE.Object3D
}

function useScene(spec: DioramaSpec, themeTick: number, P: ReturnType<typeof palette>) {
  return useMemo<SceneContent>(() => {
    const nodes: SceneContent['nodes'] = []
    const plate = new THREE.Group()
    const groundMat = new THREE.MeshLambertMaterial({ color: P.chrome, flatShading: true })
    const topMat = new THREE.MeshLambertMaterial({ color: P.surface, flatShading: true })
    const base = new THREE.Mesh(new THREE.BoxGeometry(86, 3, 66), groundMat)
    base.position.set(0, -1.5, 0)
    plate.add(base)
    const top = new THREE.Mesh(new THREE.BoxGeometry(84, 0.5, 64), topMat)
    top.position.set(0, -0.25, 0)
    plate.add(top)

    for (const el of spec.elements) {
      const obj = buildElement(el, P)
      if (!obj) continue
      const who = 'who' in el ? el.who : undefined
      if (who) obj.traverse((o) => (o.userData.who = who))
      nodes.push({ id: who ?? null, obj })
    }

    const cast = spec.cast.map((c, i) => {
      const parts = buildCast(c, P, P.teal)
      parts.root.traverse((o) => (o.userData.who = c.story))
      const hit = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 7, 8),
        new THREE.MeshBasicMaterial({ visible: false }),
      )
      hit.position.y = 3.5
      hit.userData.who = c.story
      parts.root.add(hit)
      nodes.push({ id: c.story, obj: parts.root })
      return { id: c.story, parts, i }
    })

    return { nodes, cast, plate }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, themeTick])
}

function Animating({
  cast,
  hover,
}: {
  cast: SceneContent['cast']
  hover: string | null
}) {
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    for (const { parts: p, i } of cast) {
      p.body.position.y = Math.sin(t * 2 + i) * 0.04
      const w = Math.sin(t * 3 + i * 1.3) * 0.25
      p.arms[1]!.sh.rotation.z = -2.35 + w
      p.arms[1]!.el.rotation.z = -0.3 + w * 0.6
      p.arms[0]!.sh.rotation.z = 0.12 + Math.sin(t * 1.6 + i) * 0.05
      const hv = hover === cast[i]!.id
      const mat = p.ring.material as THREE.MeshBasicMaterial
      mat.opacity = hv ? 1 : 0.55 + Math.sin(t * 3 + i) * 0.25
      p.ring.scale.setScalar(hv ? 1.15 : 1 + Math.sin(t * 3 + i) * 0.06)
    }
  })
  return null
}

export function Diorama({ spec, results }: { spec: DioramaSpec; results: Results }) {
  const [openStory, setOpenStory] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [themeTick, setThemeTick] = useState(0)
  const [webgl] = useState(hasWebGL)
  const reduced = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )
  const P = useMemo(() => palette(), [themeTick]) // eslint-disable-line react-hooks/exhaustive-deps
  const scene = useScene(spec, themeTick, P)

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.cursor = hover ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hover])

  const labelByStory = useMemo(
    () => new Map(spec.cast.map((c) => [c.story, c.label])),
    [spec],
  )

  if (!webgl)
    return (
      <p className="text-sm text-muted">
        This browser can't show the 3D diorama — the stories below carry the same
        content.
      </p>
    )

  const handlers = (id: string | null) =>
    id
      ? {
          onClick: (e: { delta: number; stopPropagation: () => void }) => {
            if (e.delta < 6) {
              e.stopPropagation()
              setOpenStory(id)
            }
          },
          onPointerOver: (e: { stopPropagation: () => void }) => {
            e.stopPropagation()
            setHover(id)
          },
          onPointerOut: () => setHover((h) => (h === id ? null : h)),
        }
      : {}

  return (
    <div>
      <div className="rule-b relative aspect-[16/9] w-full overflow-hidden bg-paper">
        <Canvas
          key={themeTick}
          camera={{ position: [58, 60, 84], fov: 28, near: 1, far: 700 }}
          onCreated={({ scene: s }) => {
            s.background = new THREE.Color(P.paper)
            s.fog = new THREE.Fog(P.paper, 190, 330)
          }}
        >
          <hemisphereLight args={['#fff6e8', '#7a8a9a', 1.1]} />
          <directionalLight position={[-30, 50, 25]} intensity={1.25} color="#fff2dd" />
          <primitive object={scene.plate} />
          {scene.nodes.map(({ id, obj }, i) => (
            <primitive key={i} object={obj} {...handlers(id)} />
          ))}
          {spec.cast.map(
            (c) =>
              hover === c.story && (
                <Html
                  key={c.story}
                  position={[c.pos[0], c.pos[1] + 5.6, c.pos[2]]}
                  center
                  distanceFactor={90}
                  zIndexRange={[5, 0]}
                >
                  <div className="diorama-bub hot">{c.label}</div>
                </Html>
              ),
          )}
          <OrbitControls
            makeDefault
            target={[2, 0, 5]}
            enableDamping
            dampingFactor={0.08}
            minDistance={28}
            maxDistance={190}
            maxPolarAngle={1.38}
            minPolarAngle={0.35}
            autoRotate={!reduced.current && !openStory}
            autoRotateSpeed={0.6}
            screenSpacePanning={false}
            onStart={() => setHover(null)}
          />
          {!reduced.current && <Animating cast={scene.cast} hover={hover} />}
        </Canvas>
      </div>
      <p className="chapter-marker mt-3 text-muted">
        The place — drag to look around, click a figure to hear their story
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Storytellers">
        {spec.cast.map((c) => (
          <button
            key={c.story}
            onClick={() => setOpenStory(c.story)}
            className="rounded-[3px] border border-line px-2.5 py-1.5 text-xs text-muted motion-safe-only transition-colors hover:border-teal hover:text-ink"
          >
            {c.label}
          </button>
        ))}
      </div>
      <StoryCard
        storyId={openStory}
        label={openStory ? (labelByStory.get(openStory) ?? null) : null}
        results={results}
        audio={openStory ? spec.cast.find((c) => c.story === openStory)?.audio : undefined}
        onClose={() => setOpenStory(null)}
      />
    </div>
  )
}
