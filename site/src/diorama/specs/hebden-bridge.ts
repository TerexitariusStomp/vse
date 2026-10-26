import type { DioramaSpec } from '../types'

// Hebden Bridge — a steep Pennine valley: wooded hillsides, the river through
// town with the old bridge, mills and terraced rows, the canal, flood markers.
export const hebdenBridge: DioramaSpec = {
  elements: [
    // steep wooded valley sides
    { type: 'tier', x: -30, z: -24, w: 34, h: 8, d: 20 },
    { type: 'tier', x: 8, z: -28, w: 36, h: 6, d: 18 },
    { type: 'tier', x: -36, z: 18, w: 26, h: 7, d: 22 },
    { type: 'tier', x: 16, z: 26, w: 30, h: 5, d: 16 },
    { type: 'hills', items: [[-40, -34, 16, 10], [-8, -36, 18, 9], [30, -34, 14, 8]] },
    { type: 'tree', points: [[-36, -22, 1], [-28, -26, 0.9], [-22, -20, 1.1], [2, -30, 1], [12, -30, 0.9], [-40, 14, 1], [-32, 22, 0.9], [-38, 26, 1], [10, 30, 1], [22, 28, 0.9]] },
    // the river through town
    { type: 'water-ribbon', points: [[-40, -2], [-24, 2], [-8, 4], [6, 6], [20, 8], [36, 10]], width: 3, who: 'd603f497-4851-4540-9f88-b4dd5c7d8598' },
    // the old bridge
    { type: 'props', kind: 'bridge', x: -2, z: 5, rot: 1.57, who: 'd603f497-4851-4540-9f88-b4dd5c7d8598' },
    // mills along the river
    { type: 'building', x: -16, z: -4, w: 12, d: 5, h: 5, wall: '#B8A68A', roof: '#5B4A3A', roofH: 1.6, who: 'cded0a86-5cd6-4616-b1b2-01d5cd07d037' },
    { type: 'building', x: 12, z: 0, w: 10, d: 5, h: 4.4, wall: '#C9B896', roof: '#5B4A3A', roofH: 1.6 },
    // terraced rows climbing the north side
    ...[0, 1, 2].map((i) => ({
      type: 'building' as const, x: -8 + i * 9, z: -12 - (i % 2) * 5, w: 8, d: 4, h: 2.8, wall: '#C9A27E', roof: '#6E4A3A', roofH: 1.4,
    })),
    // canal strip
    { type: 'box', size: [30, 0.12, 3], color: '#0E5468', pos: [16, 0.1, 16] },
    { type: 'box', size: [30, 0.12, 1.2], color: '#9A8A74', pos: [16, 0.14, 13.6] },
    // flood marker wall + sandbags by the river
    { type: 'wall', x: -6, z: 8, len: 10, rot: 1.57, who: 'a7ab5a65-d23a-4511-9728-5bc24bf51006' },
    { type: 'props', kind: 'sandbags', x: -8, z: 9, who: 'd603f497-4851-4540-9f88-b4dd5c7d8598' },
    // mutual-aid depot + council liaison office
    { type: 'building', x: 20, z: -6, w: 8, d: 5, h: 3.6, wall: '#E4CEB0', roof: '#12525F', who: '9068d092-89b6-400f-9841-0633ca2f7ca9' },
    { type: 'building', x: 30, z: -10, w: 7, d: 5, h: 3.4, wall: '#D8E2EC', roof: '#3A5A8A', who: '171ea3d2-d306-4d84-bf61-a9a483e63c7b' },
    // market square + shelter
    { type: 'props', kind: 'stall', x: 2, z: 14, who: '9068d092-89b6-400f-9841-0633ca2f7ca9' },
    { type: 'props', kind: 'bench', x: 6, z: 14, rot: 0.5 },
    { type: 'dashed', x: -18, z: 14, w: 5, d: 4 },
  ],
  cast: [
    { story: 'd603f497-4851-4540-9f88-b4dd5c7d8598', label: 'Mutual aid', pos: [-10, 0, 10], top: '#FCC30B', skin: 0xf1c9a5, hair: 0x6b4423, hat: '#FCC30B', ry: 0.9 },
    { story: '4e7563d3-c7a6-44e6-a8a5-3cb519fb4480', label: 'Mutual aid', pos: [-7, 0, 12], top: '#FCC30B', skin: 0xe0ac82, hair: 0x1b1b1b, hat: '#FCC30B', ry: 0.8 },
    { story: 'cded0a86-5cd6-4616-b1b2-01d5cd07d037', label: 'Mutual aid', pos: [-13, 0, 12], top: '#006F84', skin: 0xffdbb4, hair: 0xd9c28c, ry: 1 },
    { story: '87b51984-155c-420a-a856-466737230532', label: 'Mutual aid', pos: [-16, 0, 8], top: '#006425', skin: 0xc68642, hair: 0x2a2a2a, ry: 0.9 },
    { story: 'a7ab5a65-d23a-4511-9728-5bc24bf51006', label: 'Mutual aid', pos: [-4, 0, 10], top: '#A21942', skin: 0xf1c9a5, hair: 0x3b2a1e, ry: 0.8 },
    { story: 'cd63560a-b449-455f-b9c4-fd4de89d183c', label: 'Mutual aid', pos: [-19, 0, 10], top: '#7C6A93', skin: 0xe0ac82, hair: 0xe0e0e0, style: 2, ry: 0.9 },
    { story: 'e83ebf0c-f195-45f5-bcee-63dc2c4c2c85', label: 'Mutual aid', pos: [-22, 0, 8], top: '#FD6925', skin: 0xc68642, hair: 0x1b1b1b, style: 0, ry: 0.7 },
    { story: '5c7e7b54-ce7c-4922-8665-8d93644157cf', label: 'Priya', pos: [18, 0, -4], top: '#12525F', skin: 0x8d5524, hair: 0x1b1b1b, style: 1, ry: 0.8 },
    { story: '171ea3d2-d306-4d84-bf61-a9a483e63c7b', label: 'Council liaison', pos: [28, 0, -6], top: '#00689D', skin: 0xe0ac82, hair: 0x3b2a1e, style: 3, ry: 0.8 },
    { story: '9068d092-89b6-400f-9841-0633ca2f7ca9', label: 'Mutual Aid North', pos: [22, 0, -4], top: '#006F84', skin: 0xf1c9a5, hair: 0x6b4423, ry: 0.9 },
    { story: '10fe0975-c765-47ef-885a-75f92b2670e8', label: 'Mutual Aid North', pos: [24, 0, -8], top: '#4C7A4C', skin: 0xffdbb4, hair: 0xd9c28c, ry: 0.7 },
    { story: '07da6f91-13ee-4c00-88d3-51d1b0913fa2', label: 'Mutual Aid North', pos: [26, 0, -4], top: '#DDA63A', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.9 },
  ],
}
