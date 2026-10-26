import type { DioramaSpec } from '../types'

// Minneapolis — a residential grid under the surge: house rows, the capitol
// dome where the quilt was revealed, the river bend, community watch points.
export const minneapolis: DioramaSpec = {
  elements: [
    // the Mississippi bend along the east
    { type: 'water-ribbon', points: [[30, -40], [34, -24], [30, -8], [34, 8], [30, 24], [34, 40]], width: 6 },
    // street grid (flat roads)
    ...[-30, -14, 2, 18].map((x) => ({
      type: 'box' as const, size: [2.5, 0.08, 60] as [number, number, number], color: '#9A8A74', pos: [x, 0.08, 0] as [number, number, number],
    })),
    ...[-20, -4, 12, 28].map((z) => ({
      type: 'box' as const, size: [70, 0.08, 2.5] as [number, number, number], color: '#9A8A74', pos: [-6, 0.08, z] as [number, number, number],
    })),
    // house rows
    ...[0, 1, 2, 3].map((i) => ({
      type: 'building' as const, x: -34 + i * 8, z: -14, w: 6, d: 5, h: 2.8, wall: '#E4CEB0', roof: '#7A4A3A', roofH: 1.8,
    })),
    ...[0, 1, 2, 3].map((i) => ({
      type: 'building' as const, x: -34 + i * 8, z: 4, w: 6, d: 5, h: 2.8, wall: '#D8C6A0', roof: '#6E4A3A', roofH: 1.8,
    })),
    ...[0, 1, 2].map((i) => ({
      type: 'building' as const, x: -6 + i * 8, z: -14, w: 6, d: 5, h: 2.8, wall: '#C9B896', roof: '#7A4A3A', roofH: 1.8,
    })),
    // the capitol dome — where the Stolen Neighbors Quilt was revealed
    { type: 'props', kind: 'dome', x: 8, z: -24, who: 'd4ab6e84-2586-4869-b2d9-edbae20a1909' },
    { type: 'props', kind: 'flag', x: 12, z: -24, y: 6 },
    // church / community hall (mutual aid)
    { type: 'props', kind: 'chapel', x: -18, z: 20, who: 'bd6c9ff1-4187-49f1-9dc2-00ef9de7841a' },
    // the quilt on the capitol lawn — a patchwork field
    ...[0, 1, 2, 3, 4, 5].map((i) => ({
      type: 'box' as const, size: [1.6, 0.1, 1.6] as [number, number, number],
      color: ['#A21942', '#006F84', '#DDA63A', '#4C7A4C', '#7C6A93', '#902824'][i]!,
      pos: [4 + (i % 3) * 1.8, 0.1, -18 + Math.floor(i / 3) * 1.8] as [number, number, number], who: 'd4ab6e84-2586-4869-b2d9-edbae20a1909',
    })),
    // downtown towers north edge
    { type: 'props', kind: 'tower', x: -30, z: -28 },
    { type: 'building', x: -20, z: -30, w: 7, d: 6, h: 9, wall: '#D8E2EC', roof: '#3A5A8A' },
    // snow-dusted trees + park
    { type: 'tree', points: [[-28, 16, 1], [-24, 22, 0.9], [-8, 22, 1], [2, 20, 0.9], [16, 16, 1], [22, 22, 0.9]] },
    { type: 'pond', x: -6, z: 26, r: 2 },
    { type: 'shelter', x: 12, z: 8, who: 'f8e31548-be98-493e-bbec-c51c5572ffe4' },
    { type: 'dashed', x: 20, z: -12, w: 5, d: 4 },
  ],
  cast: [
    { story: 'd4ab6e84-2586-4869-b2d9-edbae20a1909', label: 'Quilt maker', pos: [4, 0, -15], top: '#A21942', skin: 0xf1c9a5, hair: 0x6b4423, style: 2, ry: 0.7 },
    { story: 'd6bddde3-1886-4db6-8cbe-c3961e22523b', label: 'Neighbor', pos: [-10, 0, 8], top: '#006F84', skin: 0xe0ac82, hair: 0x1b1b1b, ry: 0.9 },
    { story: 'bd6c9ff1-4187-49f1-9dc2-00ef9de7841a', label: 'Mutual aid', pos: [-16, 0, 22], top: '#006425', skin: 0xc68642, hair: 0x2a2a2a, ry: 0.8 },
    { story: 'fd7e28e2-8b41-48fc-b79c-44e7c464669f', label: 'Reporter', pos: [10, 0, -20], top: '#544F4A', skin: 0xffdbb4, hair: 0xd9c28c, ry: 0.6 },
    { story: 'f8e31548-be98-493e-bbec-c51c5572ffe4', label: 'Resident', pos: [12, 0, 11], top: '#FD6925', skin: 0xc68642, hair: 0x1b1b1b, style: 0, ry: 0.8 },
    { story: '540cf8e4-2359-45c4-86ba-1e7fcd36b027', label: 'Neighbor', pos: [-12, 0, 6], top: '#7C6A93', skin: 0xe0ac82, hair: 0xe0e0e0, style: 2, ry: 0.9 },
    { story: '1c6f69bd-1cbe-49a4-a6ea-5f4c6f4a3d9f', label: 'Neighbor', pos: [-14, 0, 12], top: '#26BDE2', skin: 0xf1c9a5, hair: 0x3b2a1e, ry: 0.8 },
    { story: '6bd6426c-4008-4697-98a0-5080352e4c7b', label: 'Organiser', pos: [-20, 0, 18], top: '#00689D', skin: 0xe0ac82, hair: 0x1b1b1b, ry: 0.7 },
    { story: '73c105d0-184a-4796-8e46-74f6a8afdc72', label: 'Neighbor', pos: [-16, 0, 8], top: '#4C7A4C', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: '4d95f735-7773-4249-8ffc-c67fc31d07f2', label: 'Neighbor', pos: [-18, 0, 4], top: '#DDA63A', skin: 0xffdbb4, hair: 0x6b4423, ry: 0.8 },
    { story: 'd464009a-f8f9-411e-ad6d-ce90f4904526', label: 'Neighbor', pos: [-22, 0, 10], top: '#12525F', skin: 0xc68642, hair: 0x2a2a2a, ry: 0.9 },
    { story: '533c2231-9a7b-4205-a24c-05c3cb0ae08d', label: 'Neighbor', pos: [-8, 0, 4], top: '#6E4B00', skin: 0xf1c9a5, hair: 0x1b1b1b, ry: 0.8 },
    { story: '18418844-2579-4d20-9618-d52e39d5aa6a', label: 'Neighbor', pos: [-24, 0, 8], top: '#3F5E8D', skin: 0xe0ac82, hair: 0x3b2a1e, ry: 0.7 },
    { story: '43e434cd-4164-44c2-bf19-195cd47ac186', label: 'Neighbor', pos: [-26, 0, 12], top: '#A21942', skin: 0xffdbb4, hair: 0xd9c28c, style: 2, ry: 0.8 },
    { story: 'f53e8c64-9a2e-49c9-ad1e-ed55091fef19', label: 'Neighbor', pos: [-28, 0, 6], top: '#006F84', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.9 },
    { story: 'a7ab46d6-0065-4800-a656-058d23b01f8c', label: 'Rep. Tabke', pos: [8, 0, -16], top: '#00689D', skin: 0xe0ac82, hair: 0x3b2a1e, style: 3, ry: 0.6 },
    { story: 'a353d986-449f-4d5f-86b6-dd1001bbdddf', label: 'Neighbor', pos: [-30, 0, 10], top: '#FCC30B', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.8 },
    { story: '9f914fc9-3474-4d05-9c6e-7521c3cd1720', label: 'Neighbor', pos: [-32, 0, 14], top: '#4AA3D6', skin: 0xf1c9a5, hair: 0x6b4423, ry: 0.9 },
  ],
}
