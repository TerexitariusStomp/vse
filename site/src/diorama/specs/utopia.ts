import type { DioramaSpec } from '../types'

// 1:1 port of the Utopia Valley artifact scene. Stories s1–s8 map to the
// artifact's ROLES in the same order; each carries the extracted voice mp3.
export const utopia: DioramaSpec = {
  elements: [
    { type: 'hills', items: [[-30, -31, 16, 14], [-12, -33, 18, 11], [8, -32, 14, 9], [28, -33, 18, 12], [40, -28, 12, 8], [-42, -20, 14, 12]] },
    // hill terraces
    { type: 'tier', x: -24, z: -20, w: 34, h: 6, d: 24 },
    { type: 'tier', x: -31, z: -25, w: 18, h: 6, d: 13, y: 6 },
    { type: 'pond', x: -33, z: -26, r: 4.6, pos: [-33, 12.35, -26], who: 's1' },
    { type: 'box', size: [1.2, 0.15, 0.8], color: '#101820', pos: [-30, 12.3, -23] },
    { type: 'box', size: [1.2, 0.15, 0.8], color: '#101820', pos: [-27, 12.3, -26] },
    { type: 'box', size: [1.2, 0.15, 0.8], color: '#101820', pos: [-36, 12.3, -22] },
    // terrace furrows
    ...[0, 1, 2, 3, 4].map((i) => ({
      type: 'box' as const,
      size: [11, 0.12, 0.5] as [number, number, number],
      color: '#5F7A52',
      pos: [-18, 6.3, -27 + i * 2.8] as [number, number, number],
    })),
    // stream down from the bog
    { type: 'stream', points: [[-30, 12.3, -22], [-28, 9, -19], [-24, 6.3, -14], [-18, 6.3, -12], [-12, 0.3, -10], [-8, 0.2, -9]], who: 's1' },
    // farm + barn + sheep on the terrace
    { type: 'building', x: -24, z: -14, y: 6.2, w: 6, d: 4.6, h: 3.4, wall: '#F2D9B8', roof: '#C4573A', who: 's1' },
    { type: 'building', x: -16, z: -18, y: 6.2, w: 5, d: 4, h: 3, wall: '#8A3B12', roof: '#5A2A12', roofH: 2, who: 's1' },
    ...([[-14, -8], [-11, -12], [-18, -6], [-22, -8], [-10, -17], [-14, -22]] as [number, number][]).map(
      ([x, z], i) => ({ type: 'props' as const, kind: 'sheep' as const, x, z, y: 6.3, rot: i, who: 's1' }),
    ),
    // the river
    { type: 'water-ribbon', points: [[-8, -9], [-2, -4], [2, 4], [4, 12], [8, 20], [11, 28], [12.5, 34]], who: 's4' },
    // village: school + hall, chapel, homes site
    { type: 'building', x: -14, z: 14, w: 10, d: 7, h: 4.2, wall: '#F2D9B8', roof: '#C4873A', who: 's2' },
    { type: 'building', x: -14, z: 23, w: 7, d: 5, h: 3, wall: '#D8C6A0', roof: '#8A3B12', roofH: 2, who: 's2' },
    { type: 'props', kind: 'chapel', x: -24, z: 14, who: 's5' },
    { type: 'dashed', x: -33, z: 20, w: 3.6, d: 3.2 },
    { type: 'dashed', x: -28.5, z: 20.5, w: 3.6, d: 3.2 },
    { type: 'shelter', x: 14, z: -8, who: 's3' },
    // lower town: flood wall, sandbags, pump
    { type: 'wall', x: 14.6, z: 23, len: 17, who: 's4' },
    { type: 'props', kind: 'sandbags', x: 12.3, z: 15, who: 's4' },
    { type: 'props', kind: 'pump', x: 11.5, z: 20, who: 's4' },
    // town: council, gp, cafe, homes
    { type: 'building', x: 24, z: 12, w: 9, d: 6, h: 5, wall: '#D8E2EC', roof: '#7A3B5A', roofH: 2.6, who: 's8' },
    { type: 'props', kind: 'flag', x: 27, z: 12, y: 9, who: 's8' },
    { type: 'building', x: 38, z: 8, w: 6, d: 5, h: 3.6, wall: '#F2D9D9', roof: '#8A3B12' },
    { type: 'building', x: 31, z: 6, w: 5, d: 5, h: 3.2, wall: '#E4DAC8', roof: '#3A5A8A' },
    { type: 'building', x: 22, z: 30, w: 5, d: 5, h: 3.4, wall: '#F2D9B8', roof: '#4C7A4C' },
    { type: 'building', x: 36, z: 15, w: 6.4, d: 5, h: 3.8, wall: '#E4F0EA', roof: '#4C7A4C', who: 's7' },
    { type: 'props', kind: 'cross', x: 36, z: 17.56, y: 2.7, who: 's7' },
    { type: 'dashed', x: 36, z: 26, w: 5, d: 4 },
    { type: 'props', kind: 'cafe', x: 28, z: 22, who: 's6' },
    // Pentre fields: wet from the wall
    { type: 'fields', x: -1, z: 24, strips: 6, wet: true },
    // trees
    { type: 'tree', points: [[-38, 4, 1], [-36, 10, 0.9], [-8, 2, 1.1], [-4, 10, 1], [6, -14, 0.9], [20, -14, 1.2], [34, -6, 1], [40, 2, 0.9], [40, 22, 1.1], [40, 30, 1], [-38, 28, 0.9], [-22, 30, 1], [16, 36, 1.2], [-6, -14, 1], [-20, -4, 0.8], [26, -18, 1.1], [6, 30, 1]] },
    // pupils beside the head teacher
    { type: 'extra-person', x: -7.2, z: 19.6, top: '#4AA3D6', scale: 1.1, style: 0, skin: 0xe0ac82, hair: 0x1b1b1b, who: 's2' },
    { type: 'extra-person', x: -4.6, z: 19.8, top: '#E07A8A', scale: 1.1, style: 1, skin: 0xc68642, hair: 0x3b2a1e, who: 's2' },
  ],
  cast: [
    { story: 's1', label: 'Hill farmer', pos: [-14, 6.3, -13], top: '#DDA63A', skin: 0xe0ac82, hair: 0xb5651d, bottom: '#5B3A29', tool: true, hat: '#6B5A43', ry: 0.9, audio: 'audio/utopia/s1.mp3' },
    { story: 's2', label: 'Head teacher', pos: [-6, 0, 18], top: '#A21942', skin: 0xf1c9a5, hair: 0x6b4423, style: 2, ry: 1.1, audio: 'audio/utopia/s2.mp3' },
    { story: 's3', label: 'Young person', pos: [14, 0, -3], top: '#FD6925', skin: 0xc68642, hair: 0x1b1b1b, style: 0, ry: 0.7, audio: 'audio/utopia/s3.mp3' },
    { story: 's4', label: 'Flood group', pos: [11.8, 0, 17], top: '#FCC30B', skin: 0xa9744f, hair: 0x2a2a2a, hat: '#FCC30B', bottom: '#3A3A44', ry: 0.9, audio: 'audio/utopia/s4.mp3' },
    { story: 's5', label: 'Elder', pos: [-19.5, 0, 19], top: '#7C6A93', skin: 0xffdbb4, hair: 0xe0e0e0, style: 2, ry: 0.8, audio: 'audio/utopia/s5.mp3' },
    { story: 's6', label: 'Café organiser', pos: [28, 0, 27], top: '#56C02B', skin: 0x8d5524, hair: 0x1b1b1b, style: 1, ry: 0.4, audio: 'audio/utopia/s6.mp3' },
    { story: 's7', label: 'Social prescriber', pos: [36, 0, 21], top: '#26BDE2', skin: 0xf1c9a5, hair: 0xd9c28c, style: 1, ry: 0.6, audio: 'audio/utopia/s7.mp3' },
    { story: 's8', label: 'Councillor', pos: [22, 0, 18], top: '#00689D', skin: 0xe0ac82, hair: 0x3b2a1e, style: 3, bottom: '#1F2D3D', ry: 0.8, audio: 'audio/utopia/s8.mp3' },
  ],
}
