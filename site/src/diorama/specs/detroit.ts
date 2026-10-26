import type { DioramaSpec } from '../types'

// Detroit — grid city: row houses with vacant dashed lots between them, a
// community garden, the factory block, downtown towers on the horizon.
export const detroit: DioramaSpec = {
  elements: [
    // downtown towers on the north edge
    { type: 'props', kind: 'tower', x: -30, z: -26 },
    { type: 'building', x: -20, z: -28, w: 8, d: 6, h: 10, wall: '#D8E2EC', roof: '#3A5A8A' },
    { type: 'building', x: -38, z: -22, w: 7, d: 6, h: 7, wall: '#C9B896', roof: '#5B4A3A' },
    // street grid
    ...[-24, -8, 8, 24].map((x) => ({
      type: 'box' as const, size: [2.5, 0.08, 60] as [number, number, number], color: '#9A8A74', pos: [x, 0.08, 0] as [number, number, number],
    })),
    ...[-16, 0, 16].map((z) => ({
      type: 'box' as const, size: [70, 0.08, 2.5] as [number, number, number], color: '#9A8A74', pos: [-2, 0.08, z] as [number, number, number],
    })),
    // row houses — solid homes alternating with dashed vacant lots
    { type: 'building', x: -18, z: -10, w: 6, d: 5, h: 3, wall: '#C9A27E', roof: '#7A4A3A', roofH: 1.8, who: '8c6ba261-47c0-4f73-8217-3e9920ca8810' },
    { type: 'dashed', x: -11, z: -10, w: 5.4, d: 4.6 },
    { type: 'building', x: -4, z: -10, w: 6, d: 5, h: 3, wall: '#B8A68A', roof: '#6E4A3A', roofH: 1.8 },
    { type: 'dashed', x: 3, z: -10, w: 5.4, d: 4.6 },
    { type: 'building', x: -18, z: 6, w: 6, d: 5, h: 3, wall: '#D8C6A0', roof: '#7A4A3A', roofH: 1.8 },
    { type: 'dashed', x: -11, z: 6, w: 5.4, d: 4.6 },
    { type: 'building', x: -4, z: 6, w: 6, d: 5, h: 3, wall: '#C9B896', roof: '#6E4A3A', roofH: 1.8, who: 'ff0e834a-a295-4553-9a06-8bf789037eb3' },
    { type: 'dashed', x: 3, z: 6, w: 5.4, d: 4.6 },
    // the community garden on a reclaimed lot
    { type: 'props', kind: 'garden', x: 14, z: -10, who: '5c300638-5b70-4d8d-b1bb-9e2a09cfee41' },
    { type: 'props', kind: 'garden', x: 20, z: -8, who: '5c300638-5b70-4d8d-b1bb-9e2a09cfee41' },
    // the factory block
    { type: 'building', x: 22, z: 10, w: 16, d: 7, h: 4.5, wall: '#8A8A8A', roof: '#544F4A', roofH: 1.2, who: 'fe8c38c7-15c1-4d5b-999e-b66c51b90c6f' },
    { type: 'props', kind: 'mast', x: 30, z: 10 },
    // transit stop — 'reliable transportation' means a car every day
    { type: 'shelter', x: 8, z: -2, who: '8c1ec2a2-ac50-45ad-a317-6d55c422ea74' },
    // neighborhood church
    { type: 'props', kind: 'chapel', x: -32, z: 8, who: '006f1ec2-1177-4034-96bc-00ee27e4e7c9' },
    // latino-owned businesses row (southwest — Mexicantown)
    ...[0, 1, 2].map((i) => ({
      type: 'building' as const, x: -30 + i * 9, z: 24, w: 7, d: 5, h: 3.2, wall: '#E4CEB0', roof: '#C4573A', roofH: 1.6, who: 'b2ae0c7a-8339-49bb-95bd-ceac0af564e5',
    })),
    { type: 'tree', points: [[-36, -6, 1], [-40, 4, 0.9], [36, -4, 1], [38, 18, 0.9], [10, 22, 1], [-6, 22, 0.9]] },
    { type: 'props', kind: 'bench', x: 12, z: 20 },
  ],
  cast: [
    { story: '8c6ba261-47c0-4f73-8217-3e9920ca8810', label: 'Resident', pos: [-16, 0, -6], top: '#006F84', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: 'ff0e834a-a295-4553-9a06-8bf789037eb3', label: 'Resident', pos: [-2, 0, 9], top: '#7C6A93', skin: 0x8d5524, hair: 0x1b1b1b, style: 2, ry: 0.8 },
    { story: '5c300638-5b70-4d8d-b1bb-9e2a09cfee41', label: 'Gardener', pos: [16, 0, -7], top: '#006425', skin: 0x8d5524, hair: 0x2a2a2a, tool: true, ry: 0.9 },
    { story: '6fe1d721-c094-4fd5-a696-0a9c763da116', label: 'Resident', pos: [-6, 0, -4], top: '#FD6925', skin: 0xc68642, hair: 0x1b1b1b, style: 0, ry: 0.8 },
    { story: 'b2ae0c7a-8339-49bb-95bd-ceac0af564e5', label: 'Shop owner', pos: [-26, 0, 20], top: '#A21942', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.8 },
    { story: 'fe8c38c7-15c1-4d5b-999e-b66c51b90c6f', label: 'Metro Times', pos: [20, 0, 15], top: '#544F4A', skin: 0xffdbb4, hair: 0xd9c28c, ry: 0.6 },
    { story: '05ad3008-2acf-4e2f-a438-bcf6557b9ab3', label: 'Resident', pos: [10, 0, -4], top: '#26BDE2', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: '8c1ec2a2-ac50-45ad-a317-6d55c422ea74', label: 'Metro Times', pos: [18, 0, 16], top: '#544F4A', skin: 0xe0ac82, hair: 0x3b2a1e, ry: 0.6 },
    { story: 'cbbb1fc5-2560-4901-8e98-5dd3e630ff1c', label: 'Narrator', pos: [24, 0, 14], top: '#6E4B00', skin: 0xf1c9a5, hair: 0x6b4423, ry: 0.7 },
    { story: '006f1ec2-1177-4034-96bc-00ee27e4e7c9', label: 'Resident', pos: [-30, 0, 12], top: '#4C7A4C', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.9 },
    { story: '2930fb0a-bfb9-4314-b92c-accb8d377a9a', label: 'Metro Times', pos: [22, 0, 17], top: '#544F4A', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.6 },
    { story: '4ca2967e-4e8a-4f25-8615-9d0c60439d3b', label: 'Narrator', pos: [26, 0, 12], top: '#3F5E8D', skin: 0xe0ac82, hair: 0x2a2a2a, ry: 0.7 },
    { story: 'b4eebf9e-8bef-4e42-b1ca-2f9a8f162ab6', label: 'Resident', pos: [8, 0, 2], top: '#12525F', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: '53bb36d9-f466-4556-ac7a-344a71d08bd2', label: 'Resident', pos: [-20, 0, 0], top: '#DDA63A', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.8 },
  ],
}
