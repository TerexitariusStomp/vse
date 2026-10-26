import type { DioramaSpec } from '../types'

// Kenya coast — the sea along the south, mangrove fringe on the creek edge,
// village bandas, the market strip, tree nursery, a charcoal pile at the edge.
export const kenyaCoast: DioramaSpec = {
  elements: [
    // the sea
    { type: 'water', w: 90, d: 16, pos: [0, 0.05, 36], opacity: 0.9 },
    // mangrove fringe along the shore
    { type: 'tree', points: [[-36, 27, 0.8], [-30, 28, 1], [-24, 27, 0.9], [-18, 28.5, 1.1], [-12, 27, 0.8], [-6, 28, 1], [0, 27.5, 0.9], [6, 28.5, 1], [12, 27, 0.8], [18, 28, 1.1], [24, 27, 0.9], [30, 28, 1], [36, 27.5, 0.8]] },
    // village bandas
    ...[0, 1, 2].map((i) => ({
      type: 'building' as const, x: -28 + i * 10, z: 8 - (i % 2) * 7, w: 6, d: 5, h: 2.8, wall: '#E4CEB0', roof: '#8A5A2B', roofH: 2, who: 'fc7db8cb-f97b-4283-a13e-24848e257442',
    })),
    { type: 'building', x: -34, z: -2, w: 5, d: 4, h: 2.6, wall: '#D8C6A0', roof: '#8A5A2B', who: 'fc7db8cb-f97b-4283-a13e-24848e257442' },
    // market strip on the road
    ...[0, 1, 2, 3].map((i) => ({
      type: 'props' as const, kind: 'stall' as const, x: 6 + i * 7, z: 2 + (i % 2) * 4, rot: (i % 2) * 0.4, who: '79843184-c116-45cb-863d-c5d4f80d87f0',
    })),
    // the road
    { type: 'box', size: [80, 0.08, 4], color: '#9A8A74', pos: [4, 0.08, -6] },
    // tree nursery — ordered plots
    { type: 'props', kind: 'garden', x: 26, z: -14, who: '3192ad3e-e7ca-4bd3-b048-36860857a8fb' },
    { type: 'props', kind: 'garden', x: 32, z: -12, who: '3192ad3e-e7ca-4bd3-b048-36860857a8fb' },
    // county office
    { type: 'building', x: 30, z: -24, w: 9, d: 6, h: 4.4, wall: '#D8E2EC', roof: '#3A5A8A', who: 'af89b747-0b58-44cd-9b69-a15fbd4757c6' },
    { type: 'props', kind: 'flag', x: 33, z: -24, y: 6.4, who: 'af89b747-0b58-44cd-9b69-a15fbd4757c6' },
    // borehole / well
    { type: 'pond', x: -4, z: -14, r: 1.4, who: '570574df-bdd5-4885-bb7a-12c108dd14cd' },
    { type: 'props', kind: 'pump', x: -2.5, z: -14, who: '570574df-bdd5-4885-bb7a-12c108dd14cd' },
    // charcoal pile at the forest edge — the counter-signal
    ...[0, 1, 2, 3, 4].map((i) => ({
      type: 'box' as const, size: [1.6, 0.5, 1] as [number, number, number], color: '#202428',
      pos: [-38 + (i % 3) * 1.8, 0.3, -20 - Math.floor(i / 3) * 1.4] as [number, number, number], who: '12990ec0-d36c-4589-b849-423ca2062f30',
    })),
    { type: 'tree', points: [[-40, -26, 1], [-34, -28, 0.9], [-40, -14, 0.8]] },
    // fields
    { type: 'fields', x: -18, z: -18, strips: 4, who: 'be5f2969-eec6-4d1f-8c2e-f119d05f7ade' },
    // boats inshore
    { type: 'props', kind: 'boat', x: -10, z: 33, rot: 0.4 },
    { type: 'props', kind: 'boat', x: 16, z: 32, rot: -0.5 },
  ],
  cast: [
    { story: '3192ad3e-e7ca-4bd3-b048-36860857a8fb', label: 'Nursery keeper', pos: [24, 0, -11], top: '#006425', skin: 0x8d5524, hair: 0x1b1b1b, tool: true, ry: 0.8 },
    { story: 'f75ec601-2ae5-4093-b164-4aa5a786ca26', label: 'Voucher issuer', pos: [10, 0, 4], top: '#006F84', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.7 },
    { story: '7b849a74-834e-459f-b8c5-a484d9d77ec7', label: 'Smallholder', pos: [-20, 0, -14], top: '#DDA63A', skin: 0x8d5524, hair: 0x2a2a2a, tool: true, hat: '#DDA63A', ry: 0.9 },
    { story: 'fc7db8cb-f97b-4283-a13e-24848e257442', label: 'Household', pos: [-26, 0, 12], top: '#7C6A93', skin: 0x8d5524, hair: 0x1b1b1b, style: 2, ry: 0.8 },
    { story: '570574df-bdd5-4885-bb7a-12c108dd14cd', label: 'Household', pos: [-5, 0, -11], top: '#A21942', skin: 0xc68642, hair: 0x1b1b1b, ry: 1 },
    { story: '0f04343b-3f88-4914-8dde-53bdbdb11f79', label: 'Smallholder', pos: [-16, 0, -15], top: '#6E4B00', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: '599c071a-c579-433a-b4f1-69ae4f1e3aeb', label: 'Commitment pool', pos: [2, 0, 6], top: '#12525F', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.6 },
    { story: 'e56013a9-d531-4763-8bfd-b18ceb471c42', label: 'Coast collective', pos: [0, 0, 10], top: '#26BDE2', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.8 },
    { story: '8cb9f51b-8122-4421-9cd2-3d94342159dc', label: 'Coast collective', pos: [4, 0, 12], top: '#3F5E8D', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.9 },
    { story: 'be5f2969-eec6-4d1f-8c2e-f119d05f7ade', label: 'Farmer, Kilifi N', pos: [-22, 0, -20], top: '#4C7A4C', skin: 0x8d5524, hair: 0x1b1b1b, tool: true, ry: 1 },
    { story: 'd018f30e-9bf0-455d-8eff-d0006134fdad', label: 'Savings group', pos: [6, 0, 8], top: '#FD6925', skin: 0x8d5524, hair: 0x1b1b1b, style: 1, ry: 0.7 },
    { story: 'd9b9cb32-d334-44ff-b8ef-732e1e4967af', label: 'Coast collective', pos: [-2, 0, 14], top: '#544F4A', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.8 },
    { story: '79843184-c116-45cb-863d-c5d4f80d87f0', label: 'Trader, Mnarani', pos: [14, 0, 3], top: '#FCC30B', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.5 },
    { story: '5fe79cd2-4d2b-4c44-9341-a074940c6719', label: 'Field team', pos: [20, 0, -18], top: '#00689D', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.8 },
    { story: '7c3e6dc9-a7c0-43ca-b227-4896af240eb4', label: 'Coast collective', pos: [-8, 0, 16], top: '#4AA3D6', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: '12990ec0-d36c-4589-b849-423ca2062f30', label: 'Conservation', pos: [-34, 0, -22], top: '#006425', skin: 0x8d5524, hair: 0x1b1b1b, hat: '#006425', ry: 0.8 },
    { story: 'af89b747-0b58-44cd-9b69-a15fbd4757c6', label: 'County govt', pos: [28, 0, -20], top: '#00689D', skin: 0x8d5524, hair: 0x1b1b1b, style: 3, ry: 0.8 },
    { story: '35365d8f-6e05-4920-b7a2-22321078ea38', label: 'nostr relay', pos: [34, 0, 16], top: '#902824', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.6 },
    { story: 'ce0cbaee-fc16-4f3d-ba2c-b2298e49e13c', label: 'Field team', pos: [22, 0, -16], top: '#26BDE2', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.7 },
    { story: '694c09c9-5546-4da3-b176-4cb94c2e63a8', label: 'Forest group', pos: [-36, 0, -18], top: '#006425', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.9 },
    { story: '7617da93-27de-45e6-b18b-347fc460005e', label: 'County govt', pos: [32, 0, -20], top: '#3F5E8D', skin: 0xc68642, hair: 0x1b1b1b, style: 3, ry: 0.7 },
    { story: '02d4ed4e-30f5-48a4-b762-08d24209bda9', label: 'nostr relay', pos: [36, 0, 18], top: '#6E4B00', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.5 },
    { story: '0cb0a8a9-21c1-4a6d-a603-81895e604c80', label: 'nostr relay', pos: [34, 0, 14], top: '#544F4A', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.6 },
    { story: '13d3eb96-8ad2-41f8-89a4-759b05dac062', label: 'nostr relay', pos: [36, 0, 12], top: '#A21942', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.5 },
    { story: '8b2dc898-f4d7-48a8-857a-0f735de9bfeb', label: 'nostr relay', pos: [38, 0, 16], top: '#12525F', skin: 0xc68642, hair: 0x1b1b1b, ry: 0.6 },
    { story: '41f79371-c05a-4da9-86a6-1b6ee38d77e5', label: 'nostr relay', pos: [38, 0, 10], top: '#FD6925', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.5 },
    { story: '054d1e4e-5878-471d-bd0d-d5d47659d6d5', label: 'nostr relay', pos: [36, 0, 20], top: '#7C6A93', skin: 0x8d5524, hair: 0x2a2a2a, ry: 0.6 },
    { story: '297b5752-8b59-4f82-8dc6-eddd28549b76', label: 'nostr relay', pos: [34, 0, 22], top: '#4C7A4C', skin: 0x8d5524, hair: 0x1b1b1b, ry: 0.5 },
  ],
}
