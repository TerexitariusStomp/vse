// DioramaSpec — authored scene data per place (same role as tools/places/*.spec.json).
// Presentation-only: never enters the engine artifact or results schema.

export type Vec3 = [number, number, number]

export interface CastMember {
  story: string // story id in the results artifact, e.g. 's1'
  label: string // short teller label for the projected bubble
  pos: Vec3
  top?: string
  bottom?: string
  skin?: number
  hair?: number
  style?: 0 | 1 | 2 | 3
  hat?: string
  tool?: boolean
  ry?: number
  scale?: number
  audio?: string // e.g. 'audio/utopia/s1.mp3' — utopia only
}

export type PropKind =
  | 'shelter'
  | 'chapel'
  | 'cafe'
  | 'sheep'
  | 'pump'
  | 'sandbags'
  | 'flag'
  | 'dome'
  | 'boat'
  | 'stall'
  | 'garden'
  | 'tower'
  | 'bench'
  | 'mast'
  | 'bridge'
  | 'cross'

export type Element =
  | { type: 'box'; size: Vec3; color: string; pos: Vec3; who?: string }
  | { type: 'tier'; x: number; z: number; w: number; h: number; d: number; y?: number; who?: string }
  | {
      type: 'building'
      x: number
      z: number
      y?: number
      w: number
      d: number
      h: number
      wall: string
      roof: string
      who?: string
      roofH?: number
    }
  | { type: 'hills'; items: [x: number, z: number, s: number, h: number][] }
  | { type: 'water-ribbon'; points: [x: number, z: number][]; width?: number; who?: string }
  | { type: 'stream'; points: Vec3[]; who?: string }
  | { type: 'water'; w: number; d: number; pos: Vec3; opacity?: number; who?: string }
  | { type: 'pond'; x: number; z: number; r: number; pos?: Vec3; who?: string }
  | { type: 'wall'; x: number; z: number; len: number; rot?: number; who?: string }
  | { type: 'tree'; points: [x: number, z: number, s?: number][]; who?: string }
  | { type: 'shelter'; x: number; z: number; y?: number; rot?: number; who?: string }
  | { type: 'dashed'; x: number; z: number; w: number; d: number; y?: number; who?: string }
  | { type: 'fields'; x: number; z: number; strips: number; wet?: boolean; y?: number; who?: string }
  | { type: 'props'; kind: PropKind; x: number; z: number; y?: number; rot?: number; who?: string }
  | {
      type: 'extra-person'
      x: number
      z: number
      y?: number
      top: string
      scale?: number
      style?: 0 | 1 | 2 | 3
      skin?: number
      hair?: number
      who?: string
    }

export interface DioramaSpec {
  elements: Element[]
  cast: CastMember[]
}
