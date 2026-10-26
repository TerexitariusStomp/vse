import type { DioramaSpec } from '../types'

// Dar es Salaam — the channel to the east with the Kigamboni ferry, dense city
// blocks, and the planting sites at Mji Mwema and Kunduchi: solid green for
// app-verified records, dashed outlines for pending ones.
export const darEsSalaam: DioramaSpec = {
  elements: [
    // the sea / channel east
    { type: 'water', w: 26, d: 70, pos: [32, 0.05, 0], opacity: 0.9 },
    // the Kigamboni ferry
    { type: 'props', kind: 'boat', x: 28, z: 6, rot: 1.57, who: '74849959-d62d-42d4-8b93-451ae9834194' },
    { type: 'props', kind: 'boat', x: 30, z: -12, rot: 1.2 },
    // beach strip
    { type: 'box', size: [6, 0.1, 60], color: '#E4D6B0', pos: [18, 0.08, 0] },
    // city blocks (west, denser)
    ...[0, 1, 2, 3].map((i) => ({
      type: 'building' as const, x: -34 + i * 10, z: -22, w: 8, d: 6, h: 4.5 + (i % 2) * 2, wall: '#D8CBB4', roof: '#5B4A3A', roofH: 1.4,
    })),
    ...[0, 1, 2].map((i) => ({
      type: 'building' as const, x: -30 + i * 11, z: -12, w: 9, d: 6, h: 5.5 + (i % 2) * 2.5, wall: '#C9B896', roof: '#5B4A3A', roofH: 1.4,
    })),
    { type: 'props', kind: 'tower', x: -36, z: -28 },
    // market
    ...[0, 1, 2, 3].map((i) => ({
      type: 'props' as const, kind: 'stall' as const, x: -8 + i * 6, z: -4 + (i % 2) * 3, rot: (i % 2) * 0.3,
    })),
    // Mji Mwema planting site (south) — verified rows + pending dashed plots
    { type: 'fields', x: -14, z: 20, strips: 4, who: '5b630737-49a8-44bb-889f-532594512f2e' },
    { type: 'props', kind: 'garden', x: 2, z: 22, who: 'cff1c7b9-e2ff-4471-af58-60b7fd112a7e' },
    { type: 'props', kind: 'garden', x: 8, z: 20, who: '2aa68cb3-b40f-4f30-9797-91848b44a673' },
    { type: 'dashed', x: -6, z: 24, w: 5, d: 4 },
    { type: 'dashed', x: 14, z: 24, w: 5, d: 4 },
    { type: 'dashed', x: -22, z: 26, w: 5, d: 4 },
    // Kunduchi site (north) — more pending than verified
    { type: 'props', kind: 'garden', x: -10, z: 12, who: '94431699-00e3-434b-bd00-6cf10458849e' },
    { type: 'dashed', x: -4, z: 14, w: 5, d: 4 },
    { type: 'dashed', x: 4, z: 12, w: 5, d: 4 },
    // palms along the front
    { type: 'tree', points: [[14, 18, 1.2], [16, 8, 1], [15, -4, 1.1], [16, -16, 1], [14, 26, 1.2], [-26, 8, 0.9], [-34, 2, 1], [-40, 10, 0.9]] },
    // lightning / fintech mast (the parallel rails)
    { type: 'props', kind: 'mast', x: 10, z: -14, who: '9f33cee8-e7b9-49a6-abf9-5f5843745f94' },
    // drainage channel
    { type: 'stream', points: [[-36, 0.2, 4], [-24, 0.2, 6], [-12, 0.2, 8], [2, 0.2, 10], [16, 0.2, 12]] },
  ],
  cast: [
    { story: '5b630737-49a8-44bb-889f-532594512f2e', label: 'Field record', pos: [-16, 0, 22], top: '#006425', skin: 0x8d5524, hair: 0x1b1b1b, tool: true, ry: 0.8 },
    { story: 'cff1c7b9-e2ff-4471-af58-60b7fd112a7e', label: 'Field record', pos: [-12, 0, 24], top: '#4C7A4C', skin: 0x8d5524, hair: 0x1b1b1b, tool: true, ry: 0.9 },
    { story: '2aa68cb3-b40f-4f30-9797-91848b44a673', label: 'Field record', pos: [-8, 0, 22], top: '#006425', skin: 0xc68642, hair: 0x2a2a2a, ry: 0.8 },
    { story: '690c11a8-7d37-4e2f-bdb7-c48969d4dcbe', label: 'Field record', pos: [-4, 0, 24], top: '#4C7A4C', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.7 },
    { story: '7e0accc7-d218-4b58-b9ef-f0be4787a1ff', label: 'Field record', pos: [0, 0, 22], top: '#006F84', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: 'c699fbcb-15e1-4b17-9b7f-81edc0a1f0ca', label: 'Field record', pos: [-20, 0, 24], top: '#4C7A4C', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.8 },
    { story: 'ac7686b7-c273-4cba-a484-b0d5780d4c23', label: 'Field record', pos: [-24, 0, 22], top: '#006425', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: 'f459a3c3-768a-4599-93be-9e73234c3f08', label: 'Field record', pos: [-28, 0, 24], top: '#4C7A4C', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.8 },
    { story: 'c4a9e72b-4ea2-4a8d-af62-7a52c71683a2', label: 'Field record', pos: [4, 0, 24], top: '#006425', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.7 },
    { story: 'aed47ad7-76df-478d-8c87-b7396c74053c', label: 'Field record', pos: [8, 0, 22], top: '#4C7A4C', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.8 },
    { story: 'fccbc5b5-3f84-422b-bc94-47730eb3acdc', label: 'Field record', pos: [-32, 0, 22], top: '#006425', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.9 },
    { story: '95b0612f-5bc0-48e5-8672-f38687c237bc', label: 'Field record', pos: [-10, 0, 26], top: '#4C7A4C', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.8 },
    { story: 'f764e1ea-b978-4f23-9f34-e2a283b2eec1', label: 'Field record', pos: [-2, 0, 26], top: '#006425', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.7 },
    { story: 'e83a176a-37fc-4101-84cb-666fb1728f38', label: 'Field record', pos: [6, 0, 26], top: '#4C7A4C', skin: 0xc68642, hair: 0x2a2a2a, ry: 0.8 },
    { story: '9028a14d-cc3b-4f65-ac44-7c72da1f294f', label: 'Field record', pos: [-18, 0, 26], top: '#006425', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: '05347d2f-8d72-4d72-ad0e-e60b156f7c66', label: 'Field record', pos: [-26, 0, 26], top: '#4C7A4C', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.8 },
    { story: 'b528f37e-166b-4f1d-961b-ca02cb246b1f', label: 'Field record', pos: [10, 0, 26], top: '#006425', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.7 },
    { story: '751f84c1-4ab4-4d66-8975-4f6b702c6a09', label: 'Field record', pos: [-14, 0, 28], top: '#4C7A4C', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.8 },
    { story: '94431699-00e3-434b-bd00-6cf10458849e', label: 'Field team', pos: [-8, 0, 10], top: '#00689D', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: '74307b6f-5d0e-434d-b50b-c55fbdba7bab', label: 'Field record', pos: [-6, 0, 28], top: '#4C7A4C', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.8 },
    { story: 'd0524b01-7b60-42ce-85ef-892460f4f3bc', label: 'Field record', pos: [2, 0, 28], top: '#006425', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.9 },
    { story: '729efad3-046f-42e6-a337-81be2f4cb4e1', label: 'Field team', pos: [-4, 0, 12], top: '#3F5E8D', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.7 },
    { story: '42d19e2c-8761-44b2-903c-a59d31c25535', label: 'Field team', pos: [0, 0, 14], top: '#12525F', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.8 },
    { story: '33661543-8383-4cce-9ec6-f243f887e3bb', label: 'Field team', pos: [-12, 0, 14], top: '#00689D', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: '67b599b1-a1ad-4e39-9f80-d73e5d6c9ed5', label: 'Field team', pos: [8, 0, 14], top: '#4C7A4C', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.8 },
    { story: 'c6bf9e7b-f3fe-4e1a-b317-6542206f53b5', label: 'Field team', pos: [-16, 0, 12], top: '#00689D', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.7 },
    { story: '9f33cee8-e7b9-49a6-abf9-5f5843745f94', label: 'Lightning community', pos: [8, 0, -12], top: '#FCC30B', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.6 },
    { story: '382d3fa6-4916-451e-a35d-2d0a0942d0a5', label: 'nostr relay', pos: [12, 0, -8], top: '#544F4A', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.5 },
    { story: 'bb540d75-306d-4af9-acbc-a998dd4de369', label: 'Fintech builder', pos: [12, 0, -16], top: '#006F84', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.7 },
    { story: '936977bc-8435-4c6a-9b93-0c4377c8cbd5', label: 'Lightning community', pos: [10, 0, -10], top: '#DDA63A', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.8 },
    { story: '33e18b5c-b24d-4388-bcce-d0adade6b660', label: 'Lightning community', pos: [14, 0, -12], top: '#6E4B00', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.6 },
    { story: '74849959-d62d-42d4-8b93-451ae9834194', label: 'Reuters', pos: [26, 0, 8], top: '#902824', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.5 },
    { story: 'a4aea8fc-767e-41e2-abd0-0f298ddbeff9', label: 'bsky voice', pos: [-6, 0, -2], top: '#26BDE2', skin: 0x8d5524, hair: 0x1b1b1b, style: 1, ry: 0.9 },
    { story: 'f67dfaad-9c23-4888-8807-00f349dd4c05', label: 'Reuters', pos: [24, 0, 10], top: '#902824', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.5 },
  ],
}
