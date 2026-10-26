import type { DioramaSpec } from '../types'

// Puerto la Cruz — the Caribbean waterfront: malecón promenade and ferry pier,
// Cerro El Morro rising behind, apartment blocks, market, the plaza.
export const puertoLaCruz: DioramaSpec = {
  elements: [
    // the sea north, Cerro El Morro behind town
    { type: 'water', w: 90, d: 20, pos: [0, 0.05, -34], opacity: 0.9 },
    { type: 'hills', items: [[-34, 30, 20, 14], [10, 32, 24, 17], [36, 30, 16, 11]] },
    // malecón promenade
    { type: 'box', size: [76, 0.2, 4], color: '#D8C6A0', pos: [0, 0.1, -20], who: '8cebca52-b981-4739-980c-c7bc3ea43116' },
    { type: 'props', kind: 'bench', x: -10, z: -19, who: '8cebca52-b981-4739-980c-c7bc3ea43116' },
    { type: 'props', kind: 'bench', x: 6, z: -19, rot: 0.4 },
    { type: 'tree', points: [[-30, -17, 1.2], [-18, -17, 1], [-6, -17, 1.2], [6, -17, 1], [18, -17, 1.2], [30, -17, 1]] },
    // ferry pier
    { type: 'box', size: [4, 0.4, 10], color: '#8A5A2B', pos: [20, 0.3, -26], who: '539dd7ac-5178-4be0-9c3c-bb6e1d348405' },
    { type: 'props', kind: 'boat', x: 22, z: -30, rot: 0.2, who: '539dd7ac-5178-4be0-9c3c-bb6e1d348405' },
    // apartment blocks along the front
    ...[0, 1, 2, 3].map((i) => ({
      type: 'building' as const, x: -30 + i * 16, z: -8, w: 10, d: 7, h: 7 + (i % 2) * 3, wall: '#F2D9B8', roof: '#C4573A', roofH: 1.2,
    })),
    // market stalls behind the front
    ...[0, 1, 2].map((i) => ({
      type: 'props' as const, kind: 'stall' as const, x: -20 + i * 9, z: 6, rot: (i % 2) * 0.3,
    })),
    // the plaza
    { type: 'pond', x: 12, z: 10, r: 2.4 },
    { type: 'props', kind: 'bench', x: 12, z: 14 },
    { type: 'props', kind: 'bench', x: 12, z: 6, rot: 3.14 },
    { type: 'tree', points: [[8, 10, 1.1], [16, 10, 1.1], [12, 16, 0.9]] },
    // theatre / community hall
    { type: 'building', x: 26, z: 14, w: 9, d: 6, h: 4.2, wall: '#E4DAC8', roof: '#7A3B5A', roofH: 2.2, who: '0993a98a-010a-43ef-8744-802422e148f0' },
    // barrio streets climbing the hill
    ...[0, 1, 2].map((i) => ({
      type: 'building' as const, x: -26 + i * 12, z: 22, w: 8, d: 5, h: 3, wall: '#D8CBB4', roof: '#C4573A', roofH: 1.6,
    })),
    { type: 'dashed', x: 28, z: 24, w: 5, d: 4 },
  ],
  cast: [
    { story: '8cebca52-b981-4739-980c-c7bc3ea43116', label: 'Resident', pos: [-14, 0, -17], top: '#26BDE2', skin: 0xc68642, hair: 0x1b1b1b, style: 1, ry: 0.6 },
    { story: '191b291c-fe16-4b4d-96be-c3ef54f3d375', label: 'Press relay', pos: [34, 0, -6], top: '#544F4A', skin: 0xe0ac82, hair: 0x3b2a1e, ry: 0.5 },
    { story: '38a7ce9a-54b7-417c-81bf-6126f6a9b079', label: 'Press relay', pos: [36, 0, -4], top: '#6E4B00', skin: 0xf1c9a5, hair: 0x6b4423, ry: 0.5 },
    { story: 'f2c4d063-70a3-4655-8a2e-214c84e7c347', label: 'Press relay', pos: [34, 0, -2], top: '#902824', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.6 },
    { story: '2c8213bd-e045-4be1-b7e5-e6c097baea8e', label: 'Press relay', pos: [36, 0, 0], top: '#12525F', skin: 0xe0ac82, hair: 0x2a2a2a, ry: 0.5 },
    { story: 'd3b12aaa-af63-4734-800f-865e40c6312d', label: 'Press relay', pos: [34, 0, 2], top: '#3F5E8D', skin: 0xffdbb4, hair: 0xd9c28c, ry: 0.6 },
    { story: 'da37f542-bb35-4878-b7c4-363780ecd231', label: 'Press relay', pos: [36, 0, 4], top: '#A21942', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.5 },
    { story: '31a0a2e4-9dbb-4962-9fdb-fc648e4d2f91', label: 'Press relay', pos: [34, 0, 6], top: '#4C7A4C', skin: 0xf1c9a5, hair: 0x3b2a1e, ry: 0.6 },
    { story: 'e54254d0-72dd-430d-9e2e-402a03d1d4df', label: 'Press relay', pos: [36, 0, 8], top: '#00689D', skin: 0xe0ac82, hair: 0x1b1b1b, ry: 0.5 },
    { story: '082223aa-6656-4dcf-9236-d95541641ab0', label: 'Press relay', pos: [34, 0, 10], top: '#7C6A93', skin: 0xc68642, hair: 0x2a2a2a, ry: 0.6 },
    { story: '60d53bbb-c899-4498-abca-881f06d09e82', label: 'Resident', pos: [-4, 0, 8], top: '#FD6925', skin: 0x8d5524, hair: 0x1b1b1b, style: 0, ry: 0.9 },
    { story: '539dd7ac-5178-4be0-9c3c-bb6e1d348405', label: 'Resident', pos: [18, 0, -22], top: '#DDA63A', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.5 },
    { story: 'df5026ff-59fe-4c25-bae7-9d19eec4d45a', label: 'Press relay', pos: [36, 0, 12], top: '#544F4A', skin: 0xf1c9a5, hair: 0x6b4423, ry: 0.5 },
    { story: '285c56dd-6f59-4bd6-9095-b4b07180389b', label: 'Resident', pos: [-8, 0, 10], top: '#006F84', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: '3b2aa61a-ea76-4f79-8049-a9158d499b07', label: 'Press relay', pos: [34, 0, 14], top: '#6E4B00', skin: 0xe0ac82, hair: 0x3b2a1e, ry: 0.6 },
    { story: '0993a98a-010a-43ef-8744-802422e148f0', label: 'Theatre troupe', pos: [24, 0, 18], top: '#A21942', skin: 0xc68642, hair: 0x1b1b1b, style: 1, ry: 0.8 },
    { story: '1f95cb40-f6fc-4e6d-8737-23ca9d38c3e6', label: 'Theatre troupe', pos: [28, 0, 18], top: '#7C6A93', skin: 0xffdbb4, hair: 0xd9c28c, ry: 0.8 },
  ],
}
