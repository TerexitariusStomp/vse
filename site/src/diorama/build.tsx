// spec → three.js objects. Builder idiom ported from the Utopia Valley
// artifact (box primitives + pyramid roofs + articulated figures), kept
// as thin factories rendered via R3F <primitive>.

import * as THREE from 'three'
import type { CastMember, Element } from './types'

export interface Palette {
  paper: string
  surface: string
  chrome: string
  ink: string
  line: string
  teal: string
  tealDeep: string
  sage: string
  warn: string
  coral: string
  accent: string
  // scene illustration tones (muted editorial set on paper)
  ground: string
  groundTop: string
  hill: string
  trunk: string
  leaf: string
  water: string
  waterDeep: string
  roofTerracotta: string
  roofInk: string
  wallA: string
  wallB: string
  wallC: string
  timber: string
  window: string
  shadow: string
}

export function palette(): Palette {
  const css = (n: string, fb: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb
  const dark = document.documentElement.classList.contains('dark')
  return {
    paper: css('--color-paper', '#FAF2EA'),
    surface: css('--color-surface', '#FFFCF9'),
    chrome: css('--color-chrome', '#EADFD6'),
    ink: css('--color-ink', '#0D0B08'),
    line: css('--color-line', '#C4B8AE'),
    teal: css('--color-teal', '#006F84'),
    tealDeep: css('--color-teal-deep', '#12525F'),
    sage: css('--color-sage', '#006425'),
    warn: css('--color-warn', '#6E4B00'),
    coral: css('--color-coral', '#902824'),
    accent: css('--color-accent', '#3F5E8D'),
    ground: dark ? '#3A4A38' : '#9DB18A',
    groundTop: dark ? '#4A5C46' : '#B7C99F',
    hill: dark ? '#33402F' : '#8AA377',
    trunk: dark ? '#4A3826' : '#7A5A38',
    leaf: dark ? '#2F4534' : '#6E9B6B',
    water: css('--color-teal', '#006F84'),
    waterDeep: dark ? '#0E3A44' : '#0E5468',
    roofTerracotta: dark ? '#6E4034' : '#C4573A',
    roofInk: dark ? '#3A3428' : '#5B4A3A',
    wallA: dark ? '#8A7C68' : '#F2D9B8',
    wallB: dark ? '#7C7060' : '#E4CEB0',
    wallC: dark ? '#6C6258' : '#D8CBB4',
    timber: dark ? '#5A4226' : '#8A5A2B',
    window: dark ? '#2A2118' : '#3A3428',
    shadow: dark ? '#0D0B08' : '#544F4A',
  }
}

/* primitives — artifact idiom */

const _mats = new Map<string, THREE.MeshLambertMaterial>()
export function M(color: string | number, o: THREE.MeshLambertMaterialParameters = {}) {
  const k = String(color) + JSON.stringify(o)
  let m = _mats.get(k)
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true, ...o })
    _mats.set(k, m)
  }
  return m
}
const MB = (color: string | number, o: THREE.MeshBasicMaterialParameters = {}) =>
  new THREE.MeshBasicMaterial({ color, ...o })
export const box = (
  w: number,
  h: number,
  d: number,
  m: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
) => {
  const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
  g.position.set(x, y, z)
  return g
}
const PYR = () => new THREE.ConeGeometry(0.7071, 1, 4).rotateY(Math.PI / 4)
const pivot = (p: THREE.Group, x: number, y: number, z: number) => {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  p.add(g)
  return g
}

/* shared builders */

export function building(
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  wall: string,
  roof: string,
  roofH = 2.3,
  y = 0,
) {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  g.add(box(w, h, d, M(wall), 0, h / 2, 0))
  const r = new THREE.Mesh(PYR(), M(roof))
  r.scale.set(w * 1.18, roofH, d * 1.18)
  r.position.y = h + roofH / 2
  g.add(r)
  g.add(box(1.1, 1.9, 0.12, MB('#2A2118'), 0, 0.95, d / 2 + 0.03))
  g.add(box(1, 1, 0.12, MB('#2A2118'), w / 2 - 1.1, h * 0.6, d / 2 + 0.03))
  g.add(box(1, 1, 0.12, MB('#2A2118'), -w / 2 + 1.1, h * 0.6, d / 2 + 0.03))
  g.add(box(0.7, 1.6, 0.7, M(roof), w * 0.25, h + 1.6, -d * 0.2))
  return g
}

export function tree(x: number, z: number, s: number, P: Palette) {
  const t = new THREE.Group()
  t.position.set(x, 0, z)
  t.add(box(0.5 * s, 1.8 * s, 0.5 * s, M(P.trunk), 0, 0.9 * s, 0))
  const cones: [number, number, number][] = [
    [2.4, 2.6, 1.3],
    [1.8, 4.2, 2.2],
  ]
  for (const [r, y, h] of cones) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(r * s, h * s * 1.4, 6), M(P.leaf))
    c.position.y = y * s
    t.add(c)
  }
  return t
}

export function waterRibbon(points: [number, number][], width: number, P: Palette) {
  const path = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  ).getPoints(70)
  const pos: number[] = []
  const idx: number[] = []
  path.forEach((p, i) => {
    const a = path[Math.max(0, i - 1)]!
    const b = path[Math.min(path.length - 1, i + 1)]!
    let tx = b.x - a.x
    let tz = b.z - a.z
    const L = Math.hypot(tx, tz)
    tx /= L
    tz /= L
    pos.push(p.x - tz * width, 0.12, p.z + tx * width, p.x + tz * width, 0.12, p.z - tx * width)
    if (i) {
      const k = (i - 1) * 2
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2)
    }
  })
  const g = new THREE.Group()
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  g.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: P.water, side: THREE.DoubleSide })))
  const geo2 = geo.clone()
  const deep = new THREE.Mesh(geo2, new THREE.MeshLambertMaterial({ color: P.waterDeep, side: THREE.DoubleSide }))
  deep.position.y = -0.06
  g.add(deep)
  return g
}

export function dashedBox(x: number, z: number, w: number, d: number, P: Palette) {
  const g = new THREE.Group()
  const c = M(P.line)
  for (const b of [-d / 2, d / 2]) g.add(box(w, 0.12, 0.15, c, x, 0.1, z + b))
  for (const a of [-w / 2, w / 2]) g.add(box(0.15, 0.12, d, c, x + a, 0.1, z))
  return g
}

function shelter(x: number, z: number, rot: number, P: Palette) {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = rot
  const frame = M(P.shadow)
  for (const [a, b] of [
    [-2, -0.8],
    [2, -0.8],
    [-2, 0.8],
    [2, 0.8],
  ] as const)
    g.add(box(0.18, 2.6, 0.18, frame, a, 1.3, b))
  g.add(box(4.8, 0.2, 2.2, M(P.teal), 0, 2.7, 0))
  g.add(box(3.4, 0.3, 0.7, M(P.timber), 0, 0.8, -0.6))
  g.add(box(4.6, 0.12, 0.12, frame, 0, 2.4, 0.8))
  return g
}

function chapel(x: number, z: number, P: Palette) {
  const c = new THREE.Group()
  c.position.set(x, 0, z)
  c.add(box(4.4, 3, 6.4, M(P.wallC), 0, 1.5, 0))
  const r = new THREE.Mesh(PYR(), M(P.accent))
  r.scale.set(5.2, 2.4, 7.4)
  r.position.y = 4.2
  c.add(r)
  c.add(box(2, 6, 2, M(P.wallC), 0, 3, -3.8))
  const r2 = new THREE.Mesh(PYR(), M(P.accent))
  r2.scale.set(2.6, 2.4, 2.6)
  r2.position.set(0, 7.2, -3.8)
  c.add(r2)
  c.add(box(1, 1.8, 0.12, MB('#2A2118'), 0, 0.9, 3.25))
  return c
}

function cafe(x: number, z: number, P: Palette) {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  const wall = M(P.warn)
  g.add(box(8.4, 0.3, 6.4, M(P.wallA), 0, 0.12, 0))
  g.add(box(8.4, 3.8, 0.3, wall, 0, 1.9, -3.1))
  g.add(box(0.3, 3.8, 6.4, wall, -4.1, 1.9, 0))
  g.add(box(0.3, 1, 6.4, wall, 4.1, 0.5, 0))
  g.add(box(5.2, 1.1, 1, M(P.timber), 0.8, 0.7, -0.3))
  g.add(box(0.8, 0.5, 0.6, M(P.shadow), 1.8, 1.5, -0.3))
  for (let k = 0; k < 7; k++) {
    const a = box(1.2, 0.16, 1.5, M(k % 2 ? P.surface : P.coral), -3.6 + k * 1.2, 3.55, 3.9)
    a.rotation.x = 0.22
    g.add(a)
  }
  for (let k = 0; k < 6; k++)
    g.add(box(0.35, 0.4, 0.35, M([P.surface, P.coral, P.teal][k % 3]!), -2.6 + k * 1.05, 2.7, -2.7))
  for (const [a, b] of [
    [-3, 2.2],
    [3, 2.6],
  ] as const) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 10), M(P.wallA))
    t.position.set(a, 1, b)
    g.add(t)
    g.add(box(0.14, 1, 0.14, M(P.timber), a, 0.5, b))
  }
  return g
}

function sheep(P: Palette) {
  const s = new THREE.Group()
  s.add(box(1.5, 1, 0.9, M(P.surface), 0, 0.7, 0))
  s.add(box(0.5, 0.5, 0.5, M(P.ink), 0.9, 0.9, 0))
  for (const [a, b] of [
    [-0.5, -0.3],
    [0.5, -0.3],
    [-0.5, 0.3],
    [0.5, 0.3],
  ] as const)
    s.add(box(0.18, 0.4, 0.18, M(P.ink), a, 0.2, b))
  return s
}

const SKINS = [0xf1c9a5, 0xe0ac82, 0xc68642, 0x8d5524, 0xffdbb4, 0xa9744f]
const HAIRS = [0x1b1b1b, 0x3b2a1e, 0x6b4423, 0xb5651d, 0xd9c28c, 0xe0e0e0]

export interface PersonOpts {
  scale?: number
  skin?: number
  top?: string
  bottom?: string
  hair?: number
  style?: 0 | 1 | 2 | 3
  hat?: string
  tool?: boolean
}

export interface PersonParts {
  root: THREE.Group
  body: THREE.Group
  arms: { sh: THREE.Group; el: THREE.Group; side: number }[]
  ring: THREE.Mesh
  sc: number
}

export function person(o: PersonOpts, P: Palette, ringColor?: string | number): PersonParts {
  const sc = o.scale ?? 2.3
  const skin = M(o.skin ?? SKINS[0]!)
  const top = M(o.top ?? P.accent)
  const bot = M(o.bottom ?? '#2c3e55')
  const dark = M('#202428')
  const hm = M(o.hair ?? HAIRS[0]!)
  const root = new THREE.Group()
  const body = new THREE.Group()
  body.scale.setScalar(sc)
  root.add(body)
  const hips = pivot(body, 0, 0.98, 0)
  hips.add(box(0.4, 0.22, 0.24, bot))
  const torso = pivot(hips, 0, 0.1, 0)
  torso.add(box(0.44, 0.56, 0.26, top, 0, 0.28, 0))
  const neck = pivot(torso, 0, 0.58, 0)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), skin)
  head.position.y = 0.16
  neck.add(head)
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.162, 10, 8, 0, Math.PI * 2, 0, Math.PI * (o.style === 3 ? 0.62 : 0.5)),
    hm,
  )
  cap.position.y = 0.17
  cap.rotation.x = -0.15
  neck.add(cap)
  if (o.style === 1) neck.add(box(0.26, 0.3, 0.08, hm, 0, 0, -0.1))
  if (o.style === 2) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 7, 6), hm)
    b.position.set(0, 0.34, -0.08)
    neck.add(b)
  }
  if (o.hat) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 10), M(o.hat))
    h.position.y = 0.3
    neck.add(h)
    const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.14, 10), M(o.hat))
    c2.position.y = 0.37
    neck.add(c2)
  }
  const arms: PersonParts['arms'] = []
  for (const side of [1, -1]) {
    const hip = pivot(hips, side * 0.11, -0.08, 0)
    hip.add(box(0.15, 0.46, 0.16, bot, 0, -0.23, 0))
    const kn = pivot(hip, 0, -0.46, 0)
    kn.add(box(0.13, 0.44, 0.14, bot, 0, -0.22, 0))
    kn.add(box(0.14, 0.07, 0.25, dark, 0, -0.46, 0.05))
    const sh = pivot(torso, side * 0.29, 0.5, 0)
    sh.add(box(0.11, 0.3, 0.12, top, 0, -0.15, 0))
    const el = pivot(sh, 0, -0.3, 0)
    el.add(box(0.1, 0.28, 0.11, skin, 0, -0.14, 0))
    arms.push({ sh, el, side })
  }
  if (o.tool) {
    const t = box(0.04, 1.1, 0.04, M('#8a5a2b'), 0, -0.3, 0.08)
    arms[1]!.el.add(t)
  }
  const sd = new THREE.Mesh(
    new THREE.CircleGeometry(0.4 * sc, 12),
    new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.22 }),
  )
  sd.rotation.x = -Math.PI / 2
  sd.position.y = 0.04
  root.add(sd)
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.55 * sc, 0.85 * sc, 24),
    new THREE.MeshBasicMaterial({
      color: ringColor ?? 0x006f84,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.08
  root.add(ring)
  return { root, body, arms, ring, sc }
}

/* props */

function prop(kind: string, x: number, z: number, y: number, rot: number, P: Palette): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  g.rotation.y = rot
  switch (kind) {
    case 'shelter':
      return shelterAt(g, P)
    case 'chapel': {
      const c = chapel(0, 0, P)
      g.add(c)
      break
    }
    case 'cafe': {
      g.add(cafe(0, 0, P))
      break
    }
    case 'sheep':
      g.add(sheep(P))
      break
    case 'pump':
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.6, 8), M(P.warn)))
      g.children[0]!.position.y = 0.8
      break
    case 'sandbags':
      for (let k = 0; k < 4; k++)
        g.add(box(2, 0.6, 1, M(P.timber), 0, 0.3 + (k % 2) * 0.6, k * 1.2))
      break
    case 'flag': {
      g.add(box(0.12, 5, 0.12, M(P.line), 0, 2.5, 0))
      g.add(box(2, 1.2, 0.1, M(P.coral), 1, 4.6, 0))
      break
    }
    case 'dome': {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 2.2, 12), M(P.wallC))
      drum.position.y = 4.6
      g.add(drum)
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(P.accent))
      dome.position.y = 5.7
      g.add(dome)
      g.add(box(4.6, 3.6, 4.6, M(P.wallB), 0, 1.8, 0))
      break
    }
    case 'boat': {
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 4.6, 4), M(P.timber))
      hull.rotation.z = Math.PI / 2
      hull.rotation.y = Math.PI / 4
      hull.position.y = 0.5
      g.add(hull)
      g.add(box(0.1, 3, 0.1, M(P.timber), 0, 2.2, 0))
      const sail = new THREE.Mesh(new THREE.BufferGeometry(), M(P.surface))
      const v = new Float32Array([0, 0, 0, 0, 2.6, 0, 1.8, 0.4, 0])
      sail.geometry.setAttribute('position', new THREE.BufferAttribute(v, 3))
      sail.geometry.setIndex([0, 1, 2])
      sail.geometry.computeVertexNormals()
      sail.material = new THREE.MeshLambertMaterial({ color: P.surface, side: THREE.DoubleSide })
      sail.position.y = 1.4
      g.add(sail)
      break
    }
    case 'stall': {
      const frame = M(P.timber)
      for (const [a, b] of [
        [-1.4, -1],
        [1.4, -1],
        [-1.4, 1],
        [1.4, 1],
      ] as const)
        g.add(box(0.14, 2.2, 0.14, frame, a, 1.1, b))
      g.add(box(3.4, 0.15, 2.6, M(P.coral), 0, 2.3, 0))
      g.add(box(3, 0.7, 2, M(P.wallB), 0, 0.7, 0))
      break
    }
    case 'garden': {
      g.add(box(5, 0.15, 4, M(P.ground), 0, 0.05, 0))
      for (let k = 0; k < 4; k++) g.add(box(4.4, 0.25, 0.5, M(P.leaf), 0, 0.25, -1.5 + k))
      break
    }
    case 'tower': {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, 9, 10), M(P.wallB))
      t.position.y = 4.5
      g.add(t)
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 1.4, 10), M(P.accent))
      top.position.y = 9.7
      g.add(top)
      break
    }
    case 'bench':
      g.add(box(2.6, 0.15, 0.7, M(P.timber), 0, 0.55, 0))
      for (const a of [-1, 1]) g.add(box(0.15, 0.55, 0.7, M(P.shadow), a, 0.27, 0))
      break
    case 'mast':
      g.add(box(0.15, 7, 0.15, M(P.shadow), 0, 3.5, 0))
      for (let k = 0; k < 3; k++) g.add(box(1.6 - k * 0.4, 0.1, 0.1, M(P.shadow), 0, 5.5 + k * 0.5, 0))
      break
    case 'cross':
      g.add(box(0.9, 2.6, 0.14, M(P.sage), 0, 0, 0))
      g.add(box(2.6, 0.9, 0.14, M(P.sage), 0, 0, 0))
      break
    case 'bridge': {
      for (const a of [-2.4, 2.4]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.6, 8), M(P.wallC))
        p.position.set(a, 0.8, 0)
        g.add(p)
      }
      const arc = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.28, 8, 16, Math.PI), M(P.wallC))
      arc.rotation.z = 0
      arc.position.y = 1.1
      g.add(arc)
      break
    }
  }
  return g
}

function shelterAt(g: THREE.Group, P: Palette) {
  g.add(shelter(0, 0, 0, P))
  return g
}

/* spec interpreter */

export function buildElement(el: Element, P: Palette): THREE.Object3D | null {
  switch (el.type) {
    case 'box': {
      const [w, h, d] = el.size
      const [x, y, z] = el.pos
      return box(w, h, d, M(el.color), x, y, z)
    }
    case 'tier': {
      const y = el.y ?? 0
      const g = new THREE.Group()
      g.add(box(el.w, el.h, el.d, M(P.hill), el.x, y + el.h / 2, el.z))
      g.add(box(el.w + 0.4, 0.3, el.d + 0.4, M(P.groundTop), el.x, y + el.h + 0.1, el.z))
      return g
    }
    case 'building':
      return building(el.x, el.z, el.w, el.d, el.h, el.wall, el.roof, el.roofH, el.y ?? 0)
    case 'hills': {
      const g = new THREE.Group()
      for (const [x, z, s, h] of el.items) {
        const m = new THREE.Mesh(PYR(), M(P.hill))
        m.scale.set(s * 1.5, h, s * 1.2)
        m.position.set(x, h / 2, z)
        g.add(m)
      }
      return g
    }
    case 'water-ribbon':
      return waterRibbon(el.points, el.width ?? 2.8, P)
    case 'stream': {
      const g = new THREE.Group()
      for (let i = 1; i < el.points.length; i++) {
        const p = el.points[i - 1]!
        const [x, y, z] = el.points[i]!
        const dx = x - p[0]
        const dz = z - p[2]
        const L = Math.hypot(dx, dz)
        const s = box(L, 0.2, 1.2, M(P.water), (x + p[0]) / 2, (y + p[1]) / 2 + 0.1, (z + p[2]) / 2)
        s.rotation.y = -Math.atan2(dz, dx)
        g.add(s)
      }
      return g
    }
    case 'water':
      return new THREE.Mesh(
        new THREE.BoxGeometry(el.w, 0.2, el.d),
        new THREE.MeshLambertMaterial({ color: P.water, transparent: true, opacity: el.opacity ?? 0.85 }),
      ).translateX(el.pos[0]).translateY(el.pos[1]).translateZ(el.pos[2])
    case 'pond': {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(el.r, el.r, 0.2, 12), M(P.water))
      const [x, y, z] = el.pos ?? [el.x, 0.12, el.z]
      p.position.set(x, y, z)
      return p
    }
    case 'wall': {
      const w = box(1.3, 3.4, el.len, M(P.line), el.x, 1.7, el.z)
      w.rotation.y = el.rot ?? 0
      return w
    }
    case 'tree': {
      const g = new THREE.Group()
      for (const [x, z, s] of el.points) g.add(tree(x, z, s ?? 1, P))
      return g
    }
    case 'shelter': {
      const s = shelter(el.x, el.z, el.rot ?? 0, P)
      s.position.y = el.y ?? 0
      return s
    }
    case 'dashed':
      return dashedBox(el.x, el.z, el.w, el.d, P).translateY(el.y ?? 0)
    case 'fields': {
      const y = el.y ?? 0
      const g = new THREE.Group()
      for (let i = 0; i < el.strips; i++)
        g.add(box(13, 0.15, 1.6, M(i % 2 ? P.ground : P.groundTop), el.x, y + 0.12, el.z + i * 1.7))
      if (el.wet) {
        const wt = new THREE.Mesh(
          new THREE.BoxGeometry(14, 0.2, el.strips * 1.7 + 1),
          new THREE.MeshLambertMaterial({ color: P.water, transparent: true, opacity: 0.35 }),
        )
        wt.position.set(el.x, y + 0.3, el.z + ((el.strips - 1) * 1.7) / 2)
        g.add(wt)
      }
      return g
    }
    case 'props':
      return prop(el.kind, el.x, el.z, el.y ?? 0, el.rot ?? 0, P)
    case 'extra-person': {
      const p = person(
        {
          top: el.top,
          scale: el.scale ?? 1.1,
          style: el.style,
          skin: el.skin ?? SKINS[1],
          hair: el.hair ?? HAIRS[0],
        },
        P,
      )
      p.ring.visible = false
      p.root.position.set(el.x, el.y ?? 0, el.z)
      return p.root
    }
  }
}

export function buildCast(c: CastMember, P: Palette, ringColor?: string) {
  const p = person(
    {
      scale: c.scale ?? 2.3,
      skin: c.skin ?? SKINS[0],
      top: c.top ?? P.accent,
      bottom: c.bottom ?? '#2c3e55',
      hair: c.hair ?? HAIRS[0],
      style: c.style,
      hat: c.hat,
      tool: c.tool,
    },
    P,
    ringColor,
  )
  p.root.position.set(...c.pos)
  p.root.rotation.y = c.ry ?? 0
  return p
}
