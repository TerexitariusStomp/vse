import type { DioramaSpec } from '../types'

// Nairobi — two economies in one scene: the CBD towers and matatu stage on one
// side, the dense Kibera rooftops and market on the other, the drainage cut
// where the water fails.
export const nairobi: DioramaSpec = {
  elements: [
    // CBD towers (north)
    { type: 'props', kind: 'tower', x: -28, z: -22, who: '0303d11f-533e-47c9-9d4e-65cc841dc877' },
    { type: 'building', x: -18, z: -24, w: 8, d: 6, h: 9, wall: '#D8E2EC', roof: '#3A5A8A' },
    { type: 'building', x: -8, z: -26, w: 7, d: 6, h: 7, wall: '#C9B896', roof: '#5B4A3A' },
    { type: 'building', x: -36, z: -18, w: 7, d: 6, h: 6, wall: '#D8CBB4', roof: '#5B4A3A' },
    // matatu stage
    { type: 'shelter', x: -8, z: -12, who: '0303d11f-533e-47c9-9d4e-65cc841dc877' },
    ...[0, 1, 2].map((i) => ({
      type: 'box' as const, size: [4.5, 1.8, 1.8] as [number, number, number],
      color: ['#DDA63A', '#26BDE2', '#4C7A4C'][i]!,
      pos: [-4 + i * 5.5, 1, -14.5] as [number, number, number], who: '0303d11f-533e-47c9-9d4e-65cc841dc877',
    })),
    // market stalls mid-plate
    ...[0, 1, 2, 3].map((i) => ({
      type: 'props' as const, kind: 'stall' as const, x: -12 + i * 7, z: 0 + (i % 2) * 4, rot: (i % 2) * 0.4, who: '422bc2ff-2e05-4fce-810b-9a8219f67505',
    })),
    // Kibera rooftops — dense small blocks (south-west)
    ...[0, 1, 2, 3, 4].map((i) => ({
      type: 'building' as const, x: -30 + i * 5, z: 14 + (i % 2) * 5, w: 4.2, d: 4, h: 2, wall: '#B8A68A', roof: '#8A5A2B', roofH: 1, who: '0958ff94-ebed-4762-b5a1-e5affaafca6c',
    })),
    ...[0, 1, 2, 3].map((i) => ({
      type: 'building' as const, x: -28 + i * 5.5, z: 24, w: 4.5, d: 4, h: 2.2, wall: '#C9B896', roof: '#8A5A2B', roofH: 1, who: '0958ff94-ebed-4762-b5a1-e5affaafca6c',
    })),
    // Machakos Bitcoin Academy / women-devs hall
    { type: 'building', x: 16, z: 16, w: 9, d: 6, h: 4, wall: '#E4F0EA', roof: '#FCC30B', roofH: 1.8, who: '0958ff94-ebed-4762-b5a1-e5affaafca6c' },
    { type: 'props', kind: 'mast', x: 22, z: 16, who: '0958ff94-ebed-4762-b5a1-e5affaafca6c' },
    // the drainage cut — where the water should run
    { type: 'stream', points: [[-36, 0.2, 4], [-20, 0.2, 6], [-4, 0.2, 8], [12, 0.2, 6], [30, 0.2, 8]], who: 'e5c8dc57-c579-4ef8-8fef-ec9e4ba3bf55' },
    { type: 'dashed', x: 30, z: -8, w: 5, d: 4 },
    { type: 'pond', x: 30, z: 22, r: 1.6 },
    { type: 'tree', points: [[-40, 0, 0.9], [34, 0, 1], [38, 20, 0.9], [-38, -8, 1]] },
  ],
  cast: [
    { story: '0303d11f-533e-47c9-9d4e-65cc841dc877', label: 'CBD voice', pos: [-10, 0, -10], top: '#FD6925', skin: 0x8d5524, hair: 0x1b1b1b, style: 0, ry: 0.8 },
    { story: '422bc2ff-2e05-4fce-810b-9a8219f67505', label: 'Market voice', pos: [-10, 0, 3], top: '#FCC30B', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.7 },
    { story: '0958ff94-ebed-4762-b5a1-e5affaafca6c', label: 'Bitcoin Academy', pos: [14, 0, 20], top: '#FCC30B', skin: 0x8d5524, hair: 0x1b1b1b, style: 1, ry: 0.8 },
    { story: '4755ca55-d81f-44e0-b336-1bf474f7cd49', label: 'Kanairo voice', pos: [-6, 0, -6], top: '#26BDE2', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.9 },
    { story: 'e5c8dc57-c579-4ef8-8fef-ec9e4ba3bf55', label: 'Water cut', pos: [0, 0, 9], top: '#006F84', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: '75ee95ff-0ffb-4d6e-b780-83a551cdc151', label: 'Bitcoin Academy', pos: [18, 0, 20], top: '#DDA63A', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.8 },
    { story: '99d8abe6-a931-4d68-8e96-12684be0e1c7', label: 'Bitcoin Academy', pos: [16, 0, 23], top: '#4C7A4C', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.7 },
    { story: 'dc0996d8-8ff9-48dd-877e-7ffdb7b0b710', label: 'Bitcoin Academy', pos: [20, 0, 18], top: '#6E4B00', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.9 },
    { story: '489ba01a-cc15-4c7b-8ea1-66c33e0117ed', label: 'Kanairo voice', pos: [-14, 0, -8], top: '#A21942', skin: 0x8d5524, hair: 0x1b1b1b, style: 0, ry: 0.8 },
    { story: 'c4d58a85-ea52-49e6-804e-084c3f6f86e0', label: 'bsky voice', pos: [-2, 0, -8], top: '#3F5E8D', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.7 },
    { story: '5a6efc28-f0c8-454d-a3d6-025cb74405e8', label: 'Kibera voice', pos: [-24, 0, 18], top: '#006425', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: '608fdd32-0e33-46a4-a2cb-9307e9e78623', label: 'Kanairo voice', pos: [-16, 0, -4], top: '#7C6A93', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.8 },
    { story: '7586b2c5-92ee-484e-8aaa-9503b4274cf6', label: 'CBD voice', pos: [-24, 0, -16], top: '#00689D', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.6 },
    { story: '923cfcd4-a99b-43f8-8390-cc3b30d3002c', label: 'Kibera voice', pos: [-22, 0, 22], top: '#12525F', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: 'defdb65f-4ddb-4be0-aac0-89c202c00244', label: 'Kibera voice', pos: [-27, 0, 20], top: '#4AA3D6', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.8 },
    { story: '98ed7d7d-8203-46a1-a61c-fc0f0cc94471', label: 'Kibera voice', pos: [-20, 0, 26], top: '#DDA63A', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.7 },
    { story: '5a63d4d4-774c-4b39-9a82-e816ffff697b', label: 'Kibera voice', pos: [-31, 0, 24], top: '#902824', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.8 },
    { story: '17af7c17-3684-46e1-a45b-142ec640a1bf', label: 'Kibera voice', pos: [-25, 0, 26], top: '#006F84', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.9 },
    { story: 'd246aa31-3fe4-42cf-954a-4e1d4fde80d5', label: 'Kibera voice', pos: [-28, 0, 16], top: '#544F4A', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.8 },
  ],
}
